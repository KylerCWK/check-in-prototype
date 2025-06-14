const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const embeddingService = require('../services/embeddingService');
const { validationChains } = require('../middleware/validation');
const { optionalAuth } = require('../middleware/auth');

// Get paginated catalog with filters
router.get('/', optionalAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Cap at 100
        const genre = req.query.genre;
        const searchQuery = req.query.search;
        const searchBy = req.query.searchBy || 'all';
        const sortBy = req.query.sortBy || 'popular';
        
        let query = {};
        
        // Add genre filter
        if (genre) {
            query.genres = genre;
        }
        
        // Add search filter using MongoDB text search
        if (searchQuery) {
            if (searchBy === 'title') {
                query.title = { $regex: searchQuery, $options: 'i' };
            } else if (searchBy === 'author') {
                query.author = { $regex: searchQuery, $options: 'i' };
            } else if (searchBy === 'genre') {
                query.genres = { $regex: searchQuery, $options: 'i' };
            } else {
                // Use MongoDB's full-text search for better performance and relevance
                query.$text = { $search: searchQuery };
            }
        }
        
        // Get total count for pagination
        const total = await Book.countDocuments(query);
        
        // Determine sort order
        let sortOptions = {};
        let projection = {};
        
        // Add text score for relevance sorting if using text search
        if (searchQuery && searchBy === 'all' && sortBy === 'relevance') {
            sortOptions = { score: { $meta: 'textScore' } };
            projection = { score: { $meta: 'textScore' } };
        }
        
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
            case 'relevance':
                if (query.$text) {
                    sortOptions = { score: { $meta: 'textScore' } };
                    projection.score = { $meta: 'textScore' };
                } else {
                    sortOptions = { 'stats.viewCount': -1 }; // Fallback to popular
                }
                break;
            case 'trending':
                sortOptions = { 'stats.trending.daily': -1 }; // Most trending
                break;
            case 'popular':
            default:
                sortOptions = { 'stats.viewCount': -1 }; // Most viewed
                break;
        }

        // Get books with pagination
        const booksQuery = Book.find(query, projection)
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit)
            .select('title author coverUrl genres description stats publishDate aiAnalysis.themes aiAnalysis.moodTags'); // Select only needed fields
        
        const books = await booksQuery;
        
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
router.get('/:id', validationChains.catalogById, optionalAuth, async (req, res) => {
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

// Semantic search using vector embeddings
router.post('/semantic-search', validationChains.semanticSearch, optionalAuth, async (req, res) => {
    try {
        const { query: searchQuery, limit = 20, page = 1 } = req.body;
        
        if (!searchQuery) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // For now, we'll use MongoDB aggregation with $vectorSearch
        // Note: This requires MongoDB Atlas with Vector Search enabled
        const pipeline = [
            {
                $vectorSearch: {
                    index: "books_vector_index", // This needs to be created in MongoDB Atlas
                    path: "embeddings.combined",
                    queryVector: await generateQueryEmbedding(searchQuery), // You'll need to implement this
                    numCandidates: 100,
                    limit: limit * 2 // Get more candidates for filtering
                }
            },
            {
                $project: {
                    title: 1,
                    author: 1,
                    coverUrl: 1,
                    genres: 1,
                    description: 1,
                    stats: 1,
                    publishDate: 1,
                    'aiAnalysis.themes': 1,
                    'aiAnalysis.moodTags': 1,
                    score: { $meta: "vectorSearchScore" }
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            }
        ];

        const books = await Book.aggregate(pipeline);

        res.json({
            books,
            searchType: 'semantic',
            pagination: {
                page,
                limit,
                total: books.length // Approximate for vector search
            }
        });
    } catch (error) {
        console.error('Error in semantic search:', error);
        // Fallback to text search if vector search fails
        try {
            const books = await Book.find(
                { $text: { $search: req.body.query } },
                { score: { $meta: 'textScore' } }
            )
            .sort({ score: { $meta: 'textScore' } })
            .limit(req.body.limit || 20)
            .select('title author coverUrl genres description stats publishDate');

            res.json({
                books,
                searchType: 'text_fallback',
                pagination: {
                    page: req.body.page || 1,
                    limit: req.body.limit || 20,
                    total: books.length
                }
            });
        } catch (fallbackError) {
            res.status(500).json({ message: 'Error in semantic search and fallback failed' });
        }
    }
});

// Helper function to generate query embeddings
async function generateQueryEmbedding(query) {
    try {
        // Use the embedding service to generate embeddings with correct dimensions for Atlas
        const embedding = await embeddingService.generateEmbedding(query, { dimensions: 384 });
        return Array.isArray(embedding) ? embedding[0] : embedding;
    } catch (error) {
        console.error('Error generating query embedding:', error);
        // Return zero vector as fallback with correct dimensions
        return new Array(384).fill(0);
    }
}

module.exports = router;
