const mongoose = require('mongoose');

const ReadingProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    readingHistory: [{
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book'
        },
        status: {
            type: String,
            enum: ['want_to_read', 'reading', 'completed', 'abandoned'],
            default: 'want_to_read'
        },
        progress: {
            pagesRead: Number,
            timeSpent: Number, // in minutes
            lastReadDate: Date
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        notes: String,
        dateAdded: {
            type: Date,
            default: Date.now
        }
    }],
    preferences: {
        genres: [String],
        authors: [String],
        topics: [String],
        readingGoals: {
            booksPerMonth: Number,
            hoursPerWeek: Number
        },
        readingLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert']
        }
    },
    aiProfile: {
        interestVector: [Number], // AI-generated interest embedding
        readingPatterns: {
            preferredGenres: [{
                genre: String,
                weight: Number
            }],
            preferredTopics: [{
                topic: String,
                weight: Number
            }],
            readingSpeed: Number, // words per minute
            completionRate: Number, // percentage of books completed
            averageRating: Number
        },
        recommendations: [{
            book: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book'
            },
            score: Number,
            reason: String,
            dateGenerated: Date
        }],
        lastUpdated: Date
    }
}, {
    timestamps: true
});

// Method to update AI profile
ReadingProfileSchema.methods.updateAIProfile = async function() {
    // This will be implemented when we add the AI processing
    // It will analyze reading history and update the AI profile
};

// Method to get personalized recommendations
ReadingProfileSchema.methods.getRecommendations = async function() {
    // This will be implemented when we add the recommendation engine
    // It will use the AI profile to generate recommendations
};

module.exports = mongoose.model('ReadingProfile', ReadingProfileSchema);
