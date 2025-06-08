require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Book = require('../models/Book');

/**
 * Publish Date Updater v1.0
 * Updates existing books in the database with missing publish dates
 */
class PublishDateUpdater {
    constructor(options = {}) {        this.BASE_URL = 'https://openlibrary.org';
        this.BATCH_SIZE = options.batchSize || 10; // Smaller batches
        this.MAX_BOOKS = options.maxBooks || 100; // Reduced for testing
        this.RETRY_ATTEMPTS = 3;
        this.RETRY_DELAY = 1000;
        this.stats = {
            processed: 0,
            updated: 0,
            errors: 0,
            noDateFound: 0,
            alreadyHaveDate: 0
        };
    }    async updatePublishDates() {
        try {
            console.log('📅 Starting publish date update for existing books...');
            console.log(`Max books to process: ${this.MAX_BOOKS}`);
            
            // Get books that need publish dates
            const booksNeedingDates = await this.getBooksNeedingDates();
            console.log(`Found ${booksNeedingDates.length} books needing publish dates`);
            
            if (booksNeedingDates.length === 0) {
                console.log('✅ All books already have publish dates!');
                return this.stats;
            }
            
            // Process books in batches
            const batches = this.createBatches(booksNeedingDates, this.BATCH_SIZE);
            console.log(`Processing ${batches.length} batches of ${this.BATCH_SIZE} books each`);
            
            for (let i = 0; i < batches.length; i++) {
                console.log(`\n📦 Processing batch ${i + 1}/${batches.length}...`);
                await this.processBatch(batches[i]);
                
                // Progress update
                const progress = ((i + 1) / batches.length * 100).toFixed(1);
                console.log(`Progress: ${progress}% (${this.stats.updated} updated, ${this.stats.errors} errors)`);
                
                // Rate limiting between batches
                if (i < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            this.printFinalStats();
            return this.stats;
            
        } catch (error) {
            console.error('❌ Error updating publish dates:', error);
            throw error;
        }
    }

    async getBooksNeedingDates() {
        try {
            // Find books that either don't have publishDate or have null publishDate
            const books = await Book.find({
                $or: [
                    { publishDate: null },
                    { publishDate: { $exists: false } }
                ],
                // Only process books that have an OLID (can be looked up)
                olid: { $exists: true, $ne: null }
            })
            .select('_id title author olid publishDate')
            .limit(this.MAX_BOOKS);
            
            return books;
            
        } catch (error) {
            console.error('Error finding books needing dates:', error);
            throw error;
        }
    }

    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    async processBatch(books) {
        const updatePromises = books.map(book => this.updateBookPublishDate(book));
        await Promise.allSettled(updatePromises);
    }

    async updateBookPublishDate(book) {
        this.stats.processed++;
        
        try {
            // Check if book already has a publish date (might have been updated since query)
            if (book.publishDate) {
                this.stats.alreadyHaveDate++;
                return;
            }
            
            console.log(`  🔍 Looking up: "${book.title}" by ${book.author}`);
            
            // Try multiple approaches to get the publish date
            let publishDate = null;
            
            // Approach 1: Look up by OLID (work)
            publishDate = await this.fetchPublishDateByOLID(book.olid);
            
            // Approach 2: If work doesn't have date, try to find editions
            if (!publishDate) {
                publishDate = await this.fetchPublishDateFromEditions(book.olid);
            }
            
            if (publishDate) {
                // Update the book with the found publish date
                await Book.findByIdAndUpdate(book._id, { 
                    publishDate: publishDate,
                    'dataQuality.freshness': 0.9, // Improved freshness
                    'processing.lastProcessed': new Date()
                });
                
                this.stats.updated++;
                const year = publishDate.getFullYear();
                console.log(`    ✅ Updated with date: ${year}`);
                
            } else {
                this.stats.noDateFound++;
                console.log(`    ⚠️ No publish date found`);
            }
            
            // Rate limiting for individual requests
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            this.stats.errors++;
            console.error(`    ❌ Error updating ${book.title}:`, error.message);
        }
    }

    async fetchPublishDateByOLID(olid) {
        try {
            const response = await axios.get(`${this.BASE_URL}/works/${olid}.json`, {
                timeout: 5000
            });
            
            if (response.data.first_publish_date) {
                return new Date(response.data.first_publish_date);
            }
            
            return null;
            
        } catch (error) {
            if (error.response?.status === 404) {
                // Book not found, that's okay
                return null;
            }
            throw error;
        }
    }

    async fetchPublishDateFromEditions(workOlid) {
        try {
            // Get editions for this work
            const response = await axios.get(`${this.BASE_URL}/works/${workOlid}/editions.json`, {
                timeout: 5000
            });
            
            if (response.data.entries && response.data.entries.length > 0) {
                // Look for the earliest publish date among editions
                let earliestDate = null;
                
                for (const edition of response.data.entries) {
                    if (edition.publish_date) {
                        const publishDate = new Date(edition.publish_date);
                        
                        // Make sure it's a valid date
                        if (!isNaN(publishDate.getTime())) {
                            if (!earliestDate || publishDate < earliestDate) {
                                earliestDate = publishDate;
                            }
                        }
                    }
                }
                
                return earliestDate;
            }
            
            return null;
            
        } catch (error) {
            // If editions endpoint fails, just return null
            return null;
        }
    }

    printFinalStats() {
        console.log('\n📊 Publish Date Update Results:');
        console.log('================================');
        console.log(`📚 Books processed: ${this.stats.processed}`);
        console.log(`✅ Books updated with dates: ${this.stats.updated}`);
        console.log(`📅 Books already had dates: ${this.stats.alreadyHaveDate}`);
        console.log(`⚠️ No date found: ${this.stats.noDateFound}`);
        console.log(`❌ Errors: ${this.stats.errors}`);
        
        if (this.stats.updated > 0) {
            const successRate = ((this.stats.updated / this.stats.processed) * 100).toFixed(1);
            console.log(`📈 Success rate: ${successRate}%`);
        }
    }

    // Utility method to check overall database state
    async checkDatabaseState() {
        try {
            const totalBooks = await Book.countDocuments();
            const booksWithDates = await Book.countDocuments({
                publishDate: { $exists: true, $ne: null }
            });
            const booksWithoutDates = totalBooks - booksWithDates;
            
            console.log('\n📊 Database State:');
            console.log('==================');
            console.log(`📚 Total books: ${totalBooks}`);
            console.log(`📅 Books with publish dates: ${booksWithDates} (${((booksWithDates/totalBooks)*100).toFixed(1)}%)`);
            console.log(`❓ Books without dates: ${booksWithoutDates} (${((booksWithoutDates/totalBooks)*100).toFixed(1)}%)`);
            
            return {
                total: totalBooks,
                withDates: booksWithDates,
                withoutDates: booksWithoutDates,
                coverage: (booksWithDates / totalBooks) * 100
            };
            
        } catch (error) {
            console.error('Error checking database state:', error);
            return null;
        }
    }
}

async function updatePublishDates() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 Connected to MongoDB');        const updater = new PublishDateUpdater({
            batchSize: 15,
            maxBooks: 150 // Increase batch size since it's working well
        });
        
        // Check initial state
        await updater.checkDatabaseState();
        
        // Run the update
        await updater.updatePublishDates();
        
        // Check final state
        console.log('\n📊 Final Database State:');
        await updater.checkDatabaseState();
        
        console.log('\n✅ Publish date update completed!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Update failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    updatePublishDates();
}

module.exports = PublishDateUpdater;
