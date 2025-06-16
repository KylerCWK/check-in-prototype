require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const ReadingProfile = require('./src/models/ReadingProfile');

async function fixUserProfile() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('=== FIXING USER PROFILE REFERENCE ===');
        
        const userId = '68423091482d1424d5c77f6d';
        
        // Find the user and the profile
        const user = await User.findById(userId);
        const profile = await ReadingProfile.findOne({ user: userId });
        
        if (user && profile) {
            console.log(`User: ${user.email}`);
            console.log(`Profile ID: ${profile._id}`);
            console.log(`User currently has readingProfile reference: ${!!user.readingProfile}`);
            
            // Update the user to reference the profile
            user.readingProfile = profile._id;
            await user.save();
            
            console.log('✅ Updated user to reference the reading profile');
            
            // Verify the fix
            const userWithProfile = await User.findById(userId).populate('readingProfile');
            console.log('✅ Profile now populates successfully:', !!userWithProfile.readingProfile);
            
            if (userWithProfile.readingProfile) {
                console.log('Profile details:');
                console.log('  Favorite genres:', userWithProfile.readingProfile.preferences?.favoriteGenres);
                console.log('  Reading history entries:', userWithProfile.readingProfile.readingHistory?.length);
            }
        } else {
            console.log('❌ User or profile not found');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixUserProfile();
