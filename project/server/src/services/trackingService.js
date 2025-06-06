const TrackingEvent = require('../models/TrackingEvent');
const UserBehavior = require('../models/UserBehavior');
const ReadingProfile = require('../models/ReadingProfile');
const { v4: uuidv4 } = require('uuid');

class AdvancedTrackingService {
    constructor() {
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.batchSize = 100;
        this.processingQueue = [];
    }

    /**
     * Track any user event with rich metadata
     */
    async trackEvent(eventData) {
        try {
            const {
                userId = null,
                sessionId,
                eventType,
                entityId = null,
                entityType = null,
                metadata = {},
                timestamp = new Date()
            } = eventData;

            // Generate session ID if not provided
            const finalSessionId = sessionId || this.generateSessionId();

            // Enrich metadata with additional context
            const enrichedMetadata = {
                ...metadata,
                serverTimestamp: new Date(),
                processingVersion: '2.0'
            };

            const trackingEvent = new TrackingEvent({
                userId,
                sessionId: finalSessionId,
                eventType,
                entityId,
                entityType,
                metadata: enrichedMetadata,
                timestamp
            });

            await trackingEvent.save();

            // Add to processing queue for real-time analysis
            this.addToProcessingQueue(trackingEvent);

            return {
                success: true,
                eventId: trackingEvent._id,
                sessionId: finalSessionId
            };
        } catch (error) {
            console.error('Error tracking event:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Track book interaction with detailed analytics
     */
    async trackBookInteraction(data) {
        const {
            userId,
            bookId,
            interactionType,
            metadata = {}
        } = data;

        return await this.trackEvent({
            userId,
            sessionId: metadata.sessionId,
            eventType: interactionType,
            entityId: bookId,
            entityType: 'book',
            metadata: {
                ...metadata,
                bookContext: await this.getBookContext(bookId)
            }
        });
    }

    /**
     * Track reading session with progress
     */
    async trackReadingSession(data) {
        const {
            userId,
            bookId,
            sessionData,
            metadata = {}
        } = data;

        return await this.trackEvent({
            userId,
            sessionId: metadata.sessionId,
            eventType: 'reading_progress_update',
            entityId: bookId,
            entityType: 'book',
            metadata: {
                ...metadata,
                progress: sessionData,
                readingContext: await this.getReadingContext(userId, bookId)
            }
        });
    }

    /**
     * Track search behavior with intent analysis
     */
    async trackSearch(data) {
        const {
            userId,
            query,
            filters,
            results,
            metadata = {}
        } = data;

        // Analyze search intent
        const searchIntent = this.analyzeSearchIntent(query, filters);

        return await this.trackEvent({
            userId,
            sessionId: metadata.sessionId,
            eventType: 'search',
            entityType: 'search_query',
            metadata: {
                ...metadata,
                searchQuery: query,
                filterCriteria: filters,
                resultCount: results?.length || 0,
                searchIntent,
                queryComplexity: this.calculateQueryComplexity(query)
            }
        });
    }

    /**
     * Batch process tracking events for ML analysis
     */
    async processBatch(batchId = null) {
        try {
            const query = batchId 
                ? { batchId, processed: false }
                : { processed: false };

            const events = await TrackingEvent.find(query)
                .limit(this.batchSize)
                .sort({ timestamp: 1 });

            if (events.length === 0) {
                return { processed: 0 };
            }

            const currentBatchId = batchId || uuidv4();
            
            // Update events with batch ID
            await TrackingEvent.updateMany(
                { _id: { $in: events.map(e => e._id) } },
                { $set: { batchId: currentBatchId } }
            );

            // Process each event
            for (const event of events) {
                await this.processEvent(event);
            }

            // Mark as processed
            await TrackingEvent.updateMany(
                { batchId: currentBatchId },
                { $set: { processed: true } }
            );

            return {
                processed: events.length,
                batchId: currentBatchId
            };
        } catch (error) {
            console.error('Error processing batch:', error);
            throw error;
        }
    }

    /**
     * Process individual event for user behavior analysis
     */
    async processEvent(event) {
        try {
            if (!event.userId) return; // Skip anonymous events for now

            let userBehavior = await UserBehavior.findOne({ userId: event.userId });
            if (!userBehavior) {
                userBehavior = new UserBehavior({ userId: event.userId });
            }

            // Update metrics
            userBehavior.metrics.totalEvents += 1;
            
            // Process based on event type
            switch (event.eventType) {
                case 'book_view':
                    await this.processBookViewEvent(event, userBehavior);
                    break;
                case 'search':
                    await this.processSearchEvent(event, userBehavior);
                    break;
                case 'recommendation_click':
                    await this.processRecommendationEvent(event, userBehavior);
                    break;
                case 'reading_progress_update':
                    await this.processReadingProgressEvent(event, userBehavior);
                    break;
                case 'session_start':
                    await this.processSessionEvent(event, userBehavior);
                    break;
                default:
                    await this.processGenericEvent(event, userBehavior);
            }

            // Update timestamps and save
            userBehavior.lastAnalyzed = new Date();
            await userBehavior.save();

        } catch (error) {
            console.error('Error processing event:', event._id, error);
        }
    }

    /**
     * Generate comprehensive user analytics
     */
    async generateUserAnalytics(userId, timeframe = '30d') {
        const userBehavior = await UserBehavior.findOne({ userId });
        if (!userBehavior) {
            return null;
        }

        const timeframeDays = parseInt(timeframe.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeframeDays);

        const events = await TrackingEvent.find({
            userId,
            timestamp: { $gte: startDate }
        }).sort({ timestamp: -1 });

        return {
            userBehavior: userBehavior.toObject(),
            recentActivity: this.analyzeRecentActivity(events),
            trends: this.identifyTrends(events),
            recommendations: this.generateBehaviorRecommendations(userBehavior, events),
            insights: this.generateInsights(userBehavior, events)
        };
    }

    /**
     * Helper methods
     */
    generateSessionId() {
        return uuidv4();
    }

    addToProcessingQueue(event) {
        this.processingQueue.push(event);
        
        // Process queue when it reaches batch size
        if (this.processingQueue.length >= this.batchSize) {
            this.processBatch();
            this.processingQueue = [];
        }
    }

    async getBookContext(bookId) {
        const Book = require('../models/Book');
        const book = await Book.findById(bookId);
        return book ? {
            genres: book.genres,
            topics: book.topics,
            complexity: book.aiAnalysis?.complexityScore,
            popularity: book.stats?.viewCount
        } : null;
    }

    async getReadingContext(userId, bookId) {
        const profile = await ReadingProfile.findOne({ user: userId });
        const bookEntry = profile?.readingHistory?.find(
            entry => entry.book.toString() === bookId
        );
        
        return bookEntry ? {
            currentStatus: bookEntry.status,
            progress: bookEntry.progress,
            timeSpent: bookEntry.totalViewDuration,
            engagement: bookEntry.viewCount
        } : null;
    }

    analyzeSearchIntent(query, filters) {
        // Simple intent analysis - can be enhanced with NLP
        const intents = [];
        
        if (query.toLowerCase().includes('recommend')) intents.push('recommendation');
        if (query.toLowerCase().includes('similar')) intents.push('similarity');
        if (filters?.genres?.length > 0) intents.push('genre_specific');
        if (filters?.author) intents.push('author_specific');
        if (query.length < 3) intents.push('browsing');
        else if (query.length > 20) intents.push('specific_search');
        else intents.push('general_search');
        
        return intents;
    }

    calculateQueryComplexity(query) {
        // Simple complexity score based on query characteristics
        let complexity = 0;
        
        complexity += query.length * 0.1;
        complexity += (query.match(/\s+/g) || []).length * 0.5;
        complexity += (query.match(/['"]/g) || []).length * 0.3;
        complexity += (query.match(/[()]/g) || []).length * 0.2;
        
        return Math.min(complexity, 10); // Cap at 10
    }

    async processBookViewEvent(event, userBehavior) {
        userBehavior.metrics.booksViewed += 1;
        
        if (event.metadata.viewDuration) {
            const avgTime = userBehavior.behaviorPatterns.interactionDepth.averageTimeOnPage;
            userBehavior.behaviorPatterns.interactionDepth.averageTimeOnPage = 
                (avgTime + event.metadata.viewDuration) / 2;
        }
    }

    async processSearchEvent(event, userBehavior) {
        userBehavior.metrics.searchesPerformed += 1;
    }

    async processRecommendationEvent(event, userBehavior) {
        userBehavior.metrics.recommendationsClicked += 1;
    }

    async processReadingProgressEvent(event, userBehavior) {
        if (event.metadata.progress?.percentage === 100) {
            userBehavior.metrics.booksCompleted += 1;
        }
    }

    async processSessionEvent(event, userBehavior) {
        userBehavior.metrics.totalSessions += 1;
    }

    async processGenericEvent(event, userBehavior) {
        // Generic processing for other event types
        if (event.metadata.timeSpent) {
            userBehavior.metrics.totalTimeSpent += event.metadata.timeSpent / 60; // Convert to minutes
        }
    }

    analyzeRecentActivity(events) {
        const activityByDay = {};
        const eventTypes = {};
        
        events.forEach(event => {
            const day = event.timestamp.toISOString().split('T')[0];
            activityByDay[day] = (activityByDay[day] || 0) + 1;
            eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
        });
        
        return {
            dailyActivity: activityByDay,
            eventDistribution: eventTypes,
            totalEvents: events.length
        };
    }

    identifyTrends(events) {
        // Simple trend analysis - can be enhanced with more sophisticated algorithms
        const recentWeek = events.filter(e => 
            (Date.now() - e.timestamp.getTime()) < (7 * 24 * 60 * 60 * 1000)
        );
        
        const previousWeek = events.filter(e => {
            const timeDiff = Date.now() - e.timestamp.getTime();
            return timeDiff >= (7 * 24 * 60 * 60 * 1000) && timeDiff < (14 * 24 * 60 * 60 * 1000);
        });
        
        return {
            activityTrend: recentWeek.length > previousWeek.length ? 'increasing' : 'decreasing',
            weeklyGrowth: previousWeek.length > 0 ? 
                ((recentWeek.length - previousWeek.length) / previousWeek.length * 100).toFixed(1) : 0
        };
    }

    generateBehaviorRecommendations(userBehavior, events) {
        const recommendations = [];
        
        if (userBehavior.behaviorPatterns.sessionFrequency.daily < 1) {
            recommendations.push({
                type: 'engagement',
                message: 'Consider setting daily reading goals to improve consistency',
                priority: 'medium'
            });
        }
        
        if (userBehavior.metrics.recommendationsClicked < 5) {
            recommendations.push({
                type: 'discovery',
                message: 'Try exploring our AI recommendations for better book discovery',
                priority: 'low'
            });
        }
        
        return recommendations;
    }

    generateInsights(userBehavior, events) {
        return {
            readingPersonality: this.determineReadingPersonality(userBehavior),
            optimalReadingTimes: this.identifyOptimalReadingTimes(events),
            contentPreferences: this.analyzeContentPreferences(events),
            engagementLevel: this.calculateEngagementLevel(userBehavior)
        };
    }

    determineReadingPersonality(userBehavior) {
        // Simplified personality determination
        const patterns = userBehavior.behaviorPatterns;
        
        if (patterns.discoveryBehavior?.explorationScore > 0.7) {
            return 'Explorer';
        } else if (patterns.readingVelocity?.consistencyScore > 0.8) {
            return 'Consistent Reader';
        } else if (userBehavior.metrics.searchesPerformed > userBehavior.metrics.recommendationsClicked) {
            return 'Active Searcher';
        } else {
            return 'Casual Reader';
        }
    }

    identifyOptimalReadingTimes(events) {
        const hourCounts = {};
        
        events.forEach(event => {
            const hour = event.timestamp.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const sortedHours = Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
        
        return sortedHours;
    }

    analyzeContentPreferences(events) {
        const bookEvents = events.filter(e => e.entityType === 'book');
        // This would analyze the books interacted with to determine preferences
        // For now, return a placeholder
        return {
            topGenres: ['Fiction', 'Science Fiction', 'Mystery'],
            preferredComplexity: 'Medium'
        };
    }

    calculateEngagementLevel(userBehavior) {
        const metrics = userBehavior.metrics;
        const totalInteractions = metrics.totalEvents;
        const timeSpent = metrics.totalTimeSpent;
        
        if (totalInteractions > 100 && timeSpent > 600) { // 10+ hours
            return 'High';
        } else if (totalInteractions > 50 && timeSpent > 300) { // 5+ hours
            return 'Medium';
        } else {
            return 'Low';
        }
    }
}

module.exports = new AdvancedTrackingService();
