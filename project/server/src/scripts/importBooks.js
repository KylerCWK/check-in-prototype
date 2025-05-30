require('dotenv').config();
const mongoose = require('mongoose');
const OpenLibraryImporter = require('../utils/openLibraryImport');

async function importBooks() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const importer = new OpenLibraryImporter({
            maxBooks: 1000 // Limit to 1000 books for initial catalog
        });

        // Import popular books
        await importer.importPopularBooks();

        console.log('Import completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

importBooks();
