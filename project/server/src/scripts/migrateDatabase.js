require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const ReadingProfile = require('../models/ReadingProfile');
const User = require('../models/User');

/**
 * Database Migration Script v2.0
 * Migrates existing data to new enhanced schema structure
 */
class DatabaseMigrator {
    constructor() {
        this.migratedBooks = 0;
        this.migratedProfiles = 0;
        this.errors = [];
    }

    async migrate() {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('🔌 Connected to MongoDB');
            console.log('🚀 Starting Database Migration v2.0');

            // Step 1: Migrate Books
            await this.migrateBooks();
            
            // Step 2: Migrate Reading Profiles
            await this.migrateReadingProfiles();
            
            // Step 3: Create indexes
            await this.createIndexes();
            
            // Step 4: Validate migration
            await this.validateMigration();

            this.printResults();
            console.log('✅ Migration completed successfully!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
    }

    async migrateBooks() {
        console.log('\n📚 Migrating Books...');
        
        const books = await Book.find({});
        console.log(`Found ${books.length} books to migrate`);

        for (const book of books) {
            try {
                let needsUpdate = false;

                // Add embeddings if missing
                if (!book.embeddings || !book.embeddings.textual) {
                    book.embeddings = {
                        textual: [],
                        semantic: [],
                        style: [],
                        emotional: [],
                        combined: []
                    };
                    needsUpdate = true;
                }

                // Add AI analysis if missing
                if (!book.aiAnalysis) {
                    book.aiAnalysis = {
                        themes: [],
                        moodTags: [],
                        characters: [],
                        plotElements: {
                            setting: null,
                            timeperiod: null,
                            narrative: null,
                            pacing: null
                        },
                        complexityScore: null,
                        emotionalIntensity: null,
                        intellectualChallenge: null,
                        culturalContext: null,
                        socialRelevance: null,
                        uniquenessScore: null,
                        predictions: {
                            popularityScore: null,
                            controversyScore: null,
                            ageAppropriatenessScore: null,
                            literaryMerit: null,
                            commercialAppeal: null
                        },
                        clusters: {
                            thematicCluster: null,
                            styleCluster: null,
                            genreCluster: null,
                            audienceCluster: null
                        },
                        contentAnalysis: {
                            sentimentDistribution: {
                                positive: null,
                                neutral: null,
                                negative: null
                            },
                            topKeywords: [],
                            namedEntities: [],
                            culturalReferences: [],
                            timeReferences: [],
                            locationReferences: []
                        },
                        lastAnalyzed: null,
                        analysisVersion: null
                    };
                    needsUpdate = true;
                }

                // Add enhanced stats if missing
                if (!book.stats || !book.stats.engagement) {
                    if (!book.stats) book.stats = {};
                    
                    book.stats = {
                        ...book.stats,
                        engagement: {
                            averageSessionDuration: null,
                            returnRate: null,
                            recommendationClickRate: null,
                            searchDiscoveryRate: null
                        },
                        trending: {
                            daily: 0,
                            weekly: 0,
                            monthly: 0
                        }
                    };
                    needsUpdate = true;
                }

                // Add data quality metrics if missing
                if (!book.dataQuality) {
                    book.dataQuality = {
                        completeness: 0,
                        accuracy: 0,
                        freshness: 0,
                        enrichment: 0
                    };
                    needsUpdate = true;
                }

                // Add processing flags if missing
                if (!book.processing) {
                    book.processing = {
                        embeddingsGenerated: false,
                        aiAnalysisComplete: false,
                        qualityChecked: false,
                        needsReprocessing: true,
                        lastProcessed: null
                    };
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    // Calculate data quality
                    book.calculateDataQuality();
                    await book.save();
                    this.migratedBooks++;
                    
                    if (this.migratedBooks % 50 === 0) {
                        console.log(`📖 Migrated ${this.migratedBooks} books...`);
                    }
                }
            } catch (error) {
                console.error(`Error migrating book ${book.title}:`, error.message);
                this.errors.push(`Book ${book.title}: ${error.message}`);
            }
        }

        console.log(`✅ Books migration complete: ${this.migratedBooks} updated`);
    }

    async migrateReadingProfiles() {
        console.log('\n👤 Migrating Reading Profiles...');
        
        const profiles = await ReadingProfile.find({});
        console.log(`Found ${profiles.length} reading profiles to migrate`);

        for (const profile of profiles) {
            try {
                let needsUpdate = false;

                // Enhance reading history entries
                if (profile.readingHistory && profile.readingHistory.length > 0) {
                    for (const entry of profile.readingHistory) {
                        // Add enhanced engagement tracking
                        if (!entry.engagement) {
                            entry.engagement = {
                                viewCount: entry.viewCount || 0,
                                lastViewed: entry.lastViewed || new Date(),
                                totalViewDuration: entry.totalViewDuration || 0,
                                averageSessionDuration: 0,
                                deepReadSessions: 0,
                                skimReadSessions: 0,
                                returnVisits: 0
                            };
                            needsUpdate = true;
                        }

                        // Add progress tracking
                        if (!entry.progress) {
                            entry.progress = {
                                pagesRead: 0,
                                totalPages: null,
                                percentage: 0,
                                timeSpent: 0,
                                readingSessions: [],
                                milestones: [],
                                lastReadDate: null,
                                estimatedFinishDate: null
                            };
                            needsUpdate = true;
                        }

                        // Add feedback structure
                        if (!entry.feedback) {
                            entry.feedback = {
                                rating: entry.rating || null,
                                review: null,
                                highlights: [],
                                notes: [],
                                tags: [],
                                difficulty: null,
                                enjoyment: null,
                                wouldRecommend: null,
                                emotionalImpact: null
                            };
                            needsUpdate = true;
                        }

                        // Add context
                        if (!entry.context) {
                            entry.context = {
                                discoveryMethod: null,
                                discoverySource: null,
                                motivation: null,
                                readingEnvironment: [],
                                companionBooks: []
                            };
                            needsUpdate = true;
                        }
                    }
                }

                // Add enhanced preferences
                if (!profile.preferences || !profile.preferences.explicit) {
                    profile.preferences = {
                        explicit: {
                            genres: [],
                            authors: [],
                            topics: [],
                            contentTypes: []
                        },
                        inferred: {
                            preferredComplexity: null,
                            preferredLength: {
                                min: null,
                                max: null,
                                optimal: null
                            },
                            preferredPacing: null,
                            preferredNarrative: null,
                            preferredTimeSettings: [],
                            preferredEmotionalTone: [],
                            contentSensitivities: []
                        },
                        goals: {
                            booksPerMonth: null,
                            booksPerYear: null,
                            hoursPerWeek: null,
                            hoursPerDay: null,
                            diversityGoals: {
                                genreDiversity: false,
                                authorDiversity: false,
                                culturalDiversity: false,
                                timePeriodDiversity: false
                            },
                            skillGoals: []
                        },
                        readingLevel: null,
                        situational: {
                            commuteReading: [],
                            vacationReading: [],
                            bedroomReading: [],
                            stressedReading: [],
                            challengingMoodReading: []
                        }
                    };
                    needsUpdate = true;
                }

                // Add AI profile
                if (!profile.aiProfile) {
                    profile.aiProfile = {
                        vectors: {
                            primary: [],
                            genre: [],
                            style: [],
                            emotional: [],
                            complexity: [],
                            temporal: []
                        },
                        patterns: {
                            readingRhythm: {
                                preferredReadingTimes: [],
                                seasonalPatterns: [],
                                weeklyPattern: [],
                                consistencyScore: 0
                            },
                            discoveryPatterns: {
                                explorationVsExploitation: 0.5,
                                serendipityAffinity: 0.5,
                                socialInfluence: 0.5,
                                trendFollowing: 0.5
                            },
                            engagementPatterns: {
                                attentionSpan: 0,
                                multitaskingTendency: 0.5,
                                deepVsSkimming: 0.5,
                                completionRate: 0,
                                abandonmentTriggers: []
                            }
                        },
                        modelOutputs: {
                            userCluster: null,
                            personalityProfile: {
                                openness: 0.5,
                                conscientiousness: 0.5,
                                extraversion: 0.5,
                                agreeableness: 0.5,
                                neuroticism: 0.5
                            },
                            lifestageIndicators: {
                                currentLifestage: null,
                                lifestageConfidence: 0,
                                stageDuration: null
                            },
                            riskProfiles: {
                                contentRiskTolerance: 0.5,
                                genreRiskTolerance: 0.5,
                                lengthRiskTolerance: 0.5
                            }
                        },
                        recommendations: [],
                        confidence: {
                            overall: 0,
                            genrePreferences: 0,
                            complexityPreferences: 0,
                            temporalStability: 0,
                            dataQuality: 0
                        },
                        lastUpdated: null,
                        modelVersion: '2.0',
                        needsUpdate: true,
                        processingLocked: false,
                        lastFullAnalysis: null
                    };
                    needsUpdate = true;
                }

                // Add achievements
                if (!profile.achievements) {
                    profile.achievements = [];
                    needsUpdate = true;
                }

                // Add social aspects
                if (!profile.social) {
                    profile.social = {
                        followingReaders: [],
                        followers: [],
                        bookClubs: [],
                        sharedBooks: []
                    };
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await profile.save();
                    this.migratedProfiles++;
                    
                    if (this.migratedProfiles % 20 === 0) {
                        console.log(`👤 Migrated ${this.migratedProfiles} profiles...`);
                    }
                }
            } catch (error) {
                console.error(`Error migrating profile ${profile._id}:`, error.message);
                this.errors.push(`Profile ${profile._id}: ${error.message}`);
            }
        }

        console.log(`✅ Reading profiles migration complete: ${this.migratedProfiles} updated`);
    }

    async createIndexes() {
        console.log('\n🔍 Creating database indexes...');
        
        try {
            // Book indexes
            await Book.collection.createIndex({ 
                title: 'text', 
                author: 'text', 
                'genres': 'text',
                'topics': 'text',
                description: 'text'
            });
            
            await Book.collection.createIndex({ 'aiAnalysis.clusters.thematicCluster': 1 });
            await Book.collection.createIndex({ 'aiAnalysis.clusters.genreCluster': 1 });
            await Book.collection.createIndex({ 'aiAnalysis.complexityScore': 1 });
            await Book.collection.createIndex({ 'stats.rating': -1, 'stats.viewCount': -1 });
            await Book.collection.createIndex({ 'stats.trending.weekly': -1 });
            await Book.collection.createIndex({ 'processing.needsReprocessing': 1 });
            
            // ReadingProfile indexes
            await ReadingProfile.collection.createIndex({ user: 1 });
            await ReadingProfile.collection.createIndex({ 'aiProfile.lastUpdated': 1 });
            await ReadingProfile.collection.createIndex({ 'aiProfile.needsUpdate': 1 });
            await ReadingProfile.collection.createIndex({ 'aiProfile.modelOutputs.userCluster': 1 });
            await ReadingProfile.collection.createIndex({ 'readingHistory.book': 1 });
            await ReadingProfile.collection.createIndex({ 'readingHistory.status': 1 });
            
            console.log('✅ Indexes created successfully');
        } catch (error) {
            console.error('Error creating indexes:', error.message);
            this.errors.push(`Index creation: ${error.message}`);
        }
    }

    async validateMigration() {
        console.log('\n✔️ Validating migration...');
        
        try {
            // Check book schema compliance
            const sampleBooks = await Book.find({}).limit(5);
            for (const book of sampleBooks) {
                if (!book.embeddings || !book.aiAnalysis || !book.processing) {
                    throw new Error(`Book ${book.title} missing required fields`);
                }
            }
            
            // Check reading profile schema compliance
            const sampleProfiles = await ReadingProfile.find({}).limit(5);
            for (const profile of sampleProfiles) {
                if (!profile.aiProfile || !profile.preferences) {
                    throw new Error(`Reading profile ${profile._id} missing required fields`);
                }
            }
            
            console.log('✅ Migration validation passed');
        } catch (error) {
            console.error('Validation error:', error.message);
            this.errors.push(`Validation: ${error.message}`);
        }
    }

    printResults() {
        console.log('\n📊 Migration Results:');
        console.log('=====================');
        console.log(`📚 Books migrated: ${this.migratedBooks}`);
        console.log(`👤 Profiles migrated: ${this.migratedProfiles}`);
        console.log(`❌ Errors: ${this.errors.length}`);
        
        if (this.errors.length > 0) {
            console.log('\nErrors encountered:');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
    }
}

async function migrate() {
    const migrator = new DatabaseMigrator();
    await migrator.migrate();
}

migrate();
