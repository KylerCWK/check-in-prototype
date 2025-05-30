const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    profile: {
        name: String,
        avatar: String,
        bio: String,
        location: String
    },
    readingProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReadingProfile'
    },
    preferences: {
        emailNotifications: {
            dailyRecommendations: {
                type: Boolean,
                default: true
            },
            weeklyDigest: {
                type: Boolean,
                default: true
            },
            newReleases: {
                type: Boolean,
                default: true
            }
        },
        aiFeatures: {
            personalizedSummaries: {
                type: Boolean,
                default: true
            },
            readingInsights: {
                type: Boolean,
                default: true
            }
        }
    },
    subscription: {
        type: String,
        enum: ['free', 'basic', 'pro'],
        default: 'free'
    },
    lastActive: Date
}, {
    timestamps: true
});

// Method to get reading profile with recommendations
userSchema.methods.getRecommendations = async function() {
    await this.populate('readingProfile');
    if (this.readingProfile) {
        return this.readingProfile.getRecommendations();
    }
    return [];
};

// Method to initialize reading profile
userSchema.methods.initializeReadingProfile = async function() {
    const ReadingProfile = mongoose.model('ReadingProfile');
    const profile = new ReadingProfile({ user: this._id });
    await profile.save();
    this.readingProfile = profile._id;
    await this.save();
    return profile;
};

module.exports = mongoose.model('User', userSchema);