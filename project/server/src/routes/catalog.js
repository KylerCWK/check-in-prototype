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
        const searchBy = req.query.searchBy || 'all';
        const sortBy = req.query.sortBy || 'popular';
        
        let query = {};
        
        // Add genre filter
        if (genre) {
            query.genres = genre;
        }
        
        // Add search filter based on searchBy parameter
        if (searchQuery) {
            if (searchBy === 'title') {
                query.title = { $regex: searchQuery, $options: 'i' };
            } else if (searchBy === 'author') {
                query.author = { $regex: searchQuery, $options: 'i' };
            } else if (searchBy === 'genre') {
                query.genres = { $regex: searchQuery, $options: 'i' };
            } else {
                // Default to search all fields
                query.$or = [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { author: { $regex: searchQuery, $options: 'i' } },
                    { genres: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } }
                ];
            }
        }
        
        // Get total count for pagination
        const total = await Book.countDocuments(query);
          // Determine sort order
        let sortOptions = {};
        switch (sortBy) {
            case 'title':
                sortOptions = { title: 1 }; // Alphabetical by title
                break;
            case 'newest':
                sortOptions = { publishDate: -1 }; // Newest first
                break;
            case 'rating':
                sortOptions = { 'stats.rating': -1 }; // Highest rated
                break;
            case 'popular':
            default:
                sortOptions = { 'stats.viewCount': -1 }; // Most viewed
                break;
        }

        // Get books with pagination
        const books = await Book.find(query)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit)
            .select('title author coverUrl genres description stats publishDate'); // Select only needed fields
        
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
        // Get all distinct genres
        const allGenres = await Book.distinct('genres');
        
        // Filter out empty or null genres
        const validGenres = allGenres.filter(genre => genre && genre.trim().length > 0);
        
        // Get genre counts for sorting by popularity
        const genreCounts = await Book.aggregate([
            { $unwind: '$genres' },
            { $group: { _id: '$genres', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // Create a map of genre to count
        const countMap = {};
        genreCounts.forEach(item => {
            countMap[item._id] = item.count;
        });
        
        // Sort genres by popularity
        const sortedGenres = validGenres.sort((a, b) => {
            return (countMap[b] || 0) - (countMap[a] || 0);
        });
        
        res.json(sortedGenres);
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ message: 'Error fetching genres' });
    }
});

// Get catalog metadata for filtering (top authors, years, etc.)
router.get('/metadata', async (req, res) => {
    try {
        // Get top authors
        const topAuthors = await Book.aggregate([
            { $group: { _id: '$author', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, author: '$_id', count: 1 } }
        ]);
        
        // Get publication years range
        const yearStats = await Book.aggregate([
            { $match: { publishDate: { $ne: null } } },
            { 
                $group: { 
                    _id: null, 
                    minYear: { $min: { $year: '$publishDate' } },
                    maxYear: { $max: { $year: '$publishDate' } }
                } 
            }
        ]);
        
        // Get top-rated books
        const topRated = await Book.find()
            .sort({ 'stats.rating': -1 })
            .limit(5)
            .select('_id title author coverUrl stats.rating');
            
        // Get most viewed books
        const mostViewed = await Book.find()
            .sort({ 'stats.viewCount': -1 })
            .limit(5)
            .select('_id title author coverUrl stats.viewCount');
        
        res.json({
            topAuthors,
            years: yearStats.length > 0 ? {
                min: yearStats[0].minYear,
                max: yearStats[0].maxYear
            } : { min: 1900, max: new Date().getFullYear() },
            topRated,
            mostViewed
        });
    } catch (error) {
        console.error('Error fetching catalog metadata:', error);
        res.status(500).json({ message: 'Error fetching catalog metadata' });
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
