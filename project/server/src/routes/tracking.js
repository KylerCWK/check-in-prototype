const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const ReadingProfile = require('../models/ReadingProfile');
const Book = require('../models/Book');
const aiService = require('../services/aiService');
const trackingService = require('../services/trackingService');
const { v4: uuidv4 } = require('uuid');

/**
 * @route   POST /api/tracking/book-view
 * @desc    Track when a user views a book to improve recommendations
 * @access  Public (but will track user if logged in)
 */
router.post('/book-view', async (req, res) => {
    try {
        let userId = null;
        // Check if user is authenticated
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (err) {
                console.log('Invalid token, continuing as anonymous user');
            }
        }
        
        const { 
            bookId, 
            viewDuration, 
            sessionId,
            metadata = {} 
        } = req.body;
        
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

        // Generate session ID if not provided
        const finalSessionId = sessionId || uuidv4();

        // Track using advanced tracking service
        const trackingResult = await trackingService.trackBookInteraction({
            userId,
            bookId,
            interactionType: 'book_view',
            metadata: {
                sessionId: finalSessionId,
                viewDuration,
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                referrer: req.headers.referer,
                ...metadata
            }
        });        // Update legacy tracking for backward compatibility
        await trackingService.updateLegacyTracking(userId, bookId, viewDuration);
        
        return res.json({
            success: true,
            message: 'Book view tracked successfully',
            sessionId: finalSessionId,
            trackingId: trackingResult.eventId
        });
    } catch (error) {
        console.error('Error tracking book view:', error);
        return res.status(500).json({
            success: false,
            message: 'Error tracking book view'
        });
    }
});

/**
 * @route   POST /api/tracking/reading-session
 * @desc    Track reading session with detailed progress
 * @access  Private
 */
router.post('/reading-session', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            bookId,
            sessionData,
            metadata = {}
        } = req.body;

        if (!bookId || !sessionData) {
            return res.status(400).json({
                success: false,
                message: 'Book ID and session data are required'
            });
        }

        const result = await trackingService.trackReadingSession({
            userId,
            bookId,
            sessionData,
            metadata: {
                ...metadata,
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip
            }
        });

        return res.json({
            success: true,
            message: 'Reading session tracked successfully',
            trackingId: result.eventId
        });
    } catch (error) {
        console.error('Error tracking reading session:', error);
        return res.status(500).json({
            success: false,
            message: 'Error tracking reading session'
        });
    }
});

/**
 * @route   POST /api/tracking/search
 * @desc    Track search behavior
 * @access  Public
 */
router.post('/search', async (req, res) => {
    try {
        let userId = null;
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (err) {
                // Continue as anonymous
            }
        }

        const {
            query,
            filters,
            results,
            sessionId,
            metadata = {}
        } = req.body;

        const result = await trackingService.trackSearch({
            userId,
            query,
            filters,
            results,
            metadata: {
                sessionId: sessionId || uuidv4(),
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                ...metadata
            }
        });

        return res.json({
            success: true,
            message: 'Search tracked successfully',
            trackingId: result.eventId
        });
    } catch (error) {
        console.error('Error tracking search:', error);
        return res.status(500).json({
            success: false,
            message: 'Error tracking search'
        });
    }
});

/**
 * @route   POST /api/tracking/event
 * @desc    Track generic user events
 * @access  Public
 */
router.post('/event', async (req, res) => {
    try {
        let userId = null;
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            } catch (err) {
                // Continue as anonymous
            }
        }

        const eventData = {
            ...req.body,
            userId,
            metadata: {
                ...req.body.metadata,
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                referrer: req.headers.referer
            }
        };

        const result = await trackingService.trackEvent(eventData);

        return res.json({
            success: true,
            message: 'Event tracked successfully',
            trackingId: result.eventId
        });
    } catch (error) {
        console.error('Error tracking event:', error);
        return res.status(500).json({
            success: false,
            message: 'Error tracking event'
        });
    }
});

/**
 * @route   GET /api/tracking/analytics/:userId
 * @desc    Get user analytics and insights
 * @access  Private
 */
router.get('/analytics/:userId', auth, async (req, res) => {
    try {
        // Verify user can access these analytics
        if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const timeframe = req.query.timeframe || '30d';
        const analytics = await trackingService.generateUserAnalytics(req.params.userId, timeframe);

        if (!analytics) {
            return res.status(404).json({
                success: false,
                message: 'No analytics data found'
            });
        }

        return res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching analytics'
        });
    }
});

/**
 * @route   POST /api/tracking/process-batch
 * @desc    Process tracking events batch for ML analysis
 * @access  Private (Admin only)
 */
router.post('/process-batch', auth, async (req, res) => {
    try {
        // Admin only endpoint
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { batchId } = req.body;
        const result = await trackingService.processBatch(batchId);

        return res.json({
            success: true,
            message: 'Batch processed successfully',
            data: result
        });
    } catch (error) {
        console.error('Error processing batch:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing batch'
        });
    }
});

// Helper method for backward compatibility
async function updateLegacyTracking(userId, bookId, viewDuration) {
    try {
        const now = new Date();
        
        // Always update book stats
        await Book.findByIdAndUpdate(bookId, {
            $inc: { 'stats.viewCount': 1 },
            $set: { 'stats.lastViewed': now }
        });

        // Update user profile if logged in
        if (userId) {
            const profile = await ReadingProfile.findOne({ user: userId });
            if (profile) {
                const existingEntry = profile.readingHistory.find(
                    entry => entry.book && entry.book.toString() === bookId
                );
                
                if (existingEntry) {
                    existingEntry.viewCount = (existingEntry.viewCount || 0) + 1;
                    existingEntry.lastViewed = now;
                    existingEntry.totalViewDuration = (existingEntry.totalViewDuration || 0) + (viewDuration || 0);
                } else {
                    profile.readingHistory.push({
                        book: bookId,
                        viewCount: 1,
                        lastViewed: now,
                        totalViewDuration: viewDuration || 0
                    });
                }
                
                await profile.save();
                aiService.updateUserRecommendationsAsync(userId);
            }
        }
    } catch (error) {
        console.error('Error in legacy tracking update:', error);
    }
}

module.exports = router;
