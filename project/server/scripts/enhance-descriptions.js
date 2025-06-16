#!/usr/bin/env node

console.log('Ì∫Ä Starting book description enhancement process...');

require('dotenv').config();
const mongoose = require('mongoose');
const BookDescriptionService = require('../src/services/bookDescriptionService');

async function enhanceBookDescriptions() {
    try {
        console.log('Ì¥å Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('‚úÖ Connected to MongoDB');

        const bookService = new BookDescriptionService();
        
        console.log('ÔøΩÔøΩ Starting enhancement process...');
        const result = await bookService.enhanceAllBookDescriptions();
        
        console.log('\nÌæâ Enhancement complete!');
        console.log(`‚úÖ Enhanced: ${result.enhanced} books`);
        console.log(`‚ùå Failed: ${result.failed} books`);
        console.log(`Ì≥ö Total processed: ${result.total} books`);

    } catch (error) {
        console.error('‚ùå Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Ì¥å Disconnected from MongoDB');
        process.exit(0);
    }
}

enhanceBookDescriptions();
