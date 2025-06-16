const mongoose = require('mongoose');
const User = require('../src/models/User');
const ReadingProfile = require('../src/models/ReadingProfile');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/check-in-prototype');
        
        const testUserId = '60d5ecb74b24a000154f1234';
        
        // Check if user already exists
        let user = await User.findById(testUserId);
        
        if (!user) {
            console.log('Creating test user...');
            
            // Create test user
            const hashedPassword = await bcrypt.hash('testpassword', 10);
            
            user = new User({
                _id: testUserId,
                username: 'testuser',
                email: 'test@example.com',
                password: hashedPassword,
                isVerified: true
            });
            
            await user.save();
            console.log('Test user created successfully');
        } else {
            console.log('Test user already exists');
        }
        
        // Check if reading profile exists
        let profile = await ReadingProfile.findOne({ user: testUserId });
        
        if (!profile) {
            console.log('Creating reading profile...');
            
            profile = new ReadingProfile({
                user: testUserId,
                preferences: {
                    favoriteGenres: ['fiction', 'mystery', 'fantasy'],
                    preferredLength: 'medium',
                    readingGoals: {
                        booksPerMonth: 2,
                        currentStreak: 0
                    }
                },
                readingHistory: [], // Empty for now, can be populated later
                aiProfile: {
                    vectors: {
                        primary: [], // Will be generated based on interactions
                        textual: [],
                        semantic: [],
                        style: [],
                        emotional: []
                    },
                    lastUpdated: new Date()
                }
            });
            
            await profile.save();
            
            // Update user to reference the profile
            user.readingProfile = profile._id;
            await user.save();
            
            console.log('Reading profile created successfully');
        } else {
            console.log('Reading profile already exists');
        }
        
        console.log('=== TEST USER SETUP COMPLETE ===');
        console.log('User ID:', testUserId);
        console.log('Email:', user.email);
        console.log('Has reading profile:', !!user.readingProfile);
        console.log('Favorite genres:', profile.preferences?.favoriteGenres);
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating test user:', error);
        process.exit(1);
    }
}

createTestUser();
