/**
 * Generate Embeddings for Books Script
 * 
 * This script generates embeddings for books in the database
 * using the configured embedding service.
 */

const mongoose = require('mongoose');
const Book = require('../models/Book');
const embeddingService = require('../services/embeddingService');
require('dotenv').config();

async function generateEmbeddingsForBooks() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/check-in-prototype');
        console.log('📊 Connected to MongoDB');

        // Find books that need embeddings generated
        const booksNeedingEmbeddings = await Book.find({
            $or: [
                { 'processing.embeddingsGenerated': false },
                { 'processing.embeddingsGenerated': { $exists: false } },
                { 'embeddings.combined': { $exists: false } },
                { 'processing.needsReprocessing': true }
            ]
        });

        console.log(`📚 Found ${booksNeedingEmbeddings.length} books needing embeddings`);

        if (booksNeedingEmbeddings.length === 0) {
            console.log('✅ All books already have embeddings generated');
            process.exit(0);
        }

        let processed = 0;
        let errors = 0;

        // Process books in batches to avoid overwhelming the embedding service
        const batchSize = 10;
        for (let i = 0; i < booksNeedingEmbeddings.length; i += batchSize) {
            const batch = booksNeedingEmbeddings.slice(i, i + batchSize);
            
            console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(booksNeedingEmbeddings.length / batchSize)}`);

            // Process batch concurrently
            const batchPromises = batch.map(async (book) => {
                try {
                    console.log(`   📖 Generating embeddings for: ${book.title} by ${book.author}`);

                    // Prepare book data for embedding generation
                    const bookData = {
                        title: book.title,
                        author: book.author,
                        description: book.description || '',
                        genres: book.genres || [],
                        themes: book.aiAnalysis?.themes || [],
                        moodTags: book.aiAnalysis?.moodTags || []
                    };

                    // Generate embeddings
                    const embeddings = await embeddingService.generateBookEmbeddings(bookData);

                    // Update book with new embeddings
                    book.embeddings = embeddings;
                    book.processing.embeddingsGenerated = true;
                    book.processing.needsReprocessing = false;
                    book.processing.lastProcessed = new Date();

                    // Calculate data quality
                    book.calculateDataQuality();

                    await book.save();

                    processed++;
                    console.log(`   ✅ Generated embeddings for: ${book.title}`);

                } catch (error) {
                    console.error(`   ❌ Error processing ${book.title}:`, error.message);
                    errors++;
                    
                    // Mark as needing reprocessing
                    try {
                        book.processing.needsReprocessing = true;
                        await book.save();
                    } catch (saveError) {
                        console.error(`   ❌ Failed to save error state for ${book.title}:`, saveError.message);
                    }
                }
            });

            // Wait for batch to complete
            await Promise.all(batchPromises);

            // Add a small delay between batches to be respectful to embedding APIs
            if (i + batchSize < booksNeedingEmbeddings.length) {
                console.log('   ⏳ Waiting 2 seconds before next batch...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.log(`\n📊 Embedding generation complete!`);
        console.log(`   ✅ Successfully processed: ${processed} books`);
        console.log(`   ❌ Errors: ${errors} books`);
        console.log(`   📈 Success rate: ${((processed / (processed + errors)) * 100).toFixed(1)}%`);

        // Generate summary statistics
        const totalBooks = await Book.countDocuments();
        const booksWithEmbeddings = await Book.countDocuments({ 'processing.embeddingsGenerated': true });
        const booksNeedingReprocessing = await Book.countDocuments({ 'processing.needsReprocessing': true });

        console.log(`\n📈 Database Statistics:`);
        console.log(`   📚 Total books: ${totalBooks}`);
        console.log(`   ✅ Books with embeddings: ${booksWithEmbeddings}`);
        console.log(`   🔄 Books needing reprocessing: ${booksNeedingReprocessing}`);
        console.log(`   📊 Coverage: ${((booksWithEmbeddings / totalBooks) * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('❌ Error in embedding generation script:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Function to regenerate embeddings for specific books
async function regenerateEmbeddingsForBooks(bookIds = []) {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/check-in-prototype');
        console.log('📊 Connected to MongoDB');

        const query = bookIds.length > 0 
            ? { _id: { $in: bookIds.map(id => mongoose.Types.ObjectId(id)) } }
            : {};

        const books = await Book.find(query);
        console.log(`📚 Found ${books.length} books to regenerate embeddings`);

        for (const book of books) {
            try {
                console.log(`🔄 Regenerating embeddings for: ${book.title}`);

                const bookData = {
                    title: book.title,
                    author: book.author,
                    description: book.description || '',
                    genres: book.genres || [],
                    themes: book.aiAnalysis?.themes || [],
                    moodTags: book.aiAnalysis?.moodTags || []
                };

                const embeddings = await embeddingService.generateBookEmbeddings(bookData);

                book.embeddings = embeddings;
                book.processing.embeddingsGenerated = true;
                book.processing.needsReprocessing = false;
                book.processing.lastProcessed = new Date();

                await book.save();
                console.log(`✅ Regenerated embeddings for: ${book.title}`);

            } catch (error) {
                console.error(`❌ Error regenerating embeddings for ${book.title}:`, error.message);
            }
        }

    } catch (error) {
        console.error('❌ Error in regeneration script:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Function to validate embeddings quality
async function validateEmbeddings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/check-in-prototype');
        console.log('📊 Connected to MongoDB');

        const booksWithEmbeddings = await Book.find({ 'processing.embeddingsGenerated': true });
        console.log(`🔍 Validating ${booksWithEmbeddings.length} books with embeddings`);

        let validEmbeddings = 0;
        let invalidEmbeddings = 0;

        for (const book of booksWithEmbeddings) {
            const isValid = (
                book.embeddings?.combined?.length === 768 &&
                book.embeddings?.semantic?.length === 384 &&
                book.embeddings?.emotional?.length === 128 &&
                book.embeddings?.textual?.length === 512 &&
                book.embeddings?.style?.length === 256
            );

            if (isValid) {
                validEmbeddings++;
            } else {
                invalidEmbeddings++;
                console.log(`❌ Invalid embeddings: ${book.title} - ${book._id}`);
                
                // Mark for reprocessing
                book.processing.needsReprocessing = true;
                await book.save();
            }
        }

        console.log(`\n📊 Validation Results:`);
        console.log(`   ✅ Valid embeddings: ${validEmbeddings}`);
        console.log(`   ❌ Invalid embeddings: ${invalidEmbeddings}`);
        console.log(`   📈 Validity rate: ${((validEmbeddings / (validEmbeddings + invalidEmbeddings)) * 100).toFixed(1)}%`);

    } catch (error) {
        console.error('❌ Error in validation script:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Command line interface
if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'generate':
            generateEmbeddingsForBooks();
            break;
        case 'regenerate':
            const bookIds = process.argv.slice(3);
            regenerateEmbeddingsForBooks(bookIds);
            break;
        case 'validate':
            validateEmbeddings();
            break;
        default:
            console.log(`
📚 Book Embeddings Management Script

Usage:
  node generateEmbeddings.js generate              - Generate embeddings for all books needing them
  node generateEmbeddings.js regenerate [ids...]   - Regenerate embeddings for specific books
  node generateEmbeddings.js validate              - Validate existing embeddings

Examples:
  node generateEmbeddings.js generate
  node generateEmbeddings.js regenerate 60f7b1234567890123456789
  node generateEmbeddings.js validate
            `);
            break;
    }
}

module.exports = {
    generateEmbeddingsForBooks,
    regenerateEmbeddingsForBooks,
    validateEmbeddings
};
