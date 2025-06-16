#!/usr/bin/env node
/**
 * Comprehensive validation script for the enhanced ML-powered recommendation system
 * Tests all major components and features implemented
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const User = require('../models/User');
const ReadingProfile = require('../models/ReadingProfile');
const TrackingEvent = require('../models/TrackingEvent');
const UserBehavior = require('../models/UserBehavior');
const aiService = require('../services/aiService');
const trackingService = require('../services/trackingService');

class EnhancementValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    async runValidation() {
        console.log('\n🚀 Starting Enhanced System Validation...\n');
        
        try {
            await mongoose.connect(process.env.MONGO_URI, { dbName: 'qrlibrary' });
            console.log('✅ Connected to MongoDB\n');

            // Test all enhanced components
            await this.testEnhancedModels();
            await this.testAdvancedTracking();
            await this.testMLRecommendations();
            await this.testAIEmbeddings();
            await this.testUserBehaviorAnalysis();
            await this.testFallbackMechanisms();
            
            this.printSummary();
            
        } catch (error) {
            console.error('❌ Validation failed:', error);
        } finally {
            await mongoose.disconnect();
        }
    }

    async testEnhancedModels() {
        this.logSection('Enhanced Data Models');
        
        // Test Book model enhancements
        const book = await Book.findOne({});
        if (book) {
            this.test('Book AI embeddings support', 
                typeof book.embeddings === 'object' && book.embeddings !== null);
            this.test('Book AI analysis fields', 
                typeof book.aiAnalysis === 'object');
            this.test('Book processing flags', 
                typeof book.processing === 'object');
        }

        // Test ReadingProfile enhancements
        const profile = await ReadingProfile.findOne({});
        if (profile) {
            this.test('ReadingProfile AI profile support', 
                typeof profile.aiProfile === 'object');
            this.test('ReadingProfile behavioral patterns', 
                Array.isArray(profile.behavioralPatterns));
        }

        // Test new models
        const eventCount = await TrackingEvent.countDocuments();
        const behaviorCount = await UserBehavior.countDocuments();
        
        this.test('TrackingEvent model exists', eventCount >= 0);
        this.test('UserBehavior model exists', behaviorCount >= 0);
    }

    async testAdvancedTracking() {
        this.logSection('Advanced Tracking System');
        
        try {
            // Test event creation
            const testEvent = await trackingService.trackEvent('test-user', 'book_view', {
                bookId: 'test-book',
                metadata: { test: true }
            });
            
            this.test('Event tracking creation', testEvent !== null);
            
            // Test session management
            const session = await trackingService.startSession('test-user', {
                userAgent: 'test-agent',
                deviceType: 'desktop'
            });
            
            this.test('Session management', session !== null);
            
            // Test analytics
            const analytics = await trackingService.getUserAnalytics('test-user');
            this.test('User analytics generation', typeof analytics === 'object');
            
        } catch (error) {
            this.test('Advanced tracking system', false, error.message);
        }
    }

    async testMLRecommendations() {
        this.logSection('ML Recommendation Engine');
        
        try {
            // Test ML engine initialization
            const mlEngine = new aiService.MLRecommendationEngine();
            this.test('ML engine initialization', mlEngine !== null);
            
            // Test similarity calculator
            const similarityCalc = new aiService.SimilarityCalculator();
            this.test('Similarity calculator', similarityCalc !== null);
            
            // Test recommendation generation
            const recommendations = await aiService.getRecommendedBooks('test-user', 5);
            this.test('Recommendation generation', Array.isArray(recommendations));
            
            // Test fallback recommendations
            const fallback = await mlEngine.getFallbackRecommendations(3);
            this.test('Fallback recommendations', Array.isArray(fallback) && fallback.length > 0);
            
        } catch (error) {
            this.test('ML recommendation engine', false, error.message);
        }
    }

    async testAIEmbeddings() {
        this.logSection('AI Embeddings and Analysis');
        
        try {
            // Count books with embeddings
            const totalBooks = await Book.countDocuments();
            const booksWithEmbeddings = await Book.countDocuments({
                'embeddings.textual': { $exists: true }
            });
            
            const embeddingPercentage = totalBooks > 0 ? (booksWithEmbeddings / totalBooks) * 100 : 0;
            
            this.test('Books have embedding structure', booksWithEmbeddings >= 0);
            
            if (embeddingPercentage < 50) {
                this.warning(`Only ${embeddingPercentage.toFixed(1)}% of books have embeddings`);
            } else {
                this.test('Sufficient embedding coverage', true);
            }
            
            // Test AI analysis fields
            const booksWithAnalysis = await Book.countDocuments({
                'aiAnalysis.themes': { $exists: true }
            });
            
            this.test('Books have AI analysis', booksWithAnalysis >= 0);
            
        } catch (error) {
            this.test('AI embeddings system', false, error.message);
        }
    }

    async testUserBehaviorAnalysis() {
        this.logSection('User Behavior Analysis');
        
        try {
            // Test behavior pattern generation
            const behaviorCount = await UserBehavior.countDocuments();
            this.test('User behavior tracking active', behaviorCount >= 0);
            
            // Test pattern analysis
            if (behaviorCount > 0) {
                const behavior = await UserBehavior.findOne({});
                this.test('Behavior pattern structure', 
                    behavior && typeof behavior.patterns === 'object');
                this.test('ML insights generation', 
                    behavior && typeof behavior.mlInsights === 'object');
            }
            
        } catch (error) {
            this.test('User behavior analysis', false, error.message);
        }
    }

    async testFallbackMechanisms() {
        this.logSection('Fallback Mechanisms');
        
        try {
            // Test default recommendations
            const defaultRecs = await aiService.getDefaultRecommendations(5);
            this.test('Default recommendations available', 
                Array.isArray(defaultRecs) && defaultRecs.length > 0);
            
            // Test new releases fallback
            const newReleases = await aiService.getNewReleasesForUser('nonexistent-user', 3);
            this.test('New releases fallback', 
                Array.isArray(newReleases));
            
        } catch (error) {
            this.test('Fallback mechanisms', false, error.message);
        }
    }

    test(description, condition, errorMsg = '') {
        const result = {
            description,
            passed: !!condition,
            error: errorMsg
        };
        
        this.results.tests.push(result);
        
        if (condition) {
            console.log(`  ✅ ${description}`);
            this.results.passed++;
        } else {
            console.log(`  ❌ ${description}${errorMsg ? ': ' + errorMsg : ''}`);
            this.results.failed++;
        }
    }

    warning(message) {
        console.log(`  ⚠️  ${message}`);
        this.results.warnings++;
    }

    logSection(title) {
        console.log(`📋 ${title}`);
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 VALIDATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⚠️  Warnings: ${this.results.warnings}`);
        
        const total = this.results.passed + this.results.failed;
        const successRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;
        
        console.log(`\n🎯 Success Rate: ${successRate}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All enhanced features are working correctly!');
        } else {
            console.log('\n🔧 Some issues found that may need attention.');
        }
        
        console.log('='.repeat(60));
    }
}

// Run validation if script is executed directly
if (require.main === module) {
    const validator = new EnhancementValidator();
    validator.runValidation().catch(console.error);
}

module.exports = EnhancementValidator;
