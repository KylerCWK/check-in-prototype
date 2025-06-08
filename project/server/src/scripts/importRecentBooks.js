require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Book = require('../models/Book');

/**
 * Recent Books Importer v1.0
 * Specifically focuses on importing recent releases with publish dates
 */
class RecentBooksImporter {
    constructor(options = {}) {
        this.BASE_URL = 'https://openlibrary.org';
        this.MAX_BOOKS = options.maxBooks || 200; // Reduced for initial run
        this.CURRENT_YEAR = new Date().getFullYear();
        this.RETRY_ATTEMPTS = 3;
        this.RETRY_DELAY = 2000;
        this.processedCount = 0;
        this.stats = {
            imported: 0,
            updated: 0,
            errors: 0,
            withPublishDates: 0
        };
    }

    async importRecentBooks() {
        try {            console.log('🔍 Importing recent books with publish dates from OpenLibrary...');
            console.log(`Target year range: ${this.CURRENT_YEAR - 15} - ${this.CURRENT_YEAR}`);
            
            // Focus on subjects that are more likely to have recent releases
            const popularSubjects = [
                'fiction', 'mystery', 'romance', 'fantasy', 'science_fiction',
                'thriller', 'contemporary', 'young_adult', 'literature',
                'biography', 'self_help', 'technology', 'psychology'
            ];
            
            let allBooks = [];
            
            for (const subject of popularSubjects) {
                if (this.processedCount >= this.MAX_BOOKS) break;
                
                console.log(`\n📚 Fetching recent books from: ${subject}`);
                const books = await this.fetchRecentBooksFromSubject(subject);
                
                if (books.length > 0) {
                    allBooks.push(...books);
                    console.log(`  ✅ Found ${books.length} recent books in ${subject}`);
                } else {
                    console.log(`  ⚠️ No recent books found in ${subject}`);
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (allBooks.length > 0) {
                console.log(`\n💾 Saving ${allBooks.length} books to database...`);
                await this.saveBooksToDatabase(allBooks);
            }
            
            // Update existing books missing publish dates
            await this.updateExistingBooksWithPublishDates();
            
            this.printStats();
            return this.stats;
            
        } catch (error) {
            console.error('❌ Error importing recent books:', error);
            throw error;
        }
    }

    async fetchRecentBooksFromSubject(subject) {
        const books = [];
        let attempt = 0;
        
        while (attempt < this.RETRY_ATTEMPTS) {
            try {
                // Fetch books from subject
                const response = await axios.get(
                    `${this.BASE_URL}/subjects/${subject}.json?limit=100&offset=0`
                );
                  if (response.data.works && Array.isArray(response.data.works)) {
                    console.log(`    📖 Found ${response.data.works.length} total works in ${subject}`);
                    
                    const validBooks = response.data.works.filter(book => this.isValidRecentBook(book));
                    console.log(`    📅 ${validBooks.length} books have recent publish dates`);
                    
                    const recentBooks = validBooks
                        .map(book => this.transformBookData(book, subject))
                        .filter(book => book.publishDate); // Only keep books with publish dates
                    
                    books.push(...recentBooks);
                    this.stats.withPublishDates += recentBooks.length;
                } else {
                    console.log(`    ❌ No works array found for ${subject}`);
                }
                
                break; // Success, exit retry loop
                
            } catch (error) {
                attempt++;
                console.error(`  ❌ Error fetching ${subject} (attempt ${attempt}):`, error.message);
                
                if (attempt < this.RETRY_ATTEMPTS) {
                    console.log(`  🔄 Retrying in ${this.RETRY_DELAY}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                } else {
                    console.error(`  💥 Failed to fetch ${subject} after ${this.RETRY_ATTEMPTS} attempts`);
                }
            }
        }
        
        return books;
    }

    isValidRecentBook(book) {
        // Basic validation
        if (!book.title || !book.authors?.length || !book.key) {
            return false;
        }
        
        // Check if it has a recent publication date
        if (book.first_publish_date) {
            const publishDate = new Date(book.first_publish_date);
            const publishYear = publishDate.getFullYear();
              // Only consider books from the last 15 years for better results
            return publishYear >= (this.CURRENT_YEAR - 15) && publishYear <= this.CURRENT_YEAR;
        }
        
        return false;
    }

    transformBookData(book, subject) {
        const publishDate = new Date(book.first_publish_date);
        
        // Clean and normalize genres
        const genres = new Set([subject.replace(/_/g, ' ')]);
        if (book.subjects) {
            book.subjects
                .map(s => s.toLowerCase().replace(/_/g, ' '))
                .filter(s => s.length < 30)
                .slice(0, 4) // Limit subjects to avoid too many genres
                .forEach(s => genres.add(s));
        }

        return {
            olid: book.key.split('/')[2],
            title: book.title.trim(),
            author: book.authors?.[0]?.name || 'Unknown',
            publishDate,
            genres: Array.from(genres).slice(0, 5),
            topics: [],
            coverUrl: book.cover_id ? 
                `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg` : null,
            description: book.description?.value || book.description || '',
            
            // Enhanced fields for new schema
            embeddings: {
                textual: [],
                semantic: [],
                style: [],
                emotional: [],
                combined: []
            },
            
            metadata: {
                pageCount: book.number_of_pages || null,
                language: book.language?.key === '/languages/eng' ? 'eng' : 'other',
                readingLevel: null,
                isbn: book.isbn_13 || book.isbn_10 || null,
                publisher: book.publisher?.[0] || null,
                wordCount: null,
                averageWordsPerPage: null,
                estimatedReadingTime: null,
                contentWarnings: [],
                targetAudience: null
            },
            
            aiAnalysis: {
                themes: [],
                moodTags: [],
                characters: [],
                plotElements: {
                    setting: null,
                    timeperiod: null,
                    narrative: null,
                    pacing: null
                },
                complexityScore: null,
                emotionalIntensity: null,
                intellectualChallenge: null,
                culturalContext: null,
                socialRelevance: null,
                uniquenessScore: null,
                predictions: {
                    popularityScore: null,
                    controversyScore: null,
                    ageAppropriatenessScore: null,
                    literaryMerit: null,
                    commercialAppeal: null
                },
                clusters: {
                    thematicCluster: null,
                    styleCluster: null,
                    genreCluster: null,
                    audienceCluster: null
                },
                contentAnalysis: {
                    sentimentDistribution: {
                        positive: null,
                        neutral: null,
                        negative: null
                    },
                    topKeywords: [],
                    namedEntities: [],
                    culturalReferences: [],
                    timeReferences: [],
                    locationReferences: []
                },
                lastAnalyzed: null,
                analysisVersion: null
            },
            
            stats: {
                viewCount: 0,
                checkInCount: 0,
                rating: Math.random() * 2 + 3, // Random rating between 3-5
                reviewCount: 0,
                completionRate: 0,
                averageReadingTime: 0,
                bookmarkCount: 0,
                shareCount: 0,
                engagement: {
                    averageSessionDuration: null,
                    returnRate: null,
                    recommendationClickRate: null,
                    searchDiscoveryRate: null
                },
                trending: {
                    daily: 0,
                    weekly: 0,
                    monthly: 0
                },
                lastViewed: null,
                firstViewed: null
            },
            
            dataQuality: {
                completeness: 0.7, // Recent books typically have better data
                accuracy: 0.8,
                freshness: 1.0,
                enrichment: 0.3
            },
            
            processing: {
                embeddingsGenerated: false,
                aiAnalysisComplete: false,
                qualityChecked: false,
                needsReprocessing: false,
                lastProcessed: null
            }
        };
    }

    async saveBooksToDatabase(books) {
        const operations = [];
        
        for (const bookData of books) {
            operations.push({
                updateOne: {
                    filter: { olid: bookData.olid },
                    update: { $setOnInsert: bookData },
                    upsert: true
                }
            });
        }

        try {
            const result = await Book.bulkWrite(operations, { ordered: false });
            this.stats.imported = result.upsertedCount;
            this.stats.updated = result.modifiedCount;
            
            console.log(`  ✅ ${result.upsertedCount} new books imported`);
            console.log(`  🔄 ${result.modifiedCount} existing books updated`);
            
        } catch (error) {
            console.error('❌ Error saving books:', error.message);
            this.stats.errors++;
        }
    }

    async updateExistingBooksWithPublishDates() {
        console.log('\n🔍 Updating existing books missing publish dates...');
        
        try {
            // Find books without publish dates that have OLIDs
            const booksNeedingDates = await Book.find({
                $or: [
                    { publishDate: null },
                    { publishDate: { $exists: false } }
                ],
                olid: { $exists: true, $ne: null }
            }).limit(100); // Process in batches
            
            console.log(`Found ${booksNeedingDates.length} books needing publish dates`);
            
            let updatedCount = 0;
            
            for (const book of booksNeedingDates) {
                try {
                    const publishDate = await this.fetchPublishDateFromOpenLibrary(book.olid);
                    
                    if (publishDate) {
                        book.publishDate = publishDate;
                        await book.save();
                        updatedCount++;
                        
                        if (updatedCount % 10 === 0) {
                            console.log(`  📅 Updated ${updatedCount} books with publish dates`);
                        }
                    }
                    
                    // Rate limiting to be nice to OpenLibrary API
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (error) {
                    console.error(`  ❌ Error updating ${book.title}:`, error.message);
                    this.stats.errors++;
                }
            }
            
            console.log(`  ✅ Successfully updated ${updatedCount} books with publish dates`);
            
        } catch (error) {
            console.error('❌ Error in updateExistingBooksWithPublishDates:', error);
        }
    }

    async fetchPublishDateFromOpenLibrary(olid) {
        try {
            const response = await axios.get(`${this.BASE_URL}/works/${olid}.json`);
            const workData = response.data;
            
            if (workData.first_publish_date) {
                return new Date(workData.first_publish_date);
            }
            
            return null;
            
        } catch (error) {
            // Silently fail for individual book lookups
            return null;
        }
    }

    printStats() {
        console.log('\n📊 Import Results:');
        console.log('==================');
        console.log(`📚 Books with publish dates found: ${this.stats.withPublishDates}`);
        console.log(`✅ New books imported: ${this.stats.imported}`);
        console.log(`🔄 Existing books updated: ${this.stats.updated}`);
        console.log(`❌ Errors encountered: ${this.stats.errors}`);
        console.log(`📈 Total books processed: ${this.stats.imported + this.stats.updated}`);
    }
}

async function importRecentBooks() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 Connected to MongoDB');
          const importer = new RecentBooksImporter({
            maxBooks: 100 // Start smaller
        });
        
        await importer.importRecentBooks();
        
        console.log('\n✅ Recent books import completed!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Import failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    importRecentBooks();
}

module.exports = RecentBooksImporter;
