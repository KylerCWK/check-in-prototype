const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    olid: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    publishDate: Date,
    genres: [String],
    topics: [String],
    coverUrl: String,
    description: String,
    
    // Enhanced AI embeddings
    embeddings: {
        textual: [Number], // Text-based embeddings (512-dim)
        semantic: [Number], // Semantic meaning embeddings (384-dim)  
        style: [Number], // Writing style embeddings (256-dim)
        emotional: [Number], // Emotional tone embeddings (128-dim)
        combined: [Number] // Combined weighted embedding (768-dim)
    },
    
    metadata: {
        pageCount: Number,
        language: String,
        readingLevel: {
            type: String,
            enum: ['elementary', 'middle', 'high_school', 'college', 'graduate']
        },
        isbn: String,
        publisher: String,
        wordCount: Number,
        averageWordsPerPage: Number,
        estimatedReadingTime: Number, // in minutes
        contentWarnings: [String],
        targetAudience: String
    },
    
    // Advanced AI analysis
    aiAnalysis: {
        themes: [String],
        moodTags: [String],
        characters: [{
            name: String,
            importance: Number, // 0-1
            archetype: String
        }],
        plotElements: {
            setting: String,
            timeperiod: String,
            narrative: String,
            pacing: {
                type: String,
                enum: ['slow', 'moderate', 'fast', 'variable']
            }
        },
        complexityScore: Number, // 0-10
        emotionalIntensity: Number, // 0-10
        intellectualChallenge: Number, // 0-10
        socialRelevance: Number, // 0-10
        uniquenessScore: Number, // 0-10
        
        // ML model predictions
        predictions: {
            popularityScore: Number, // 0-100
            controversyScore: Number, // 0-100
            ageAppropriatenessScore: Number, // 0-100
            literaryMerit: Number, // 0-100
            commercialAppeal: Number // 0-100
        },
        
        // Similarity clusters
        clusters: {
            thematicCluster: String,
            styleCluster: String,
            genreCluster: String,
            audienceCluster: String
        },
        
        // Content analysis
        contentAnalysis: {
            sentimentDistribution: {
                positive: Number,
                neutral: Number,
                negative: Number
            },
            topKeywords: [String],
            namedEntities: [String],
            culturalReferences: [String],
            timeReferences: [String],
            locationReferences: [String]
        },
        
        lastAnalyzed: Date,
        analysisVersion: {
            type: String,
            default: '2.0'
        }
    },
    
    // Enhanced statistics and metrics
    stats: {
        viewCount: {
            type: Number,
            default: 0
        },
        checkInCount: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0
        },
        reviewCount: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0 // percentage of users who finished
        },
        averageReadingTime: {
            type: Number,
            default: 0 // in minutes
        },
        bookmarkCount: {
            type: Number,
            default: 0
        },
        shareCount: {
            type: Number,
            default: 0
        },
        
        // Engagement metrics
        engagement: {
            averageSessionDuration: Number,
            returnRate: Number, // percentage who view again
            recommendationClickRate: Number,
            searchDiscoveryRate: Number
        },
        
        // Temporal metrics
        trending: {
            daily: { type: Number, default: 0 },
            weekly: { type: Number, default: 0 },
            monthly: { type: Number, default: 0 }
        },
        
        lastViewed: Date,
        firstViewed: Date
    },
    
    // Quality and data scores
    dataQuality: {
        completeness: { type: Number, default: 0 }, // 0-1
        accuracy: { type: Number, default: 0 }, // 0-1  
        freshness: { type: Number, default: 0 }, // 0-1
        enrichment: { type: Number, default: 0 } // 0-1
    },
    
    // Processing flags
    processing: {
        embeddingsGenerated: { type: Boolean, default: false },
        aiAnalysisComplete: { type: Boolean, default: false },
        qualityChecked: { type: Boolean, default: false },
        needsReprocessing: { type: Boolean, default: false },
        lastProcessed: Date
    }
}, {
    timestamps: true
});

// Enhanced indexes for performance and ML queries
BookSchema.index({ 
    title: 'text', 
    author: 'text', 
    'genres': 'text',
    'topics': 'text',
    description: 'text'
});

BookSchema.index({ 'aiAnalysis.clusters.thematicCluster': 1 });
BookSchema.index({ 'aiAnalysis.clusters.genreCluster': 1 });
BookSchema.index({ 'aiAnalysis.complexityScore': 1 });
BookSchema.index({ 'stats.rating': -1, 'stats.viewCount': -1 });
BookSchema.index({ 'stats.trending.weekly': -1 });
BookSchema.index({ 'processing.needsReprocessing': 1 });
BookSchema.index({ publishDate: -1 });
BookSchema.index({ genres: 1, 'aiAnalysis.complexityScore': 1 });

// Compound indexes for recommendation queries
BookSchema.index({ 
    'embeddings.combined': 1, 
    'stats.rating': -1,
    'processing.embeddingsGenerated': 1 
});

// Methods for AI processing
BookSchema.methods.calculateDataQuality = function() {
    let completeness = 0;
    const requiredFields = ['title', 'author', 'description', 'genres'];
    const optionalFields = ['coverUrl', 'publishDate', 'metadata.pageCount'];
    
    // Check required fields
    requiredFields.forEach(field => {
        if (this.get(field) && this.get(field).length > 0) {
            completeness += 0.2;
        }
    });
    
    // Check optional fields
    optionalFields.forEach(field => {
        if (this.get(field)) {
            completeness += 0.067;
        }
    });
    
    this.dataQuality.completeness = Math.min(completeness, 1);
    return this.dataQuality.completeness;
};

BookSchema.methods.needsEmbeddingUpdate = function() {
    if (!this.processing.embeddingsGenerated) return true;
    if (this.processing.needsReprocessing) return true;
    
    // Check if embeddings are outdated (older than 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return !this.processing.lastProcessed || this.processing.lastProcessed < sixMonthsAgo;
};

BookSchema.methods.updateTrendingScores = function() {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    // These would be calculated from actual tracking data
    // For now, we'll use placeholder logic
    this.stats.trending.daily = this.stats.viewCount * 0.1;
    this.stats.trending.weekly = this.stats.viewCount * 0.05;
    this.stats.trending.monthly = this.stats.viewCount * 0.02;
};

module.exports = mongoose.model('Book', BookSchema);
