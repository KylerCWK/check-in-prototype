#!/usr/bin/env node
/**
 * Script to enhance book descriptions from Open Library and AI
 * Usage: node enhanceBookDescriptions.js [--limit=N] [--specific-book=OLID]
 */

const mongoose = require('mongoose');
const path = require('path');
const BookDescriptionService = require('../services/bookDescriptionService');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class DescriptionEnhancer {
    constructor() {
        this.service = new BookDescriptionService();
    }

    async run() {
        try {
            console.log('📚 Book Description Enhancement Tool');
            console.log('=====================================\n');

            // Parse command line arguments
            const args = process.argv.slice(2);
            const limitArg = args.find(arg => arg.startsWith('--limit='));
            const specificBookArg = args.find(arg => arg.startsWith('--specific-book='));
            
            const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;
            const specificOlid = specificBookArg ? specificBookArg.split('=')[1] : null;

            // Connect to MongoDB
            console.log('🔌 Connecting to MongoDB...');
            await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
            console.log('✅ Connected to MongoDB\n');

            if (specificOlid) {
                await this.enhanceSpecificBook(specificOlid);
            } else {
                await this.enhanceAllBooks(limit);
            }

        } catch (error) {
            console.error('❌ Enhancement failed:', error);
            process.exit(1);
        } finally {
            await mongoose.disconnect();
            console.log('\n🔌 Disconnected from MongoDB');
        }
    }

    async enhanceSpecificBook(olid) {
        console.log(`🎯 Enhancing specific book: ${olid}\n`);
        
        const Book = require('../models/Book');
        const book = await Book.findOne({ olid });
        
        if (!book) {
            console.error(`❌ Book with OLID "${olid}" not found`);
            return;
        }

        console.log(`📖 Found: "${book.title}" by ${book.author}`);
        const result = await this.service.enhanceBookDescription(book);
        
        if (result.enhanced) {
            console.log('✅ Book description enhanced successfully!');
            
            // Display the results
            console.log('\n📝 Enhancement Results:');
            console.log('=======================');
            
            if (book.description) {
                console.log('\n📖 Original Description:');
                console.log('-'.repeat(50));
                console.log(book.description.substring(0, 200) + (book.description.length > 200 ? '...' : ''));
            }
            
            if (book.aiAnalysis?.enhancedDescription) {
                console.log('\n🤖 AI-Enhanced Description:');
                console.log('-'.repeat(50));
                console.log(book.aiAnalysis.enhancedDescription);
            }
        } else {
            console.log('ℹ️ Book description was already complete');
        }
    }

    async enhanceAllBooks(limit = null) {
        console.log(`🚀 Starting bulk description enhancement${limit ? ` (limit: ${limit})` : ''}...\n`);
        
        if (limit) {
            // Temporarily modify the service to respect the limit
            const originalEnhance = this.service.enhanceAllBookDescriptions;
            this.service.enhanceAllBookDescriptions = async function() {
                const Book = require('../models/Book');
                const booksToEnhance = await Book.find({
                    $or: [
                        { description: { $exists: false } },
                        { description: '' },
                        { description: { $regex: /^.{0,50}$/ } },
                        { 'aiAnalysis.enhancedDescription': { $exists: false } }
                    ]
                }).limit(limit);

                console.log(`📚 Found ${booksToEnhance.length} books that need description enhancement (limited to ${limit})`);

                let enhanced = 0;
                let failed = 0;

                for (let i = 0; i < booksToEnhance.length; i++) {
                    const book = booksToEnhance[i];
                    console.log(`\n🔄 Processing ${i + 1}/${booksToEnhance.length}: "${book.title}"`);

                    try {
                        const result = await this.enhanceBookDescription(book);
                        if (result.enhanced) {
                            enhanced++;
                            console.log(`✅ Enhanced: ${book.title}`);
                        } else {
                            console.log(`⚠️ No enhancement needed: ${book.title}`);
                        }
                    } catch (error) {
                        failed++;
                        console.error(`❌ Failed to enhance "${book.title}":`, error.message);
                    }

                    if (i < booksToEnhance.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                console.log(`\n📊 Enhancement Summary:`);
                console.log(`✅ Enhanced: ${enhanced}`);
                console.log(`❌ Failed: ${failed}`);
                console.log(`📚 Total processed: ${booksToEnhance.length}`);

                return { enhanced, failed, total: booksToEnhance.length };
            }.bind(this.service);
        }

        const results = await this.service.enhanceAllBookDescriptions();
        
        console.log('\n🎉 Bulk enhancement completed!');
        console.log(`📊 Final Results: ${results.enhanced} enhanced, ${results.failed} failed, ${results.total} total`);
    }
}

// Run if called directly
if (require.main === module) {
    const enhancer = new DescriptionEnhancer();
    enhancer.run().catch(console.error);
}

module.exports = DescriptionEnhancer;
