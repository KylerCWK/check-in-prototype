const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReadingProfileSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Enhanced reading history with rich metadata
    readingHistory: [{
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book'
        },
        status: {
            type: String,
            enum: ['want_to_read', 'reading', 'completed', 'abandoned', 'paused'],
            default: 'want_to_read'
        },
        favorite: {
            type: Boolean,
            default: false
        },
        
        // Enhanced engagement tracking
        engagement: {
            viewCount: { type: Number, default: 0 },
            lastViewed: Date,
            totalViewDuration: { type: Number, default: 0 }, // in seconds
            averageSessionDuration: { type: Number, default: 0 },
            deepReadSessions: { type: Number, default: 0 }, // sessions > 15 min
            skimReadSessions: { type: Number, default: 0 }, // sessions < 3 min
            returnVisits: { type: Number, default: 0 }
        },
        
        // Detailed progress tracking
        progress: {
            pagesRead: { type: Number, default: 0 },
            totalPages: Number,
            percentage: { type: Number, default: 0 },
            timeSpent: { type: Number, default: 0 }, // in minutes
            readingSessions: [{
                startTime: Date,
                endTime: Date,
                pagesRead: Number,
                timeSpent: Number, // in minutes
                location: String, // physical or digital location
                interruptions: Number,
                mood: String,
                focusLevel: { type: Number, min: 1, max: 10 }
            }],
            milestones: [{
                percentage: Number,
                achievedAt: Date,
                timeToReach: Number // in hours
            }],
            lastReadDate: Date,
            estimatedFinishDate: Date
        },
        
        // User feedback and interaction
        feedback: {
            rating: { type: Number, min: 1, max: 5 },
            review: String,
            highlights: [String],
            notes: [String],
            tags: [String],
            difficulty: { type: Number, min: 1, max: 10 },
            enjoyment: { type: Number, min: 1, max: 10 },
            wouldRecommend: Boolean,
            emotionalImpact: { type: Number, min: 1, max: 10 }
        },
        
        // Context and discovery
        context: {
            discoveryMethod: String, // recommendation, search, browse, friend, etc.
            discoverySource: String, // specific source or person
            motivation: String, // why they chose this book
            readingEnvironment: [String], // home, commute, vacation, etc.
            companionBooks: [{ // books read around the same time
                book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
                relationship: String // sequel, similar_genre, contrasting, etc.
            }]
        },
        
        dateAdded: {
            type: Date,
            default: Date.now
        },
        dateCompleted: Date
    }],
    
    // Enhanced preferences with ML insights
    preferences: {
        // Explicit preferences
        explicit: {
            genres: [{ 
                name: String, 
                preference: { type: Number, min: -1, max: 1 } // -1 dislike, 1 love
            }],
            authors: [{ 
                name: String, 
                preference: { type: Number, min: -1, max: 1 }
            }],
            topics: [{ 
                name: String, 
                preference: { type: Number, min: -1, max: 1 }
            }],
            contentTypes: [{
                type: String, // fiction, non-fiction, biography, etc.
                preference: { type: Number, min: -1, max: 1 }
            }]
        },
        
        // Inferred preferences from behavior
        inferred: {
            preferredComplexity: { type: Number, min: 1, max: 10 },
            preferredLength: { // in pages
                min: Number,
                max: Number,
                optimal: Number
            },
            preferredPacing: String, // slow, moderate, fast
            preferredNarrative: String, // first_person, third_person, multiple_pov
            preferredTimeSettings: [String], // contemporary, historical, futuristic
            preferredEmotionalTone: [String], // uplifting, dark, humorous, serious
            contentSensitivities: [String] // violence, romance, language, etc.
        },
        
        // Reading goals and habits
        goals: {
            booksPerMonth: Number,
            booksPerYear: Number,
            hoursPerWeek: Number,
            hoursPerDay: Number,
            diversityGoals: {
                genreDiversity: Boolean,
                authorDiversity: Boolean,
                culturalDiversity: Boolean,
                timePeriodDiversity: Boolean
            },
            skillGoals: [String] // improve_speed, increase_comprehension, etc.
        },
        
        readingLevel: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert']
        },
        
        // Contextual preferences
        situational: {
            commuteReading: [String], // preferred genres/types for commute
            vacationReading: [String],
            bedroomReading: [String],
            stressedReading: [String], // comfort reads
            challengingMoodReading: [String] // when wanting intellectual challenge
        }
    },
    
    // Advanced AI profile with multiple vectors and insights
    aiProfile: {
        // Multiple embedding vectors for different aspects
        vectors: {
            primary: [Number], // Main interest vector (768-dim)
            genre: [Number], // Genre preferences (256-dim)
            style: [Number], // Writing style preferences (256-dim)
            emotional: [Number], // Emotional preference vector (128-dim)
            complexity: [Number], // Complexity preference vector (128-dim)
            temporal: [Number] // Recent interest shifts (384-dim)
        },
        
        // Behavioral patterns and insights
        patterns: {
            readingRhythm: {
                preferredReadingTimes: [Number], // hours 0-23
                seasonalPatterns: [{
                    season: String,
                    activityLevel: Number,
                    preferredGenres: [String]
                }],
                weeklyPattern: [Number], // activity by day of week
                consistencyScore: Number // 0-1
            },
            
            discoveryPatterns: {
                explorationVsExploitation: Number, // 0-1, 0=only familiar, 1=always new
                serendipityAffinity: Number, // 0-1, openness to unexpected recommendations
                socialInfluence: Number, // 0-1, influence of others' recommendations
                trendFollowing: Number // 0-1, tendency to read popular/trending books
            },
            
            engagementPatterns: {
                attentionSpan: Number, // average session duration in minutes
                multitaskingTendency: Number, // 0-1, reading while doing other things
                deepVsSkimming: Number, // 0-1, 0=always skim, 1=always deep read
                completionRate: Number, // percentage of started books finished
                abandonmentTriggers: [String] // why books are abandoned
            }
        },
        
        // ML model outputs
        modelOutputs: {
            userCluster: String,
            personalityProfile: {
                openness: Number, // 0-1
                conscientiousness: Number, // 0-1
                extraversion: Number, // 0-1
                agreeableness: Number, // 0-1
                neuroticism: Number // 0-1
            },
            lifestageIndicators: {
                currentLifestage: String, // student, early_career, parent, retiree, etc.
                lifestageConfidence: Number, // 0-1
                stageDuration: Number // estimated time in current stage (months)
            },
            riskProfiles: {
                contentRiskTolerance: Number, // 0-1, tolerance for challenging content
                genreRiskTolerance: Number, // 0-1, willingness to try new genres
                lengthRiskTolerance: Number // 0-1, willingness to read long books
            }
        },
        
        // Cached recommendations with metadata
        recommendations: [{
            book: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book'
            },
            score: Number,
            reasoning: {
                primary: String, // main reason
                factors: [String], // contributing factors
                confidence: Number // 0-1
            },
            context: String, // when/why to read this
            freshness: Number, // 0-1, how novel is this recommendation
            dateGenerated: Date,
            modelVersion: String,
            clicked: Boolean,
            dismissed: Boolean,
            feedback: {
                helpful: Boolean,
                reason: String
            }
        }],
        
        // Quality and confidence metrics
        confidence: {
            overall: { type: Number, default: 0 }, // 0-1
            genrePreferences: { type: Number, default: 0 },
            complexityPreferences: { type: Number, default: 0 },
            temporalStability: { type: Number, default: 0 }, // how stable preferences are
            dataQuality: { type: Number, default: 0 }
        },
        
        lastUpdated: Date,
        modelVersion: {
            type: String,
            default: '2.0'
        },
        
        // Processing flags
        needsUpdate: { type: Boolean, default: true },
        processingLocked: { type: Boolean, default: false },
        lastFullAnalysis: Date
    },
    
    // Achievement and gamification
    achievements: [{
        type: String, // milestone_reader, genre_explorer, consistent_reader, etc.
        level: Number,
        achievedAt: Date,
        metadata: Schema.Types.Mixed
    }],
    
    // Social and community aspects
    social: {
        followingReaders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        bookClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BookClub' }],
        sharedBooks: [{ 
            book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
            sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            sharedAt: Date,
            context: String
        }]
    }
}, {
    timestamps: true
});

