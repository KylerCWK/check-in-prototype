const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ReadingProfile = require('../models/ReadingProfile');
const { authMiddleware } = require('../middleware/auth');

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('companyAffiliations.company', 'name logoUrl');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, email, preferences } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('companyAffiliations.company', 'name logoUrl');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reading profile
router.get('/me/reading-profile', authMiddleware, async (req, res) => {
  try {
    let readingProfile = await ReadingProfile.findOne({ userId: req.user.id });
    
    if (!readingProfile) {
      // Create a default reading profile if none exists
      readingProfile = new ReadingProfile({
        userId: req.user.id,
        preferredGenres: [],
        readingGoals: {},
        preferences: {}
      });
      await readingProfile.save();
    }

    res.json(readingProfile);
  } catch (error) {
    console.error('Error fetching reading profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user's reading profile
router.put('/me/reading-profile', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    
    let readingProfile = await ReadingProfile.findOne({ userId: req.user.id });
    
    if (!readingProfile) {
      // Create new reading profile if none exists
      readingProfile = new ReadingProfile({
        userId: req.user.id,
        ...updates
      });
    } else {
      // Update existing reading profile
      Object.assign(readingProfile, updates);
    }
    
    await readingProfile.save();
    res.json(readingProfile);
  } catch (error) {
    console.error('Error updating reading profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user account
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    // Delete user's reading profile
    await ReadingProfile.findOneAndDelete({ userId: req.user.id });
    
    // Delete user
    await User.findByIdAndDelete(req.user.id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
