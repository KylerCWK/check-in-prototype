const mongoose = require('mongoose');

const UserBehaviorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Behavioral patterns derived from tracking events
    behaviorPatterns: {
        sessionFrequency: {
            daily: { type: Number, default: 0 },
            weekly: { type: Number, default: 0 },
            monthly: { type: Number, default: 0 }
        },
        averageSessionDuration: { type: Number, default: 0 }, // in minutes
        peakActivityHours: [Number], // 0-23 hours
        preferredDeviceType: String, // mobile, tablet, desktop
        
        // Reading behavior
        readingVelocity: {
            averagePagesPerSession: { type: Number, default: 0 },
            averageTimePerPage: { type: Number, default: 0 }, // in seconds
            consistencyScore: { type: Number, default: 0 } // 0-1
        },
        
        // Engagement patterns
        interactionDepth: {
            averageScrollDepth: { type: Number, default: 0 }, // percentage
            averageTimeOnPage: { type: Number, default: 0 }, // in seconds
            bounceRate: { type: Number, default: 0 }, // percentage
            clickThroughRate: { type: Number, default: 0 } // percentage
        },
        
        // Content preferences
        contentAffinities: [{
            type: String, // genre, author, topic, etc.
            category: String, // 'genre', 'author', 'topic', 'theme'
            affinity: Number, // 0-1 strength
            confidence: Number // 0-1 confidence in this affinity
        }],
        
        // Discovery patterns
        discoveryBehavior: {
            searchToDiscoveryRatio: { type: Number, default: 0 },
            recommendationAcceptanceRate: { type: Number, default: 0 },
            explorationScore: { type: Number, default: 0 }, // 0-1
            preferredDiscoveryMethods: [String] // search, browse, recommendations, etc.
        }
    },
    
    // ML-derived insights
    mlInsights: {
        userCluster: String, // User segment/cluster
        churnProbability: { type: Number, default: 0 }, // 0-1
        lifetimeValue: { type: Number, default: 0 },
        nextBookPrediction: [{
            bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
            probability: Number,
            reasoning: String
        }],
        personalityProfile: {
            openness: Number, // 0-1
            adventurousness: Number, // 0-1
            patience: Number, // 0-1
            socialReader: Number // 0-1
        }
    },
    
    // Performance metrics
    metrics: {
        totalEvents: { type: Number, default: 0 },
        totalSessions: { type: Number, default: 0 },
        totalTimeSpent: { type: Number, default: 0 }, // in minutes
        booksViewed: { type: Number, default: 0 },
        booksCompleted: { type: Number, default: 0 },
        recommendationsClicked: { type: Number, default: 0 },
        searchesPerformed: { type: Number, default: 0 }
    },
    
    lastAnalyzed: {
        type: Date,
        default: Date.now
    },
    
    // Data quality indicators
    dataQuality: {
        completeness: { type: Number, default: 0 }, // 0-1
        accuracy: { type: Number, default: 0 }, // 0-1
        recency: { type: Number, default: 0 } // 0-1
    }
}, {
    timestamps: true
});

// Indexes
UserBehaviorSchema.index({ userId: 1 });
UserBehaviorSchema.index({ lastAnalyzed: 1 });
UserBehaviorSchema.index({ 'mlInsights.userCluster': 1 });

module.exports = mongoose.model('UserBehavior', UserBehaviorSchema);
