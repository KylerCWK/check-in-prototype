const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Get paginated catalog with filters
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const genre = req.query.genre;
        const searchQuery = req.query.search;
        
        let query = {};
        
        // Add genre filter
        if (genre) {
            query.genres = genre;
        }
        
        // Add search filter
        if (searchQuery) {
            query.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { author: { $regex: searchQuery, $options: 'i' } },
                { genres: { $regex: searchQuery, $options: 'i' } }
            ];
        }
        
        // Get total count for pagination
        const total = await Book.countDocuments(query);
        
        // Get books with pagination
        const books = await Book.find(query)
            .sort({ 'stats.viewCount': -1 }) // Sort by popularity
            .skip((page - 1) * limit)
            .limit(limit)
            .select('title author coverUrl genres description stats'); // Select only needed fields
        
        res.json({
            books,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching catalog:', error);
        res.status(500).json({ message: 'Error fetching catalog' });
    }
});

// Get available genres
router.get('/genres', async (req, res) => {
    try {
        const genres = await Book.distinct('genres');
        res.json(genres);
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ message: 'Error fetching genres' });
    }
});

// Get book details by ID
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        // Increment view count
        book.stats.viewCount += 1;
        await book.save();
        
        res.json(book);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ message: 'Error fetching book details' });
    }
});

module.exports = router;
