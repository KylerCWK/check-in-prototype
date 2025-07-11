const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/auth');
const { validationChains } = require('../middleware/validation');
const { requireDevelopment, devAuthBypass } = require('../middleware/devAuth');
const User = require('../models/User');
const Book = require('../models/Book');
const ReadingProfile = require('../models/ReadingProfile');

/**
 * @route   GET /api/favorites
 * @desc    Get user's favorite books
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's reading profile
        const profile = await ReadingProfile.findOne({ user: userId })
            .populate({
                path: 'readingHistory.book',
                select: '_id title author genres coverUrl description publishDate stats'
            });
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Reading profile not found'
            });
        }
        
        // Filter for entries marked as favorites
        const favorites = profile.readingHistory
            .filter(entry => entry.favorite === true && entry.book)
            .map(entry => entry.book);
        
        return res.json({
            success: true,
            count: favorites.length,
            data: favorites
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving favorites'
        });
    }
});

/**
 * @route   POST /api/favorites
 * @desc    Add a book to favorites
 * @access  Private
 */
router.post('/', authMiddleware, validationChains.addFavorite, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId } = req.body;
        
        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }
        
        // Get user's reading profile
        let profile = await ReadingProfile.findOne({ user: userId });
        
        // If no profile exists, create one
        if (!profile) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            profile = await user.initializeReadingProfile();
        }
        
        // Check if book is already in reading history
        const existingEntry = profile.readingHistory.find(
            entry => entry.book && entry.book.toString() === bookId
        );
        
        if (existingEntry) {
            // Update existing entry
            existingEntry.favorite = true;
        } else {
            // Add new entry
            profile.readingHistory.push({
                book: bookId,
                status: 'want_to_read',
                favorite: true,
                dateAdded: new Date()
            });
        }
        
        await profile.save();
        
        return res.json({
            success: true,
            message: 'Book added to favorites'
        });
    } catch (error) {
        console.error('Error adding favorite:', error);
        return res.status(500).json({
            success: false,
            message: 'Error adding book to favorites'
        });
    }
});

/**
 * @route   DELETE /api/favorites/:bookId
 * @desc    Remove a book from favorites
 * @access  Private
 */
router.delete('/:bookId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId } = req.params;
        
        // Basic validation
        if (!bookId || !bookId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Valid book ID is required'
            });
        }
        
        // Get user's reading profile
        const profile = await ReadingProfile.findOne({ user: userId });
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Reading profile not found'
            });
        }
        
        // Find the book in reading history
        const entryIndex = profile.readingHistory.findIndex(
            entry => entry.book && entry.book.toString() === bookId
        );
        
        if (entryIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Book not found in favorites'
            });
        }
        
        // Update the entry
        profile.readingHistory[entryIndex].favorite = false;
        
        await profile.save();
        
        return res.json({
            success: true,
            message: 'Book removed from favorites'
        });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return res.status(500).json({
            success: false,
            message: 'Error removing book from favorites'
        });
    }
});

// Development-only test routes (bypassing authentication)
/**
 * @route   GET /api/favorites/test/:userId
 * @desc    Get user's favorite books (test route)
 * @access  Public (for testing only - disabled in production)
 */
router.get('/test/:userId', requireDevelopment, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Basic validation
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }
        
        // Get user's reading profile
        const profile = await ReadingProfile.findOne({ user: userId })
            .populate({
                path: 'readingHistory.book',
                select: '_id title author genres coverUrl description publishDate stats'
            });
        
        if (!profile) {
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }
        
        // Filter for entries marked as favorites
        const favorites = profile.readingHistory
            .filter(entry => entry.favorite === true && entry.book)
            .map(entry => entry.book);
        
        return res.json({
            success: true,
            count: favorites.length,
            data: favorites
        });
    } catch (error) {
        console.error('Error fetching test favorites:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving favorites'
        });
    }
});

/**
 * @route   POST /api/favorites/test/:userId
 * @desc    Add a book to favorites (test route)
 * @access  Public (for testing only - disabled in production)
 */
router.post('/test/:userId', requireDevelopment, async (req, res) => {
    try {
        const userId = req.params.userId;
        const { bookId } = req.body;
        
        // Basic validation
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }
        
        if (!bookId || !bookId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Valid book ID is required'
            });
        }
        
        if (!bookId) {
            return res.status(400).json({
                success: false,
                message: 'Book ID is required'
            });
        }
        
        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }
        
        // Get user's reading profile
        let profile = await ReadingProfile.findOne({ user: userId });
        
        // If no profile exists, create one
        if (!profile) {
            profile = new ReadingProfile({
                user: userId,
                readingHistory: [],
                preferences: {
                    genres: [],
                    authors: [],
                    themes: []
                },                aiProfile: {
                    vectors: {
                        primary: [],
                        genre: [],
                        style: [],
                        emotional: [],
                        complexity: [],
                        temporal: []
                    },
                    patterns: {
                        readingRhythm: {
                            preferredReadingTimes: [],
                            seasonalPatterns: [],
                            weeklyPattern: [],
                            consistencyScore: 0
                        },
                        discoveryPatterns: {
                            explorationVsExploitation: 0.5,
                            serendipityAffinity: 0.5,
                            socialInfluence: 0.5,
                            trendFollowing: 0.5
                        },
                        engagementPatterns: {
                            attentionSpan: 0,
                            multitaskingTendency: 0,
                            deepVsSkimming: 0.5,
                            completionRate: 0,
                            abandonmentTriggers: []
                        }
                    },
                    modelOutputs: {
                        userCluster: null,
                        personalityProfile: {
                            openness: 0.5,
                            conscientiousness: 0.5,
                            extraversion: 0.5,
                            agreeableness: 0.5,
                            neuroticism: 0.5
                        },
                        lifestageIndicators: {
                            currentLifestage: null,
                            lifestageConfidence: 0,
                            stageDuration: null
                        },
                        riskProfiles: {
                            contentRiskTolerance: 0.5,
                            genreRiskTolerance: 0.5,
                            lengthRiskTolerance: 0.5
                        }
                    },
                    recommendations: [],
                    confidence: {
                        overall: 0,
                        genrePreferences: 0,
                        complexityPreferences: 0,
                        temporalStability: 0,
                        dataQuality: 0
                    },
                    lastUpdated: null,
                    modelVersion: '2.0',
                    needsUpdate: true,
                    processingLocked: false,
                    lastFullAnalysis: null
                }
            });
        }
        
        // Check if book is already in reading history
        const existingEntry = profile.readingHistory.find(
            entry => entry.book && entry.book.toString() === bookId
        );
        
        if (existingEntry) {
            // Update existing entry
            existingEntry.favorite = true;
        } else {
            // Add new entry
            profile.readingHistory.push({
                book: bookId,
                status: 'want_to_read',
                favorite: true,
                dateAdded: new Date()
            });
        }
        
        await profile.save();
        
        return res.json({
            success: true,
            message: 'Book added to favorites'
        });
    } catch (error) {
        console.error('Error adding test favorite:', error);
        return res.status(500).json({
            success: false,
            message: 'Error adding book to favorites'
        });
    }
});

module.exports = router;
