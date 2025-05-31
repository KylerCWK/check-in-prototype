const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const ReadingProfile = require('../models/ReadingProfile');
const Book = require('../models/Book');
const aiService = require('../services/aiService');

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
          // Only try to get user's reading profile if logged in
        let profile = null;
        if (userId) {
            profile = await ReadingProfile.findOne({ user: userId });
            
            if (!profile) {
                console.log(`No reading profile found for user ${userId}, skipping profile updates`);
                // Instead of failing, we'll just update book stats and not user profile
            }
        }
          const now = new Date();
        
        // Always update book stats regardless of user authentication
        await Book.findByIdAndUpdate(bookId, {
            $inc: { 'stats.viewCount': 1 },
            $set: { 'stats.lastViewed': now }
        });

        // Update user profile if we have one
        if (profile) {
            // Update or add book to reading history
            const existingEntry = profile.readingHistory.find(
                entry => entry.book && entry.book.toString() === bookId
            );
            
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
            if (userId) {
                aiService.updateUserRecommendationsAsync(userId);
            }
        }
        
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
