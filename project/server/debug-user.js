require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const ReadingProfile = require('./src/models/ReadingProfile');

async function debugUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('=== USER DEBUG ===');
        
        // Find the user that's making requests (from your logs)
        const userId = '68423091482d1424d5c77f6d';
        console.log(`Looking for user: ${userId}`);
        
        const user = await User.findById(userId);
        console.log('User found:', !!user);
        
        if (user) {
            console.log('User email:', user.email);
            console.log('User has readingProfile reference:', !!user.readingProfile);
            console.log('ReadingProfile ID:', user.readingProfile);
            
            // Try to populate the reading profile
            const userWithProfile = await User.findById(userId).populate('readingProfile');
            console.log('Profile populated successfully:', !!userWithProfile.readingProfile);
            
            // Also search for reading profiles directly
            const profiles = await ReadingProfile.find({ user: userId });
            console.log('ReadingProfiles found for this user:', profiles.length);
            
            if (profiles.length > 0) {
                console.log('Profile details:');
                profiles.forEach((profile, index) => {
                    console.log(`  Profile ${index + 1}:`);
                    console.log(`    ID: ${profile._id}`);
                    console.log(`    User: ${profile.user}`);
                    console.log(`    Favorite genres: ${profile.preferences?.favoriteGenres}`);
                    console.log(`    Created: ${profile.createdAt}`);
                });
            }
        } else {
            console.log('User not found!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugUser();
