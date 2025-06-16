const mongoose = require('mongoose');
require('dotenv').config();

async function testUserCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./src/models/User');
    const ReadingProfile = require('./src/models/ReadingProfile');
    
    // Test creating a user with proper schema
    const testUser = new User({
      email: 'test-schema@example.com',
      password: 'hashedpassword123'
    });
    
    await testUser.save();
    console.log('✅ User created with schema defaults');
    console.log('User preferences:', JSON.stringify(testUser.preferences, null, 2));
    console.log('Auth settings:', JSON.stringify(testUser.authSettings, null, 2));
    
    // Test the initializeReadingProfile method
    await testUser.initializeReadingProfile();
    console.log('✅ Reading profile initialized properly');
    
    // Check the created profile
    const profile = await ReadingProfile.findById(testUser.readingProfile);
    console.log('Profile structure valid:', {
      hasPreferences: !!profile.preferences,
      hasAiProfile: !!profile.aiProfile,
      hasVectors: !!profile.aiProfile?.vectors,
      hasPrimary: !!profile.aiProfile?.vectors?.primary
    });
    
    console.log('Profile preferences:', JSON.stringify(profile.preferences, null, 2));
    
    // Clean up test user
    await User.findByIdAndDelete(testUser._id);
    await ReadingProfile.findByIdAndDelete(testUser.readingProfile);
    console.log('✅ Test cleanup completed - schema compliance verified!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testUserCreation();
