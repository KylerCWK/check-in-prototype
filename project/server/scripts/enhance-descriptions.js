#!/usr/bin/env node

console.log('��� Starting book description enhancement process...');

require('dotenv').config();
const mongoose = require('mongoose');
const BookDescriptionService = require('../src/services/bookDescriptionService');

async function enhanceBookDescriptions() {
    try {
        console.log('��� Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const bookService = new BookDescriptionService();
        
        console.log('�� Starting enhancement process...');
        const result = await bookService.enhanceAllBookDescriptions();
        
        console.log('\n��� Enhancement complete!');
        console.log(`✅ Enhanced: ${result.enhanced} books`);
        console.log(`❌ Failed: ${result.failed} books`);
        console.log(`��� Total processed: ${result.total} books`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('��� Disconnected from MongoDB');
        process.exit(0);
    }
}

enhanceBookDescriptions();