// Enhanced indexes for performance
ReadingProfileSchema.index({ user: 1 });
ReadingProfileSchema.index({ 'aiProfile.lastUpdated': 1 });
ReadingProfileSchema.index({ 'aiProfile.needsUpdate': 1 });
ReadingProfileSchema.index({ 'aiProfile.modelOutputs.userCluster': 1 });
ReadingProfileSchema.index({ 'readingHistory.book': 1 });
ReadingProfileSchema.index({ 'readingHistory.status': 1 });

// Enhanced methods for AI processing and recommendations
ReadingProfileSchema.methods.updateAIProfile = async function() {
    try {
        // This would integrate with actual ML models
        // For now, we'll implement improved logic
        
        const history = this.readingHistory;
        if (history.length === 0) {
            return false;
        }
        
        // Calculate reading patterns
        this.calculateReadingPatterns();
        
        // Update preference vectors
        await this.updatePreferenceVectors();
        
        // Update confidence scores
        this.updateConfidenceScores();
        
        // Mark as updated
        this.aiProfile.lastUpdated = new Date();
        this.aiProfile.needsUpdate = false;
        
        return true;
    } catch (error) {
        console.error('Error updating AI profile:', error);
        return false;
    }
};

ReadingProfileSchema.methods.calculateReadingPatterns = function() {
    const history = this.readingHistory;
    const now = new Date();
    
    // Calculate completion rate
    const completed = history.filter(h => h.status === 'completed').length;
    const started = history.filter(h => ['reading', 'completed', 'abandoned'].includes(h.status)).length;
    this.aiProfile.patterns.engagementPatterns.completionRate = started > 0 ? completed / started : 0;
    
    // Calculate average session duration
    const sessions = history.flatMap(h => h.progress.readingSessions || []);
    const avgDuration = sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / sessions.length 
        : 0;
    this.aiProfile.patterns.engagementPatterns.attentionSpan = avgDuration;
    
    // Calculate reading consistency
    const recentActivity = history.filter(h => {
        const daysSince = (now - h.engagement.lastViewed) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
    });
    this.aiProfile.patterns.readingRhythm.consistencyScore = Math.min(recentActivity.length / 30, 1);
};

