#!/usr/bin/env node

console.log('í´ Starting book description check...');

try {
    require('dotenv').config();
    console.log('â Environment variables loaded');
} catch (error) {
    console.error('â Error loading environment:', error.message);
    process.exit(1);
}

const mongoose = require('mongoose');
const Book = require('../src/models/Book');

async function checkSpecificBooks() {
    try {
        console.log('í´ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('â Connected to MongoDB');

        // Check Harry Potter specifically
        console.log('\ní³ Looking for Harry Potter books...');
        const harryPotterBooks = await Book.find({
            title: { $regex: /harry potter/i }
        }).limit(3);

        console.log(`Found ${harryPotterBooks.length} Harry Potter books:`);
        
        for (const book of harryPotterBooks) {
            console.log(`\ní³ Book: "${book.title}" by ${book.author}`);
            console.log(`í³ Description length: ${book.description ? book.description.length : 0} chars`);
            if (book.description && book.description.length > 0) {
                console.log(`í³ Description preview: ${book.description.substring(0, 100)}...`);
            }
            console.log(`í´ Has AI Analysis: ${book.aiAnalysis ? 'Yes' : 'No'}`);
            if (book.aiAnalysis?.enhancedDescription) {
                console.log(`í´ Enhanced description length: ${book.aiAnalysis.enhancedDescription.length} chars`);
            }
        }

        // Check overall stats
        console.log('\ní³ Overall Book Statistics:');
        const totalBooks = await Book.countDocuments();
        console.log(`í³ Total books: ${totalBooks}`);

    } catch (error) {
        console.error('â Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\ní´ Disconnected from MongoDB');
    }
}

checkSpecificBooks().catch(error => {
    console.error('â Unhandled error:', error);
    process.exit(1);
});
