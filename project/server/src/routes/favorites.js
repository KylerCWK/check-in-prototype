const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Book = require('../models/Book');
const ReadingProfile = require('../models/ReadingProfile');

/**
 * @route   GET /api/favorites
 * @desc    Get user's favorite books
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
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
router.post('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId } = req.body;
        
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
router.delete('/:bookId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookId } = req.params;
        
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

module.exports = router;
