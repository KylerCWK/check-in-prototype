const mongoose = require('mongoose');
const Book = require('./src/models/Book');
require('dotenv').config();

async function checkBooks() {
    try {
        // Connect to MongoDB using the environment variable
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'qrlibrary' });
        console.log('Connected to MongoDB Atlas');

        const totalBooks = await Book.countDocuments();
        console.log('Total books in DB:', totalBooks);

        const booksWithEmbeddings = await Book.countDocuments({ 'processing.embeddingsGenerated': true });
        console.log('Books with embeddings:', booksWithEmbeddings);

        const recentBooks = await Book.countDocuments({
            publishDate: { $gte: new Date('2020-01-01') },
            'processing.embeddingsGenerated': true
        });
        console.log('Books published since 2020 with embeddings:', recentBooks);

        // Check the actual publish date range
        const oldestBook = await Book.findOne({ publishDate: { $exists: true } }).sort({ publishDate: 1 });
        const newestBook = await Book.findOne({ publishDate: { $exists: true } }).sort({ publishDate: -1 });
        
        console.log('Oldest book publish date:', oldestBook?.publishDate);
        console.log('Newest book publish date:', newestBook?.publishDate);

        // Sample some recent books
        const sampleBooks = await Book.find({ 
            publishDate: { $exists: true },
            'processing.embeddingsGenerated': true 
        }).sort({ publishDate: -1 }).limit(5);
        
        console.log('\nMost recent books with embeddings:');
        sampleBooks.forEach(book => {
            console.log(`- ${book.title} (${book.publishDate?.toISOString?.() || book.publishDate})`);
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkBooks();
