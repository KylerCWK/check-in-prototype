const axios = require('axios');
const Book = require('../models/Book');

class OpenLibraryImporter {
    constructor(options = {}) {
        this.BASE_URL = 'https://openlibrary.org';
        this.BATCH_SIZE = 50;
        this.MAX_BOOKS = options.maxBooks || 1000;
        this.MIN_YEAR = 1950;
        this.RETRY_ATTEMPTS = 3;
        this.RETRY_DELAY = 2000;
        this.processedCount = 0;
    }

    async importPopularBooks() {
        console.log('Fetching popular books from OpenLibrary...');
        try {
            const subjects = [
                'fiction', 'fantasy', 'science_fiction', 'mystery', 
                'thriller', 'romance', 'contemporary', 'literature',
                'young_adult', 'biography', 'self_help', 'business',
                'technology', 'psychology', 'philosophy', 'science'
            ];
            
            let books = [];
            for (const subject of subjects) {
                if (this.processedCount >= this.MAX_BOOKS) break;
                
                let attempt = 0;
                let success = false;
                
                while (attempt < this.RETRY_ATTEMPTS && !success) {
                    try {
                        const response = await axios.get(
                            `${this.BASE_URL}/subjects/${subject}.json?limit=50`
                        );
                        
                        if (response.data.works && Array.isArray(response.data.works)) {
                            const subjectBooks = response.data.works
                                .filter(book => this.isValidBook(book))
                                .map(book => this.transformBookData(book, subject));
                            
                            books.push(...subjectBooks);
                            this.processedCount += subjectBooks.length;
                            console.log(`Processed ${subjectBooks.length} books from ${subject}`);
                            success = true;
                        } else {
                            console.log(`No works found for subject: ${subject}`);
                            success = true; // Skip this subject
                        }
                    } catch (error) {
                        attempt++;
                        console.error(`Error fetching ${subject}:`, error.message);
                        if (attempt < this.RETRY_ATTEMPTS) {
                            console.log(`Retrying ${subject} in ${this.RETRY_DELAY}ms...`);
                            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                        }
                    }
                }
                
                // Add delay between subjects to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (books.length > 0) {
                await this.saveBatch(books);
                console.log(`Successfully imported ${this.processedCount} books`);
            } else {
                console.log('No valid books found to import');
            }
            
        } catch (error) {
            console.error('Error importing popular books:', error);
            throw error;
        }
    }

    isValidBook(book) {
        // Basic validation - require only essential fields
        return book.title && 
               book.authors?.length > 0 && 
               book.key; // Every OpenLibrary book should have a key
    }

    transformBookData(book, subject) {
        // Extract year from publish date if available
        const publishDate = book.first_publish_date ? new Date(book.first_publish_date) : null;
        
        // Clean and normalize genres, starting with the current subject
        const genres = new Set([subject.replace(/_/g, ' ')]);
        if (book.subjects) {
            book.subjects
                .map(s => s.toLowerCase().replace(/_/g, ' '))
                .filter(s => s.length < 30)
                .forEach(s => genres.add(s));
        }

        // Basic book object matching our schema
        return {
            olid: book.key.split('/')[2],
            title: book.title.trim(),
            author: book.authors?.[0]?.name || 'Unknown',
            publishDate,
            genres: Array.from(genres).slice(0, 5), // Keep top 5 most relevant genres
            topics: [],
            coverUrl: book.cover_id ? 
                `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg` : null,
            description: book.description?.value || book.description || '',
            embeddings: [], // Will be generated later by AI
            metadata: {
                pageCount: book.number_of_pages,
                language: book.language?.key === '/languages/eng' ? 'eng' : 'other',
                readingLevel: null, // To be determined by AI
                isbn: book.isbn_13 || book.isbn_10 || null,
                publisher: book.publisher?.[0] || null
            },
            aiAnalysis: {
                themes: [], // To be generated by AI
                moodTags: [], // To be generated by AI
                complexityScore: null, // To be calculated
                recommendationScore: 0
            },
            stats: {
                viewCount: 0,
                checkInCount: 0,
                rating: 0
            }
        };
    }

    async saveBatch(books) {
        try {
            await Book.insertMany(books, { 
                ordered: false,
                skipDuplicates: true
            });
        } catch (error) {
            if (!error.writeErrors) {
                console.error('Error saving batch:', error);
                throw error;
            } else {
                // Log duplicate key errors without failing
                const duplicates = error.writeErrors.filter(e => e.code === 11000).length;
                console.log(`Skipped ${duplicates} duplicate books`);
            }
        }
    }
}

module.exports = OpenLibraryImporter;
