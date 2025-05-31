const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const ReadingProfile = require('../models/ReadingProfile');
const Book = require('../models/Book');
const aiService = require('../services/aiService');

/**
 * @route   POST /api/tracking/book-view
 * @desc    Track when a user views a book to improve recommendations
 * @access  Private
 */
router.post('/book-view', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId, viewDuration } = req.body;
        
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
        
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Reading profile not found'
            });
        }
        
        // Update or add book to reading history
        const existingEntry = profile.readingHistory.find(
            entry => entry.book && entry.book.toString() === bookId
        );
        
        const now = new Date();
        
        if (existingEntry) {
            // Update existing entry
            existingEntry.viewCount = (existingEntry.viewCount || 0) + 1;
            existingEntry.lastViewed = now;
            existingEntry.totalViewDuration = (existingEntry.totalViewDuration || 0) + (viewDuration || 0);
        } else {
            // Add new entry
            profile.readingHistory.push({
                book: bookId,
                viewCount: 1,
                lastViewed: now,
                totalViewDuration: viewDuration || 0,
                completed: false,
                favorite: false
            });
        }
        
        // Save profile changes
        await profile.save();
        
        // Update recommendations in the background
        aiService.updateUserRecommendationsAsync(userId);
        
        return res.json({
            success: true,
            message: 'Book view tracked successfully'
        });
    } catch (error) {
        console.error('Error tracking book view:', error);
        return res.status(500).json({
            success: false,
            message: 'Error tracking book view'
        });
    }
});

module.exports = router;
