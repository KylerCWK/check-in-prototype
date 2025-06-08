const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/recommendations
 * @desc    Get recommended books for the user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        
        const recommendations = await aiService.getRecommendedBooks(userId, limit);
        
        return res.json({
            success: true,
            count: recommendations.length,
            data: recommendations
        });
    } catch (error) {
        console.error('Error in recommendations route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving recommendations'
        });
    }
});

/**
 * @route   GET /api/recommendations/daily
 * @desc    Get daily book recommendation
 * @access  Private
 */
router.get('/daily', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const dailyPick = await aiService.getDailyRecommendation(userId);
        
        if (!dailyPick) {
            return res.status(404).json({
                success: false,
                message: 'Daily recommendation not available'
            });
        }
        
        return res.json({
            success: true,
            data: dailyPick
        });
    } catch (error) {
        console.error('Error in daily recommendation route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving daily recommendation'
        });
    }
});

/**
 * @route   GET /api/recommendations/new-releases
 * @desc    Get new releases based on user interests
 * @access  Private
 */
router.get('/new-releases', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 5;
        
        const newReleases = await aiService.getNewReleasesForUser(userId, limit);
        
        return res.json({
            success: true,
            count: newReleases.length,
            data: newReleases
        });
    } catch (error) {
        console.error('Error in new releases route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving new releases'
        });
    }
});

/**
 * @route   GET /api/recommendations/similar/:bookId
 * @desc    Get books similar to a specific book
 * @access  Private
 */
router.get('/similar/:bookId', auth, async (req, res) => {
    try {
        const { bookId } = req.params;
        const limit = parseInt(req.query.limit) || 5;
        
        const similarBooks = await aiService.getSimilarBooks(bookId, limit);
        
        return res.json({
            success: true,
            count: similarBooks.length,
            data: similarBooks
        });
    } catch (error) {
        console.error('Error in similar books route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving similar books'
        });
    }
});

/**
 * @route   PUT /api/recommendations/profile
 * @desc    Update user's AI profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const updatedProfile = await aiService.updateUserAIProfile(userId);
        if (!updatedProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }
        
        return res.json({
            success: true,
            message: 'AI profile updated successfully',
            lastUpdated: updatedProfile.aiProfile.lastUpdated
        });
    } catch (error) {
        console.error('Error updating AI profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating AI profile'
        });
    }
});

/**
 * @route   POST /api/recommendations/contextual
 * @desc    Get contextual recommendations based on mood, time, and genre preferences
 * @access  Private
 */
router.post('/contextual', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { mood, time, genres, limit = 10 } = req.body;
        
        const context = { mood, time, genres: genres || [] };
        const recommendations = await aiService.getContextualRecommendations(userId, context, limit);
        
        return res.json({
            success: true,
            count: recommendations.length,
            context: context,
            data: recommendations
        });
    } catch (error) {
        console.error('Error in contextual recommendations route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving contextual recommendations'
        });
    }
});

/**
 * @route   GET /api/recommendations/analytics
 * @desc    Get recommendation system performance analytics
 * @access  Private
 */
router.get('/analytics', auth, async (req, res) => {
    try {
        const analytics = aiService.recommendationAnalytics.getPerformanceReport();
        
        return res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error in analytics route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving analytics'
        });
    }
});

/**
 * @route   POST /api/recommendations/engagement
 * @desc    Record user engagement with recommendations
 * @access  Private
 */
router.post('/engagement', auth, async (req, res) => {
    try {
        const { type } = req.body; // dailyRecommendationClicks, recommendationViews, favoritesAdded
        
        aiService.recommendationAnalytics.recordUserEngagement(type);
        
        return res.json({
            success: true,
            message: 'Engagement recorded'
        });
    } catch (error) {
        console.error('Error recording engagement:', error);
        return res.status(500).json({
            success: false,
            message: 'Error recording engagement'
        });
    }
});

/**
 * @route   GET /api/recommendations/test/:userId
 * @desc    Test route for debugging recommendations (temporary)
 * @access  Public
 */
router.get('/test/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const limit = parseInt(req.query.limit) || 5;
        
        console.log(`Testing recommendations for user: ${userId}`);
        const recommendations = await aiService.getRecommendedBooks(userId, limit);
        
        return res.json({
            success: true,
            userId: userId,
            count: recommendations.length,
            data: recommendations
        });
    } catch (error) {
        console.error('Error in test recommendations route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving test recommendations',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/recommendations/test-daily/:userId
 * @desc    Test route for debugging daily recommendations (temporary)
 * @access  Public
 */
router.get('/test-daily/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        console.log(`Testing daily recommendation for user: ${userId}`);
        const dailyPick = await aiService.getDailyRecommendation(userId);
        
        return res.json({
            success: true,
            userId: userId,
            data: dailyPick
        });
    } catch (error) {
        console.error('Error in test daily recommendation route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving test daily recommendation',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/recommendations/test-new-releases/:userId
 * @desc    Test route for debugging new releases (temporary)
 * @access  Public
 */
router.get('/test-new-releases/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const limit = parseInt(req.query.limit) || 5;
        
        console.log(`Testing new releases for user: ${userId}`);
        const newReleases = await aiService.getNewReleasesForUser(userId, limit);
        
        return res.json({
            success: true,
            userId: userId,
            count: newReleases.length,
            data: newReleases
        });
    } catch (error) {
        console.error('Error in test new releases route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving test new releases',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/recommendations/test-similar/:userId/:bookId
 * @desc    Test route for debugging similar books (temporary)
 * @access  Public
 */
router.get('/test-similar/:userId/:bookId', async (req, res) => {
    try {
        const { userId, bookId } = req.params;
        const limit = parseInt(req.query.limit) || 5;
        
        console.log(`Testing similar books for user: ${userId}, book: ${bookId}`);
        const similarBooks = await aiService.getSimilarBooks(bookId, limit);
        
        return res.json({
            success: true,
            userId: userId,
            bookId: bookId,
            count: similarBooks.length,
            data: similarBooks
        });
    } catch (error) {
        console.error('Error in test similar books route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving test similar books',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/recommendations/test-favorites/:userId
 * @desc    Test route for debugging favorites (temporary)
 * @access  Public
 */
router.get('/test-favorites/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        console.log(`Testing favorites for user: ${userId}`);
        // For now, return empty array or mock favorites
        const favorites = [];
        
        return res.json({
            success: true,
            userId: userId,
            count: favorites.length,
            data: favorites
        });
    } catch (error) {
        console.error('Error in test favorites route:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving test favorites',
            error: error.message
        });
    }
});

module.exports = router;
