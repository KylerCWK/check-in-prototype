require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const ReadingProfile = require('../models/ReadingProfile');
const User = require('../models/User');
const TrackingEvent = require('../models/TrackingEvent');
const UserBehavior = require('../models/UserBehavior');

/**
 * System Health Check and Status Report v2.0
 * Comprehensive analysis of the enhanced tracking and recommendation system
 */
class SystemHealthChecker {
    constructor() {
        this.startTime = new Date();
        this.checks = [];
        this.stats = {};
        this.issues = [];
        this.recommendations = [];
    }

    async runHealthCheck() {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('🔌 Connected to MongoDB');
            console.log('🏥 Running System Health Check v2.0\n');

            // Run all health checks
            await this.checkDatabaseHealth();
            await this.checkDataQuality();
            await this.checkTrackingSystem();
            await this.checkAISystem();
            await this.checkPerformance();
            await this.generateRecommendations();

            this.printHealthReport();
            process.exit(0);
        } catch (error) {
            console.error('❌ Health check failed:', error);
            process.exit(1);
        }
    }

    async checkDatabaseHealth() {
        console.log('📊 Checking Database Health...');
        
        try {
            // Collection counts
            this.stats.totalBooks = await Book.countDocuments();
            this.stats.totalUsers = await User.countDocuments();
            this.stats.totalProfiles = await ReadingProfile.countDocuments();
            this.stats.totalTrackingEvents = await TrackingEvent.countDocuments();
            this.stats.totalUserBehaviors = await UserBehavior.countDocuments();

            // Data completeness
            this.stats.booksWithEmbeddings = await Book.countDocuments({
                'processing.embeddingsGenerated': true
            });
            this.stats.booksWithAIAnalysis = await Book.countDocuments({
                'processing.aiAnalysisComplete': true
            });
            this.stats.profilesWithAI = await ReadingProfile.countDocuments({
                'aiProfile.needsUpdate': false
            });

            // Recent activity
            const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
            this.stats.recentTrackingEvents = await TrackingEvent.countDocuments({
                timestamp: { $gte: last24Hours }
            });

            this.addCheck('Database Collections', 'PASS', 
                `${this.stats.totalBooks} books, ${this.stats.totalUsers} users, ${this.stats.totalTrackingEvents} events`);
            
            if (this.stats.totalBooks === 0) {
                this.addIssue('No books in database', 'Run book import script');
            }
            
        } catch (error) {
            this.addCheck('Database Health', 'FAIL', error.message);
        }
    }

    async checkDataQuality() {
        console.log('🎯 Checking Data Quality...');
        
        try {
            // Book data quality
            const lowQualityBooks = await Book.find({
                'dataQuality.completeness': { $lt: 0.5 }
            }).countDocuments();

            const booksNeedingProcessing = await Book.countDocuments({
                'processing.needsReprocessing': true
            });

            // Profile data quality
            const incompleteProfiles = await ReadingProfile.countDocuments({
                $or: [
                    { 'readingHistory': { $size: 0 } },
                    { 'aiProfile.confidence.overall': { $lt: 0.3 } }
                ]
            });

            this.stats.dataQuality = {
                lowQualityBooks,
                booksNeedingProcessing,
                incompleteProfiles,
                completenessRate: this.stats.totalBooks > 0 ? 
                    ((this.stats.totalBooks - lowQualityBooks) / this.stats.totalBooks * 100).toFixed(1) : 0
            };

            this.addCheck('Data Quality', 
                lowQualityBooks > this.stats.totalBooks * 0.3 ? 'WARN' : 'PASS',
                `${this.stats.dataQuality.completenessRate}% books with good quality`);

            if (lowQualityBooks > 0) {
                this.addIssue(`${lowQualityBooks} books with low data quality`, 
                    'Run data quality improvement process');
            }

        } catch (error) {
            this.addCheck('Data Quality', 'FAIL', error.message);
        }
    }

    async checkTrackingSystem() {
        console.log('📈 Checking Tracking System...');
        
        try {
            // Event distribution
            const eventTypes = await TrackingEvent.aggregate([
                { $group: { _id: '$eventType', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            // Processing status
            const unprocessedEvents = await TrackingEvent.countDocuments({
                processed: false
            });

            // Recent user behavior updates
            const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentBehaviorUpdates = await UserBehavior.countDocuments({
                lastAnalyzed: { $gte: last7Days }
            });

            this.stats.tracking = {
                eventTypes: eventTypes.slice(0, 5),
                unprocessedEvents,
                recentBehaviorUpdates,
                processingRate: this.stats.totalTrackingEvents > 0 ?
                    ((this.stats.totalTrackingEvents - unprocessedEvents) / this.stats.totalTrackingEvents * 100).toFixed(1) : 100
            };

            this.addCheck('Tracking System', 
                unprocessedEvents > 1000 ? 'WARN' : 'PASS',
                `${this.stats.tracking.processingRate}% events processed`);

            if (unprocessedEvents > 500) {
                this.addIssue(`${unprocessedEvents} unprocessed tracking events`, 
                    'Run batch processing job');
            }

        } catch (error) {
            this.addCheck('Tracking System', 'FAIL', error.message);
        }
    }

    async checkAISystem() {
        console.log('🤖 Checking AI System...');
        
        try {
            // AI processing status
            const embeddingProgress = this.stats.totalBooks > 0 ?
                (this.stats.booksWithEmbeddings / this.stats.totalBooks * 100).toFixed(1) : 0;

            const aiAnalysisProgress = this.stats.totalBooks > 0 ?
                (this.stats.booksWithAIAnalysis / this.stats.totalBooks * 100).toFixed(1) : 0;

            // User profile AI readiness
            const aiReadyProfiles = await ReadingProfile.countDocuments({
                'aiProfile.vectors.primary': { $exists: true, $ne: [] }
            });

            const profileAIProgress = this.stats.totalProfiles > 0 ?
                (aiReadyProfiles / this.stats.totalProfiles * 100).toFixed(1) : 0;

            // Recommendation quality
            const profilesWithRecommendations = await ReadingProfile.countDocuments({
                'aiProfile.recommendations': { $ne: [] }
            });

            this.stats.ai = {
                embeddingProgress,
                aiAnalysisProgress,
                profileAIProgress,
                aiReadyProfiles,
                profilesWithRecommendations
            };

            const overallAIHealth = (parseFloat(embeddingProgress) + parseFloat(aiAnalysisProgress) + parseFloat(profileAIProgress)) / 3;

            this.addCheck('AI System', 
                overallAIHealth < 50 ? 'WARN' : 'PASS',
                `${overallAIHealth.toFixed(1)}% AI processing complete`);

            if (parseFloat(embeddingProgress) < 80) {
                this.addIssue(`Only ${embeddingProgress}% of books have embeddings`, 
                    'Run AI processing batch job');
            }

        } catch (error) {
            this.addCheck('AI System', 'FAIL', error.message);
        }
    }

    async checkPerformance() {
        console.log('⚡ Checking Performance...');
        
        try {
            // Index usage
            const bookIndexStats = await Book.collection.getIndexes();
            const profileIndexStats = await ReadingProfile.collection.getIndexes();
            const trackingIndexStats = await TrackingEvent.collection.getIndexes();

            // Database size
            const dbStats = await mongoose.connection.db.stats();

            // Query performance estimates
            const queryStartTime = Date.now();
            await Book.findOne().limit(1);
            const basicQueryTime = Date.now() - queryStartTime;

            const complexQueryStartTime = Date.now();
            await Book.find({ 'stats.rating': { $gte: 4 } }).limit(10);
            const complexQueryTime = Date.now() - complexQueryStartTime;

            this.stats.performance = {
                indexes: {
                    books: Object.keys(bookIndexStats).length,
                    profiles: Object.keys(profileIndexStats).length,
                    tracking: Object.keys(trackingIndexStats).length
                },
                dbSizeMB: (dbStats.dataSize / 1024 / 1024).toFixed(2),
                queryTimes: {
                    basic: basicQueryTime,
                    complex: complexQueryTime
                }
            };

            this.addCheck('Performance', 
                complexQueryTime > 100 ? 'WARN' : 'PASS',
                `DB: ${this.stats.performance.dbSizeMB}MB, Complex query: ${complexQueryTime}ms`);

            if (complexQueryTime > 200) {
                this.addIssue('Slow query performance detected', 
                    'Review indexes and optimize queries');
            }

        } catch (error) {
            this.addCheck('Performance', 'FAIL', error.message);
        }
    }

    async generateRecommendations() {
        console.log('💡 Generating System Recommendations...');
        
        // Data recommendations
        if (this.stats.dataQuality && this.stats.dataQuality.booksNeedingProcessing > 100) {
            this.recommendations.push({
                category: 'Data Quality',
                priority: 'HIGH',
                action: 'Run AI processing pipeline',
                reason: `${this.stats.dataQuality.booksNeedingProcessing} books need processing`
            });
        }

        // Performance recommendations
        if (this.stats.performance && this.stats.performance.queryTimes.complex > 100) {
            this.recommendations.push({
                category: 'Performance',
                priority: 'MEDIUM',
                action: 'Optimize database queries',
                reason: `Query times averaging ${this.stats.performance.queryTimes.complex}ms`
            });
        }

        // Tracking recommendations
        if (this.stats.tracking && this.stats.tracking.unprocessedEvents > 500) {
            this.recommendations.push({
                category: 'Tracking',
                priority: 'HIGH',
                action: 'Process tracking event backlog',
                reason: `${this.stats.tracking.unprocessedEvents} unprocessed events`
            });
        }

        // AI recommendations
        if (this.stats.ai && parseFloat(this.stats.ai.embeddingProgress) < 80) {
            this.recommendations.push({
                category: 'AI System',
                priority: 'MEDIUM',
                action: 'Generate embeddings for remaining books',
                reason: `Only ${this.stats.ai.embeddingProgress}% have embeddings`
            });
        }

        // Growth recommendations
        if (this.stats.totalUsers < 100) {
            this.recommendations.push({
                category: 'Growth',
                priority: 'LOW',
                action: 'Implement user acquisition strategy',
                reason: 'Low user base for effective collaborative filtering'
            });
        }
    }

    addCheck(name, status, details) {
        this.checks.push({ name, status, details });
        const statusIcon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
        console.log(`  ${statusIcon} ${name}: ${details}`);
    }

    addIssue(issue, solution) {
        this.issues.push({ issue, solution });
    }

    printHealthReport() {
        const endTime = new Date();
        const duration = (endTime - this.startTime) / 1000;

        console.log('\n' + '='.repeat(60));
        console.log('📋 SYSTEM HEALTH REPORT');
        console.log('='.repeat(60));
        
        console.log(`🕐 Check completed in ${duration}s at ${endTime.toISOString()}`);
        console.log(`📊 System Version: v2.0 (Enhanced ML)`);
        
        // Summary stats
        console.log('\n📈 SYSTEM STATISTICS:');
        console.log(`  📚 Books: ${this.stats.totalBooks.toLocaleString()}`);
        console.log(`  👥 Users: ${this.stats.totalUsers.toLocaleString()}`);
        console.log(`  📊 Tracking Events: ${this.stats.totalTrackingEvents.toLocaleString()}`);
        console.log(`  🎯 Data Quality: ${this.stats.dataQuality?.completenessRate || 'N/A'}%`);
        console.log(`  🤖 AI Progress: ${this.stats.ai?.embeddingProgress || 'N/A'}%`);
        
        // Check results
        console.log('\n🔍 HEALTH CHECKS:');
        const passCount = this.checks.filter(c => c.status === 'PASS').length;
        const warnCount = this.checks.filter(c => c.status === 'WARN').length;
        const failCount = this.checks.filter(c => c.status === 'FAIL').length;
        
        console.log(`  ✅ Passed: ${passCount}`);
        console.log(`  ⚠️  Warnings: ${warnCount}`);
        console.log(`  ❌ Failed: ${failCount}`);
        
        // Issues
        if (this.issues.length > 0) {
            console.log('\n🚨 ISSUES FOUND:');
            this.issues.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue.issue}`);
                console.log(`     💡 Solution: ${issue.solution}`);
            });
        }
        
        // Recommendations
        if (this.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            this.recommendations.forEach((rec, index) => {
                const priorityIcon = rec.priority === 'HIGH' ? '🔴' : 
                                   rec.priority === 'MEDIUM' ? '🟡' : '🟢';
                console.log(`  ${index + 1}. ${priorityIcon} [${rec.category}] ${rec.action}`);
                console.log(`     ${rec.reason}`);
            });
        }
        
        // Overall health
        console.log('\n🎯 OVERALL HEALTH:');
        const overallScore = (passCount / this.checks.length) * 100;
        const healthStatus = overallScore >= 90 ? 'EXCELLENT' : 
                           overallScore >= 70 ? 'GOOD' : 
                           overallScore >= 50 ? 'FAIR' : 'POOR';
        
        const healthIcon = overallScore >= 90 ? '💚' : 
                          overallScore >= 70 ? '💛' : 
                          overallScore >= 50 ? '🧡' : '❤️';
        
        console.log(`  ${healthIcon} System Health: ${healthStatus} (${overallScore.toFixed(1)}%)`);
        
        console.log('\n' + '='.repeat(60));
        
        if (failCount > 0) {
            console.log('⚠️  Critical issues detected. Please address failed checks immediately.');
        } else if (warnCount > 0) {
            console.log('✅ System operational with minor issues. Consider addressing warnings.');
        } else {
            console.log('🎉 All systems green! Your enhanced ML platform is running optimally.');
        }
    }
}

async function runHealthCheck() {
    const checker = new SystemHealthChecker();
    await checker.runHealthCheck();
}

runHealthCheck();
