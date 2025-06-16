const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true
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
    companyAffiliations: [{
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company'
        },
        role: {
            type: String,
            enum: ['admin', 'librarian', 'associate', 'member'],
            default: 'member'
        },
        department: String,
        joinDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'denied'],
            default: 'pending'
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    authSettings: {
        emailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: String,
        emailVerificationExpires: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        twoFactorEnabled: {
            type: Boolean,
            default: false
        },
        twoFactorSecret: String,
        twoFactorBackupCodes: [String]
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

// New method for company affiliations
userSchema.methods.addCompanyAffiliation = async function(companyId, role = 'member', department = '') {
    const existing = this.companyAffiliations.find(
        affiliation => affiliation.company.toString() === companyId.toString()
    );
    
    if (existing) {
        return existing;
    }
    
    const newAffiliation = {
        company: companyId,
        role,
        department,
        status: 'pending',
        isDefault: this.companyAffiliations.length === 0 // First company is default
    };
    
    this.companyAffiliations.push(newAffiliation);
    await this.save();
    return newAffiliation;
};

// Initialize reading profile for user
userSchema.methods.initializeReadingProfile = async function() {
    const ReadingProfile = require('./ReadingProfile');
    
    console.log(`Creating reading profile for user: ${this._id}`);
    
    const profile = new ReadingProfile({
        user: this._id,
        preferences: {
            favoriteGenres: [],
            preferredLength: 'medium',
            readingGoals: {
                booksPerMonth: 2,
                currentStreak: 0
            }
        },
        readingHistory: [],
        aiProfile: {
            vectors: {
                primary: [],
                textual: [],
                semantic: [],
                style: [],
                emotional: []
            },
            lastUpdated: new Date(),
            needsUpdate: false
        }
    });
    
    await profile.save();
    
    // Update user to reference the profile
    this.readingProfile = profile._id;
    await this.save();
    
    console.log(`✅ Reading profile created successfully for user: ${this._id}`);
    return profile;
};

// Index for company affiliations
userSchema.index({ 'companyAffiliations.company': 1 });
userSchema.index({ 'companyAffiliations.status': 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);