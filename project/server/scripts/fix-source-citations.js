#!/usr/bin/env node

console.log('🔧 Fixing source citations in existing descriptions...');

try {
    require('dotenv').config();
    console.log('✅ Environment loaded');
} catch (error) {
    console.error('❌ Error loading environment:', error.message);
    process.exit(1);
}

const mongoose = require('mongoose');
const Book = require('../src/models/Book');
const BookDescriptionService = require('../src/services/bookDescriptionService');

async function fixSourceCitations() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const service = new BookDescriptionService();

        // Find books that have source citations in their descriptions
        const booksWithCitations = await Book.find({
            $or: [
                { description: { $regex: /\[Source\]\[\d+\]/ } },
                { description: { $regex: /\[\d+\]:\s*https?:\/\// } },
                { 'aiAnalysis.enhancedDescription': { $regex: /\[Source\]\[\d+\]/ } },
                { 'aiAnalysis.enhancedDescription': { $regex: /\[\d+\]:\s*https?:\/\// } }
            ]
        });

        console.log(`📚 Found ${booksWithCitations.length} books with source citations to fix`);

        let fixed = 0;

        for (let i = 0; i < booksWithCitations.length; i++) {
            const book = booksWithCitations[i];
            console.log(`\n🔄 Fixing ${i + 1}/${booksWithCitations.length}: "${book.title}"`);

            let updated = false;

            // Clean the main description
            if (book.description) {
                const cleanedDescription = service.cleanDescription(book.description);
                if (cleanedDescription !== book.description) {
                    console.log(`  📝 Cleaned main description`);
                    book.description = cleanedDescription;
                    updated = true;
                }
            }

            // Clean the enhanced description
            if (book.aiAnalysis?.enhancedDescription) {
                // Split the enhanced description into main part and AI insights
                const parts = book.aiAnalysis.enhancedDescription.split('AI Insights');
                if (parts.length > 0) {
                    const cleanedMainPart = service.cleanDescription(parts[0]);
                    
                    if (parts.length > 1) {
                        // Reconstruct with cleaned main part + AI insights
                        const newEnhancedDescription = cleanedMainPart + '\n\nAI Insights' + parts[1];
                        if (newEnhancedDescription !== book.aiAnalysis.enhancedDescription) {
                            console.log(`  🤖 Cleaned enhanced description`);
                            book.aiAnalysis.enhancedDescription = newEnhancedDescription;
                            updated = true;
                        }
                    } else {
                        // No AI insights, just clean the whole thing
                        if (cleanedMainPart !== book.aiAnalysis.enhancedDescription) {
                            console.log(`  🤖 Cleaned enhanced description (no AI insights)`);
                            book.aiAnalysis.enhancedDescription = cleanedMainPart;
                            updated = true;
                        }
                    }
                }
            }

            if (updated) {
                await book.save();
                fixed++;
                console.log(`  ✅ Fixed citations for "${book.title}"`);
            } else {
                console.log(`  ℹ️ No citations found in "${book.title}"`);
            }
        }

        console.log(`\n📊 Citation Fix Summary:`);
        console.log(`✅ Fixed: ${fixed}`);
        console.log(`📚 Total checked: ${booksWithCitations.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

fixSourceCitations().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});
