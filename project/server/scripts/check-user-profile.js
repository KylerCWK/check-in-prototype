const mongoose = require('mongoose');
const User = require('../src/models/User');
const ReadingProfile = require('../src/models/ReadingProfile');

async function checkUserProfile() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/check-in-prototype');
        
        const testUserId = '60d5ecb74b24a000154f1234';
        const user = await User.findById(testUserId).populate('readingProfile');
        
        console.log('=== TEST USER PROFILE CHECK ===');
        console.log('User exists:', !!user);
        
        if (user) {
            console.log('User email:', user.email);
            console.log('Has reading profile:', !!user.readingProfile);
            
            if (user.readingProfile) {
                const profile = await ReadingProfile.findById(user.readingProfile._id);
                console.log('Reading history entries:', profile?.readingHistory?.length || 0);
                console.log('Has AI profile:', !!profile?.aiProfile);
                console.log('Has preferences:', !!profile?.preferences);
                
                if (profile?.preferences) {
                    console.log('Favorite genres:', profile.preferences.favoriteGenres);
                    console.log('Preferred length:', profile.preferences.preferredLength);
                }
                
                if (profile?.aiProfile?.vectors) {
                    console.log('Has AI vectors:', !!profile.aiProfile.vectors.primary);
                    console.log('Vector length:', profile.aiProfile.vectors.primary?.length || 0);
                }
            }
        } else {
            console.log('Test user not found - recommendations will use cold start');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUserProfile();
