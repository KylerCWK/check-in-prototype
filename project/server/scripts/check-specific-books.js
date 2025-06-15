#!/usr/bin/env node

console.log('� Starting book description check...');

try {
    require('dotenv').config();
    console.log('✅ Environment variables loaded');
} catch (error) {
    console.error('❌ Error loading environment:', error.message);
    process.exit(1);
}

const mongoose = require('mongoose');
const Book = require('../src/models/Book');

async function checkSpecificBooks() {
    try {
        console.log('� Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check Harry Potter specifically
        console.log('\n� Looking for Harry Potter books...');
        const harryPotterBooks = await Book.find({
            title: { $regex: /harry potter/i }
        }).limit(3);

        console.log(`Found ${harryPotterBooks.length} Harry Potter books:`);
        
        for (const book of harryPotterBooks) {
            console.log(`\n� Book: "${book.title}" by ${book.author}`);
            console.log(`� Description length: ${book.description ? book.description.length : 0} chars`);
            if (book.description && book.description.length > 0) {
                console.log(`� Description preview: ${book.description.substring(0, 100)}...`);
            }
            console.log(`� Has AI Analysis: ${book.aiAnalysis ? 'Yes' : 'No'}`);
            if (book.aiAnalysis?.enhancedDescription) {
                console.log(`� Enhanced description length: ${book.aiAnalysis.enhancedDescription.length} chars`);
            }
        }

        // Check overall stats
        console.log('\n� Overall Book Statistics:');
        const totalBooks = await Book.countDocuments();
        console.log(`� Total books: ${totalBooks}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n� Disconnected from MongoDB');
    }
}

checkSpecificBooks().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});
