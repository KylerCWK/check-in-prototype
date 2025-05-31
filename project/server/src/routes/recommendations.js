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

module.exports = router;
