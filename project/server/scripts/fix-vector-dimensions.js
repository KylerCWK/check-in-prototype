/**
 * Script to fix vector dimensions in existing reading profiles
 * Changes from 768 to 384 dimensions to match MongoDB Atlas index
 */

const mongoose = require('mongoose');
const ReadingProfile = require('../src/models/ReadingProfile');
require('dotenv').config({ path: '../.env' });

async function fixVectorDimensions() {
    try {
        console.log('🔧 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'qrlibrary' });
        console.log('✅ Connected to MongoDB (qrlibrary)');

        console.log('📊 Finding profiles with incorrect vector dimensions...');
        const profiles = await ReadingProfile.find({
            'aiProfile.vectors.primary': { $exists: true }
        });

        console.log(`Found ${profiles.length} profiles to check`);

        let fixedCount = 0;
        let alreadyCorrectCount = 0;

        for (const profile of profiles) {
            if (profile.aiProfile.vectors.primary && profile.aiProfile.vectors.primary.length === 768) {
                console.log(`Fixing profile for user ${profile.user} (768 -> 384 dimensions)`);
                
                // Regenerate vectors with correct dimensions
                profile.aiProfile.vectors.primary = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
                profile.aiProfile.vectors.genre = Array.from({ length: 256 }, () => Math.random() * 2 - 1);
                profile.aiProfile.vectors.style = Array.from({ length: 256 }, () => Math.random() * 2 - 1);
                profile.aiProfile.vectors.emotional = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
                profile.aiProfile.vectors.complexity = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
                profile.aiProfile.vectors.temporal = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
                
                // Mark as needing update to regenerate with real embeddings later
                profile.aiProfile.needsUpdate = true;
                profile.aiProfile.lastUpdated = new Date();
                
                await profile.save();
                fixedCount++;
            } else if (profile.aiProfile.vectors.primary && profile.aiProfile.vectors.primary.length === 384) {
                alreadyCorrectCount++;
            } else {
                console.log(`Profile for user ${profile.user} has unusual vector length: ${profile.aiProfile.vectors.primary?.length || 'none'}`);
            }
        }

        console.log(`✅ Fixed ${fixedCount} profiles`);
        console.log(`✅ ${alreadyCorrectCount} profiles already had correct dimensions`);
        console.log('🏁 Vector dimension fix completed');

    } catch (error) {
        console.error('❌ Error fixing vector dimensions:', error);
    } finally {
        await mongoose.connection.close();
        console.log('📴 Database connection closed');
    }
}

// Run the script
if (require.main === module) {
    fixVectorDimensions();
}

module.exports = { fixVectorDimensions };