ReadingProfileSchema.methods.updatePreferenceVectors = async function() {
    // This would use actual embedding models
    // For now, generate improved mock vectors based on reading history
    
    const history = this.readingHistory;
    const Book = mongoose.model('Book');
    
    // Get books from history with their embeddings
    const bookIds = history.map(h => h.book).filter(Boolean);
    const books = await Book.find({ _id: { $in: bookIds } });
    
    // Weight books by engagement and rating
    const weightedBooks = history.map(h => {
        const book = books.find(b => b._id.toString() === h.book.toString());
        if (!book) return null;
        
        let weight = 1;
        if (h.feedback.rating) weight *= h.feedback.rating / 5;
        if (h.status === 'completed') weight *= 1.5;
        if (h.favorite) weight *= 2;
        weight *= Math.log(h.engagement.viewCount + 1);
        
        return { book, weight };
    }).filter(Boolean);
    
    // Generate preference vectors (mock implementation)
    const vectorDim = 768;
    this.aiProfile.vectors.primary = Array.from({ length: vectorDim }, () => Math.random() * 2 - 1);
    this.aiProfile.vectors.genre = Array.from({ length: 256 }, () => Math.random() * 2 - 1);
    this.aiProfile.vectors.style = Array.from({ length: 256 }, () => Math.random() * 2 - 1);
    this.aiProfile.vectors.emotional = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
    this.aiProfile.vectors.complexity = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
    
    // Update temporal vector to reflect recent changes
    const recentBooks = weightedBooks.filter(wb => {
        const recentHistory = history.find(h => h.book.toString() === wb.book._id.toString());
        const daysSince = (Date.now() - recentHistory.engagement.lastViewed) / (1000 * 60 * 60 * 24);
        return daysSince <= 90; // Last 3 months
    });
    
    this.aiProfile.vectors.temporal = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
};

ReadingProfileSchema.methods.updateConfidenceScores = function() {
    const history = this.readingHistory;
    
    // Overall confidence based on data quantity and quality
    const dataPoints = history.length;
    const ratedBooks = history.filter(h => h.feedback.rating).length;
    const completedBooks = history.filter(h => h.status === 'completed').length;
    
    this.aiProfile.confidence.overall = Math.min(
        (dataPoints / 20) * 0.4 + 
        (ratedBooks / dataPoints) * 0.3 + 
        (completedBooks / dataPoints) * 0.3,
        1
    );
    
    // Genre preference confidence
    const genreDistribution = {};
    history.forEach(h => {
        if (h.book && h.book.genres) {
            h.book.genres.forEach(genre => {
                genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
            });
        }
    });
    
    const genreVariety = Object.keys(genreDistribution).length;
    this.aiProfile.confidence.genrePreferences = Math.min(genreVariety / 10, 1);
    
    // Temporal stability (how consistent preferences are over time)
    const recentBooks = history.filter(h => {
        const daysSince = (Date.now() - h.engagement.lastViewed) / (1000 * 60 * 60 * 24);
        return daysSince <= 90;
    });
    
    const oldBooks = history.filter(h => {
        const daysSince = (Date.now() - h.engagement.lastViewed) / (1000 * 60 * 60 * 24);
        return daysSince > 90 && daysSince <= 365;
    });
    
    // Compare genre distributions (simplified)
    this.aiProfile.confidence.temporalStability = recentBooks.length > 0 && oldBooks.length > 0 ? 0.8 : 0.5;
};

ReadingProfileSchema.methods.getPersonalizedRecommendations = async function(limit = 10) {
    try {
        const aiService = require('../services/aiService');
        return await aiService.getRecommendedBooks(this.user, limit);
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
};

ReadingProfileSchema.methods.analyzeReadingGoalProgress = function() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const thisYearBooks = this.readingHistory.filter(h => {
        return h.dateCompleted && h.dateCompleted.getFullYear() === currentYear;
    });
    
    const thisMonthBooks = thisYearBooks.filter(h => {
        return h.dateCompleted.getMonth() === currentMonth;
    });
    
    const goals = this.preferences.goals;
    
    return {
        yearly: {
            goal: goals.booksPerYear || 0,
            current: thisYearBooks.length,
            percentage: goals.booksPerYear ? (thisYearBooks.length / goals.booksPerYear) * 100 : 0,
            onTrack: goals.booksPerYear ? thisYearBooks.length >= (goals.booksPerYear * (currentMonth + 1) / 12) : true
        },
        monthly: {
            goal: goals.booksPerMonth || 0,
            current: thisMonthBooks.length,
            percentage: goals.booksPerMonth ? (thisMonthBooks.length / goals.booksPerMonth) * 100 : 0
        }
    };
};

module.exports = mongoose.model('ReadingProfile', ReadingProfileSchema);
