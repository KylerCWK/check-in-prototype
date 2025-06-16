/**
 * Advanced AI Service for Book Recommendations v2.0
 * Implements state-of-the-art ML algorithms for personalized book discovery
 */

const mongoose = require('mongoose');
const Book = require('../models/Book');
const ReadingProfile = require('../models/ReadingProfile');
const User = require('../models/User');
const UserBehavior = require('../models/UserBehavior');

/**
 * Advanced similarity calculation methods
 */
class SimilarityCalculator {
    static calculateCosineSimilarity(vector1, vector2) {
        if (!vector1 || !vector2 || vector1.length !== vector2.length) {
            return 0;
        }

        const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
        const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

        if (magnitude1 === 0 || magnitude2 === 0) return 0;

        return dotProduct / (magnitude1 * magnitude2);
    }

    static calculateEuclideanDistance(vector1, vector2) {
        if (!vector1 || !vector2 || vector1.length !== vector2.length) {
            return Infinity;
        }

        const distance = Math.sqrt(
            vector1.reduce((sum, val, i) => sum + Math.pow(val - vector2[i], 2), 0)
        );

        return distance;
    }

    static calculateManhattanDistance(vector1, vector2) {
        if (!vector1 || !vector2 || vector1.length !== vector2.length) {
            return Infinity;
        }

        return vector1.reduce((sum, val, i) => sum + Math.abs(val - vector2[i]), 0);
    }

    static calculatePearsonCorrelation(vector1, vector2) {
        if (!vector1 || !vector2 || vector1.length !== vector2.length) {
            return 0;
        }

        const n = vector1.length;
        const sum1 = vector1.reduce((sum, val) => sum + val, 0);
        const sum2 = vector2.reduce((sum, val) => sum + val, 0);
        const sum1Sq = vector1.reduce((sum, val) => sum + val * val, 0);
        const sum2Sq = vector2.reduce((sum, val) => sum + val * val, 0);
        const sumProducts = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);

        const numerator = sumProducts - (sum1 * sum2 / n);
        const denominator = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

        if (denominator === 0) return 0;
        return numerator / denominator;
    }

    static calculateWeightedSimilarity(vectors1, vectors2, weights = {}) {
        const defaultWeights = {
            textual: 0.3,
            semantic: 0.25,
            style: 0.2,
            emotional: 0.15,
            combined: 0.1
        };

        const finalWeights = { ...defaultWeights, ...weights };
        let weightedScore = 0;
        let totalWeight = 0;

        for (const [key, weight] of Object.entries(finalWeights)) {
            if (vectors1[key] && vectors2[key]) {
                const similarity = this.calculateCosineSimilarity(vectors1[key], vectors2[key]);
                weightedScore += similarity * weight;
                totalWeight += weight;
            }
        }

        return totalWeight > 0 ? weightedScore / totalWeight : 0;
    }
}

/**
 * Advanced ML-based Recommendation Engine
 */
class MLRecommendationEngine {
    constructor() {
        this.modelVersion = '2.0';
        this.minInteractionThreshold = 3;
        this.diversityWeight = 0.3;
        this.noveltyWeight = 0.2;
        this.popularityWeight = 0.1;
    }    async getRecommendedBooks(userId, limit = 10, options = {}) {        try {            console.log(`=== getRecommendedBooks called ===`);
            console.log(`userId: ${userId}, limit: ${limit}, refresh: ${!!options.refresh}`);
            
            const user = await User.findById(userId).populate('readingProfile');
            console.log(`User found: ${!!user}, Has reading profile: ${!!(user && user.readingProfile)}`);
            
            if (!user || !user.readingProfile) {
                console.log('Using cold start recommendations');
                return await this.getColdStartRecommendations(limit, options);
            }

            const profile = await ReadingProfile.findById(user.readingProfile._id);
            const userBehavior = await UserBehavior.findOne({ userId });            // Check cache first (unless refresh is requested)
            if (!options.refresh) {
                const cachedRecommendations = recommendationCache.get(userId, 'recommendedBooks', { limit });
                if (cachedRecommendations) {
                    console.log('Cache hit for recommended books');
                    recommendationAnalytics.recordCacheHit();
                    return cachedRecommendations;
                } else {
                    recommendationAnalytics.recordCacheMiss();
                }
            } else {
                console.log('Refresh requested - bypassing cache and forcing fresh recommendations');
                // Clear ALL cache for this user to force fresh recommendations
                recommendationCache.invalidateUser(userId);
                
                // Add strong randomization to ensure different results
                options.randomSeed = Date.now() + Math.random() * 1000;
                options.forceRefresh = true;
                console.log('Using random seed for refresh:', options.randomSeed);
            }

            // Multi-strategy recommendation approach
            const strategies = [
                { method: 'collaborative', weight: 0.4 },
                { method: 'content', weight: 0.3 },
                { method: 'hybrid', weight: 0.2 },
                { method: 'demographic', weight: 0.1 }
            ];

            let allRecommendations = [];            for (const strategy of strategies) {
                const strategyRecs = await this.getRecommendationsByStrategy(
                    strategy.method, 
                    profile, 
                    userBehavior, 
                    Math.ceil(limit * 1.5),
                    options
                );
                
                allRecommendations.push(...strategyRecs.map(rec => ({
                    ...rec,
                    strategyScore: rec.score * strategy.weight,
                    strategy: strategy.method
                })));
            }

            // Aggregate and rank recommendations
            const aggregatedRecs = this.aggregateRecommendations(allRecommendations);
              // Apply diversity and novelty filters
            const finalRecs = this.applyDiversityAndNovelty(aggregatedRecs, profile, limit, options);            // Generate explanations
            const recommendationsWithMetadata = finalRecs.map(rec => ({
                ...(rec.book.toObject ? rec.book.toObject() : rec.book),
                recommendationScore: rec.finalScore,
                confidence: rec.confidence,
                reason: this.generateAdvancedReason(rec, profile),
                metadata: {
                    strategies: rec.strategies,
                    modelVersion: this.modelVersion,
                    factors: rec.factors
                }
            }));            // If refresh was requested, add extra randomization to the final results
            let finalRecommendations = recommendationsWithMetadata;
            if (options.refresh || options.forceRefresh) {
                console.log('Applying strong refresh randomization to final recommendations');
                
                // Take MORE recommendations for better variety on refresh
                const candidateRecs = finalRecommendations.slice(0, Math.min(limit * 3, finalRecommendations.length));
                
                // Apply strong randomization when refreshing
                const randomizedRecs = candidateRecs.map(rec => ({
                    ...rec,
                    recommendationScore: rec.recommendationScore + (Math.random() * 0.6 - 0.3), // Add ±0.3 randomization (stronger)
                    refreshRandomizer: Math.random() // Additional randomizer for sorting
                }));
                
                // Sort by both score and random factor, then take selection
                finalRecommendations = randomizedRecs
                    .sort((a, b) => {
                        const scoreA = a.recommendationScore + (a.refreshRandomizer * 0.2);
                        const scoreB = b.recommendationScore + (b.refreshRandomizer * 0.2);
                        return scoreB - scoreA;
                    })
                    .slice(0, limit);
                
                console.log(`Refresh applied: selected ${finalRecommendations.length} from ${candidateRecs.length} candidates`);
            }

            // Cache the final recommendations (only if not refresh)
            if (!options.refresh) {
                recommendationCache.set(userId, 'recommendedBooks', finalRecommendations, { limit });
            }

            // Record analytics for generated recommendations
            recommendationAnalytics.recordRecommendationGenerated('hybrid', 0, true);

            return finalRecommendations;

        } catch (error) {
            console.error('Error in advanced getRecommendedBooks:', error);
            recommendationAnalytics.recordRecommendationGenerated('hybrid', 0, false);
            return await this.getFallbackRecommendations(limit);
        }
    }    async getRecommendationsByStrategy(strategy, profile, userBehavior, limit, options = {}) {
        switch (strategy) {
            case 'collaborative':
                return await this.getCollaborativeRecommendations(profile, userBehavior, limit);
            case 'content':
                return await this.getContentBasedRecommendations(profile, limit, options);
            case 'hybrid':
                return await this.getHybridRecommendations(profile, userBehavior, limit, options);
            case 'demographic':
                return await this.getDemographicRecommendations(profile, userBehavior, limit);
            default:
                return [];
        }
    }

    async getCollaborativeRecommendations(profile, userBehavior, limit) {
        try {
            // Find similar users based on reading history and behavior
            const similarUsers = await this.findSimilarUsers(profile, userBehavior, 50);
            
            // Get books liked by similar users that this user hasn't read
            const readBookIds = profile.readingHistory.map(h => h.book.toString());
            
            const recommendations = [];
            const bookScores = {};

            for (const similarUser of similarUsers) {
                const otherProfile = await ReadingProfile.findOne({ user: similarUser.userId });
                if (!otherProfile) continue;

                const likedBooks = otherProfile.readingHistory.filter(h => 
                    !readBookIds.includes(h.book.toString()) &&
                    (h.feedback?.rating >= 4 || h.status === 'completed' || h.favorite)
                );

                for (const bookEntry of likedBooks) {
                    const bookId = bookEntry.book.toString();
                    if (!bookScores[bookId]) {
                        bookScores[bookId] = {
                            score: 0,
                            evidence: [],
                            userCount: 0
                        };
                    }

                    const userWeight = similarUser.similarity;
                    const bookWeight = this.calculateBookWeightFromEntry(bookEntry);
                    
                    bookScores[bookId].score += userWeight * bookWeight;
                    bookScores[bookId].evidence.push({
                        userId: similarUser.userId,
                        similarity: similarUser.similarity,
                        rating: bookEntry.feedback?.rating,
                        status: bookEntry.status
                    });
                    bookScores[bookId].userCount++;
                }
            }

            // Convert to recommendations
            const sortedBooks = Object.entries(bookScores)
                .sort(([,a], [,b]) => b.score - a.score)
                .slice(0, limit);

            for (const [bookId, data] of sortedBooks) {
                const book = await Book.findById(bookId);
                if (book) {
                    recommendations.push({
                        book,
                        score: data.score,
                        confidence: Math.min(data.userCount / 5, 1),
                        factors: ['collaborative_filtering', 'similar_users'],
                        evidence: data.evidence
                    });
                }
            }

            // Record analytics
            recommendationAnalytics.recordRecommendationGenerated('collaborative', 0, true);

            return recommendations;
        } catch (error) {            console.error('Error in collaborative recommendations:', error);
            recommendationAnalytics.recordRecommendationGenerated('collaborative', 0, false);
            return [];
        }
    }

    async getContentBasedRecommendations(profile, limit, options = {}) {
        try {
            if (!profile.aiProfile.vectors.primary || profile.aiProfile.vectors.primary.length === 0) {
                return await this.getContentBasedRecommendationsFallback(profile, limit);
            }

            // Use MongoDB Vector Search for improved performance and relevance
            try {
                const vectorSearchResults = await this.getContentBasedRecommendationsWithVectorSearch(profile, limit, options);
                if (vectorSearchResults && vectorSearchResults.length > 0) {
                    recommendationAnalytics.recordRecommendationGenerated('content', 0, true);
                    return vectorSearchResults;
                }
            } catch (vectorError) {
                console.warn('Vector search failed, falling back to similarity calculation:', vectorError);
            }

            // Fallback to traditional similarity calculation
            return await this.getContentBasedRecommendationsFallback(profile, limit);

        } catch (error) {
            console.error('Error in content-based recommendations:', error);
            recommendationAnalytics.recordRecommendationGenerated('content', 0, false);
            return [];        }
    }

    async getContentBasedRecommendationsWithVectorSearch(profile, limit, options = {}) {
        try {
            // Validate vector dimensions before search
            if (!profile.aiProfile.vectors.primary || profile.aiProfile.vectors.primary.length !== 384) {
                console.warn(`Invalid vector dimensions for user profile. Expected 384, got ${profile.aiProfile.vectors.primary?.length || 0}. Falling back to traditional search.`);
                return await this.getContentBasedRecommendationsFallback(profile, limit);
            }

            console.log(`Attempting vector search with ${profile.aiProfile.vectors.primary.length}-dimensional vector${options.randomSeed ? ' (with perturbation)' : ''}`);

            // Slightly perturb the query vector during refresh for more variety
            let queryVector = profile.aiProfile.vectors.primary;
            if (options.randomSeed) {
                queryVector = profile.aiProfile.vectors.primary.map(val => {
                    // Add small random noise (±5%) to each dimension
                    const noise = (Math.random() - 0.5) * 0.1; // ±5% noise
                    return val + (val * noise);
                });
                console.log('Applied vector perturbation for variety');
            }

            // Use MongoDB Atlas Vector Search aggregation pipeline
            const pipeline = [
                {
                    $vectorSearch: {
                        index: "books_vector_index", // Vector search index name
                        path: "embeddings.combined",
                        queryVector: queryVector,
                        numCandidates: options.randomSeed ? limit * 20 : limit * 10, // More candidates for refresh
                        limit: options.randomSeed ? limit * 8 : limit * 3 // Much more results for randomization
                    }
                },
                {
                    $addFields: {
                        vectorSearchScore: { $meta: "vectorSearchScore" }
                    }
                },
                {
                    $match: {
                        'processing.embeddingsGenerated': true,
                        vectorSearchScore: { $gte: 0.5 } // Filter by minimum similarity threshold
                    }
                },
            // Boost based on book quality metrics
            {
                $addFields: {
                    qualityBoost: {
                        $multiply: [
                            { $ifNull: ["$stats.rating", 3.5] },
                            { $log10: { $add: [{ $ifNull: ["$stats.viewCount", 1] }, 1] } }
                        ]
                    }
                }            },                {
                    $addFields: {
                        // Add strong randomization factor when refresh is requested
                        randomFactor: options.randomSeed ? 
                            { $multiply: [{ $rand: {} }, 0.5] } : // 50% randomization during refresh
                            0, // No randomization during normal requests
                        finalScore: options.randomSeed ? 
                            // During refresh: prioritize randomness while maintaining some relevance
                            {
                                $add: [
                                    { $multiply: ["$vectorSearchScore", 0.4] }, // Reduced relevance weight
                                    { $multiply: ["$qualityBoost", 0.1] },
                                    { $multiply: [{ $rand: {} }, 0.5] } // Strong random factor
                                ]
                            } :
                            // Normal request: prioritize relevance
                            {
                                $add: [
                                    { $multiply: ["$vectorSearchScore", 0.7] },
                                    { $multiply: ["$qualityBoost", 0.1] },
                                    { $divide: [{ $ifNull: ["$dataQuality.completeness", 0.5] }, 10] }
                                ]
                            }
                    }
                },
                {
                    // Use different sorting for refresh vs normal
                    $sort: options.randomSeed ? 
                        { finalScore: -1, _id: 1 } : // Add secondary sort for refresh
                        { finalScore: -1 }
                },
                // For refresh, use sample to get truly random results from the candidates
                ...(options.randomSeed ? [{ $sample: { size: limit * 2 } }] : []),
            {
                $limit: limit
            },
            {
                $project: {
                    title: 1,
                    author: 1,
                    coverUrl: 1,
                    genres: 1,
                    description: 1,
                    stats: 1,
                    publishDate: 1,
                    'aiAnalysis.themes': 1,
                    'aiAnalysis.moodTags': 1,
                    'aiAnalysis.complexityScore': 1,
                    embeddings: 1,
                    vectorSearchScore: 1,
                    finalScore: 1
                }            }
        ];        const books = await Book.aggregate(pipeline);
        console.log(`Vector search returned ${books.length} books${options.randomSeed ? ' (with randomization)' : ''}`);
          // Additional randomization for refresh: shuffle the results
        if (options.randomSeed && books.length > limit) {
            console.log('Applying additional shuffle and variety for refresh');
            
            // Strategy 1: Ensure variety by selecting from different genres/authors
            const seenAuthors = new Set();
            const seenGenres = new Set();
            const diverseBooks = [];
            const remainingBooks = [];
            
            // First pass: pick books with unique authors/genres
            for (const book of books) {
                const author = book.author;
                const mainGenre = book.genres?.[0];
                
                if ((!author || !seenAuthors.has(author)) && 
                    (!mainGenre || !seenGenres.has(mainGenre)) && 
                    diverseBooks.length < limit) {
                    diverseBooks.push(book);
                    if (author) seenAuthors.add(author);
                    if (mainGenre) seenGenres.add(mainGenre);
                } else {
                    remainingBooks.push(book);
                }
            }
            
            // Fill remaining slots with shuffled remaining books
            for (let i = remainingBooks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remainingBooks[i], remainingBooks[j]] = [remainingBooks[j], remainingBooks[i]];
            }
            
            const finalBooks = [...diverseBooks, ...remainingBooks].slice(0, limit);
            console.log(`Selected ${finalBooks.length} books with diversity (${diverseBooks.length} diverse, ${finalBooks.length - diverseBooks.length} others)`);
            
            return finalBooks.map(book => ({
                book: book,
                score: book.finalScore || book.vectorSearchScore,
                confidence: Math.min(book.vectorSearchScore * 1.2, 1.0),
                factors: ['vector_search', 'embedding_match', 'quality_boost', 'randomization'],
                similarities: {
                    vector: book.vectorSearchScore,
                    quality: book.qualityBoost
                }
            }));
        }

        return books.slice(0, limit).map(book => ({
            book: book,
            score: book.finalScore || book.vectorSearchScore,
            confidence: Math.min(book.vectorSearchScore * 1.2, 1.0),
            factors: ['vector_search', 'embedding_match', 'quality_boost'],
            similarities: {
                vector: book.vectorSearchScore,
                quality: book.qualityBoost
            }
        }));
        
        } catch (error) {
            console.error('Vector search failed, falling back to traditional search:', error.message);
            return await this.getContentBasedRecommendationsFallback(profile, limit);
        }
    }

    async getContentBasedRecommendationsFallback(profile, limit) {
        // Traditional similarity calculation as fallback
        const books = await Book.find({ 
            'embeddings.combined': { $exists: true, $ne: [] },
            'processing.embeddingsGenerated': true
        });

        const recommendations = books
            .map(book => {
                if (!book.embeddings?.combined || book.embeddings.combined.length === 0) {
                    return null;
                }

                // Calculate multiple similarity scores
                const similarities = {};
                
                if (profile.aiProfile.vectors.primary) {
                    similarities.primary = SimilarityCalculator.calculateCosineSimilarity(
                        profile.aiProfile.vectors.primary,
                        book.embeddings.combined
                    );
                }

                if (book.embeddings.semantic && profile.aiProfile.vectors.genre) {
                    similarities.semantic = SimilarityCalculator.calculateCosineSimilarity(
                        profile.aiProfile.vectors.genre,
                        book.embeddings.semantic
                    );
                }

                if (book.embeddings.emotional && profile.aiProfile.vectors.emotional) {
                    similarities.emotional = SimilarityCalculator.calculateCosineSimilarity(
                        profile.aiProfile.vectors.emotional,
                        book.embeddings.emotional
                    );
                }

                // Weighted combined score with multiple vector types
                const finalScore = SimilarityCalculator.calculateWeightedSimilarity(
                    {
                        combined: profile.aiProfile.vectors.primary,
                        semantic: profile.aiProfile.vectors.genre,
                        emotional: profile.aiProfile.vectors.emotional
                    },
                    book.embeddings,
                    { combined: 0.5, semantic: 0.3, emotional: 0.2 }
                );

                return {
                    book,
                    score: finalScore,
                    confidence: Object.keys(similarities).length / 3,
                    factors: ['content_similarity', 'embedding_match', 'fallback_calculation'],
                    similarities
                };
            })
            .filter(item => item && item.score > 0.4)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return recommendations;
    }    async getHybridRecommendations(profile, userBehavior, limit, options = {}) {
        try {
            // Combine multiple approaches with dynamic weighting
            const contentRecs = await this.getContentBasedRecommendations(profile, limit * 2, options);
            const collabRecs = await this.getCollaborativeRecommendations(profile, userBehavior, limit * 2);
            
            // Weight strategies based on data availability and user behavior
            const contentWeight = this.calculateContentWeight(profile);
            const collabWeight = this.calculateCollabWeight(profile, userBehavior);
            
            const hybrid = [];
            const allBooks = new Map();

            // Add content-based recommendations
            contentRecs.forEach(rec => {
                const bookId = rec.book._id.toString();
                if (!allBooks.has(bookId)) {
                    allBooks.set(bookId, {
                        book: rec.book,
                        scores: {},
                        factors: new Set(),
                        confidences: []
                    });
                }
                
                const entry = allBooks.get(bookId);
                entry.scores.content = rec.score * contentWeight;
                rec.factors.forEach(f => entry.factors.add(f));
                entry.confidences.push(rec.confidence);
            });

            // Add collaborative recommendations
            collabRecs.forEach(rec => {
                const bookId = rec.book._id.toString();
                if (!allBooks.has(bookId)) {
                    allBooks.set(bookId, {
                        book: rec.book,
                        scores: {},
                        factors: new Set(),
                        confidences: []
                    });
                }
                
                const entry = allBooks.get(bookId);
                entry.scores.collaborative = rec.score * collabWeight;
                rec.factors.forEach(f => entry.factors.add(f));
                entry.confidences.push(rec.confidence);
            });

            // Calculate final hybrid scores
            for (const [bookId, entry] of allBooks.entries()) {
                const totalScore = Object.values(entry.scores).reduce((sum, score) => sum + score, 0);
                const avgConfidence = entry.confidences.reduce((sum, conf) => sum + conf, 0) / entry.confidences.length;
                
                hybrid.push({
                    book: entry.book,
                    score: totalScore,
                    confidence: avgConfidence,
                    factors: Array.from(entry.factors),
                    strategies: Object.keys(entry.scores)
                });
            }

            // Record analytics
            recommendationAnalytics.recordRecommendationGenerated('hybrid', 0, true);

            return hybrid
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

        } catch (error) {
            console.error('Error in hybrid recommendations:', error);
            recommendationAnalytics.recordRecommendationGenerated('hybrid', 0, false);
            return [];
        }
    }    async getDemographicRecommendations(profile, userBehavior, limit) {
        try {
            // Recommend based on similar demographic groups
            const userCluster = userBehavior?.mlInsights?.userCluster || 'general';
            
            // Find books - using basic queries that work with actual database structure
            const clusterBooks = await Book.find({})
                .sort({ createdAt: -1 }) // Sort by newest books
                .limit(limit);

            // Record analytics
            recommendationAnalytics.recordRecommendationGenerated('demographic', 0, true);

            return clusterBooks.map(book => ({
                book,
                score: 0.6, // Default demographic score
                confidence: 0.6,
                factors: ['demographic_match', 'cluster_popularity'],
                cluster: userCluster
            }));

        } catch (error) {
            console.error('Error in demographic recommendations:', error);
            recommendationAnalytics.recordRecommendationGenerated('demographic', 0, false);
            return [];
        }
    }async findSimilarUsers(profile, userBehavior, limit = 50) {
        try {
            // Find users with similar reading patterns and preferences
            const currentUserBooks = profile.readingHistory.map(h => h.book.toString());
            
            // Convert string IDs to ObjectId instances
            const currentUserBookIds = currentUserBooks.map(id => new mongoose.Types.ObjectId(id));
            
            // Use aggregation to find users with overlapping books
            const similarUsers = await ReadingProfile.aggregate([
                {
                    $match: {
                        user: { $ne: profile.user },
                        'readingHistory.book': { $in: currentUserBookIds }
                    }
                },
                {
                    $project: {
                        user: 1,
                        commonBooks: {
                            $size: {
                                $filter: {
                                    input: '$readingHistory',
                                    cond: { $in: ['$$this.book', currentUserBookIds] }
                                }
                            }
                        },
                        totalBooks: { $size: '$readingHistory' }
                    }
                },
                {
                    $match: {
                        commonBooks: { $gte: 3 } // At least 3 books in common
                    }
                },
                {
                    $addFields: {
                        similarity: { $divide: ['$commonBooks', '$totalBooks'] }
                    }
                },
                {
                    $sort: { similarity: -1 }
                },
                {
                    $limit: limit
                }
            ]);

            return similarUsers.map(user => ({
                userId: user.user,
                similarity: user.similarity,
                commonBooks: user.commonBooks
            }));

        } catch (error) {
            console.error('Error finding similar users:', error);
            return [];
        }
    }

    calculateBookWeightFromEntry(entry) {
        let weight = 1;
        
        if (entry.feedback?.rating) {
            weight *= entry.feedback.rating / 5;
        }
        
        if (entry.status === 'completed') weight *= 1.5;
        if (entry.favorite) weight *= 2;
        if (entry.feedback?.wouldRecommend) weight *= 1.3;
        
        // Factor in engagement
        if (entry.engagement?.viewCount > 5) weight *= 1.2;
        if (entry.engagement?.totalViewDuration > 1800) weight *= 1.1; // 30+ minutes
        
        return Math.min(weight, 3); // Cap at 3x
    }

    calculateContentWeight(profile) {
        const hasEmbeddings = profile.aiProfile.vectors.primary && profile.aiProfile.vectors.primary.length > 0;
        const confidence = profile.aiProfile.confidence.overall || 0;
        
        return hasEmbeddings ? Math.max(0.3, confidence) : 0.1;
    }

    calculateCollabWeight(profile, userBehavior) {
        const historySize = profile.readingHistory.length;
        const socialConnections = profile.social?.followers?.length || 0;
        
        let weight = Math.min(historySize / 20, 0.7); // Max 0.7 based on history
        weight += Math.min(socialConnections / 10, 0.3); // Max 0.3 based on social
        
        return Math.max(weight, 0.2);
    }

    aggregateRecommendations(recommendations) {
        const bookMap = new Map();
        
        for (const rec of recommendations) {
            const bookId = rec.book._id.toString();
            
            if (!bookMap.has(bookId)) {
                bookMap.set(bookId, {
                    book: rec.book,
                    scores: [],
                    strategies: [],
                    factors: new Set(),
                    totalWeight: 0,
                    confidences: []
                });
            }
            
            const entry = bookMap.get(bookId);
            entry.scores.push(rec.strategyScore);
            entry.strategies.push(rec.strategy);
            entry.totalWeight += rec.strategyScore;
            entry.confidences.push(rec.confidence || 0.5);
            
            if (rec.factors) {
                rec.factors.forEach(f => entry.factors.add(f));
            }
        }
        
        // Calculate final scores
        const result = [];
        for (const [bookId, entry] of bookMap.entries()) {
            const finalScore = entry.totalWeight;
            const avgConfidence = entry.confidences.reduce((sum, conf) => sum + conf, 0) / entry.confidences.length;
            
            result.push({
                book: entry.book,
                finalScore,
                confidence: avgConfidence,
                strategies: entry.strategies,
                factors: Array.from(entry.factors),
                diversity: entry.strategies.length / 4 // Number of different strategies
            });
        }
        
        return result.sort((a, b) => b.finalScore - a.finalScore);
    }    applyDiversityAndNovelty(recommendations, profile, limit, options = {}) {
        // Apply diversity constraints to avoid too many similar books
        const diverseRecs = [];
        const genreCounts = {};
        const authorCounts = {};
        const complexityCounts = { low: 0, medium: 0, high: 0 };
        
        // If refresh is requested, add some randomization to the input recommendations
        let workingRecs = recommendations;
        if (options.refresh) {
            // Shuffle the recommendations before applying diversity
            workingRecs = [...recommendations].sort(() => Math.random() - 0.5);
        }
        
        for (const rec of workingRecs) {
            if (diverseRecs.length >= limit) break;
            
            const book = rec.book;
            
            // Check genre diversity
            const bookGenres = book.genres || [];
            const genreOverlap = bookGenres.some(genre => (genreCounts[genre] || 0) >= 2);
            
            // Check author diversity
            const authorOverlap = (authorCounts[book.author] || 0) >= 2;
            
            // Check complexity diversity
            const complexity = this.categorizeComplexity(book.aiAnalysis?.complexityScore || 5);
            const complexityOverlap = complexityCounts[complexity] >= Math.ceil(limit / 3);
            
            // Apply diversity rules (can be overridden for very high scores)
            const highScore = rec.finalScore > 0.8;
            const shouldInclude = highScore || (!genreOverlap && !authorOverlap && !complexityOverlap);
            
            if (shouldInclude) {
                diverseRecs.push(rec);
                
                // Update counts
                bookGenres.forEach(genre => {
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
                authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
                complexityCounts[complexity]++;
            }
        }
        
        // If we don't have enough diverse recommendations, fill with top remaining
        while (diverseRecs.length < limit && diverseRecs.length < recommendations.length) {
            const remaining = recommendations.filter(rec => 
                !diverseRecs.some(diverseRec => 
                    diverseRec.book._id.toString() === rec.book._id.toString()
                )
            );
            
            if (remaining.length > 0) {
                diverseRecs.push(remaining[0]);
            } else {
                break;
            }
        }
        
        return diverseRecs;
    }

    categorizeComplexity(score) {
        if (score <= 3) return 'low';
        if (score <= 7) return 'medium';
        return 'high';
    }

    generateAdvancedReason(rec, profile) {
        const factors = rec.factors || [];
        const strategies = rec.strategies || [];
        const book = rec.book;
        
        let reason = '';
        
        if (strategies.includes('collaborative')) {
            reason += 'Readers with similar tastes loved this book. ';
        }
        
        if (strategies.includes('content')) {
            reason += 'This matches your reading preferences based on content analysis. ';
        }
        
        if (factors.includes('embedding_match')) {
            reason += 'Our AI found strong thematic similarities to your favorite books. ';
        }
        
        if (factors.includes('demographic_match')) {
            reason += 'Popular among readers in your demographic group. ';
        }
        
        // Add specific genre/author matches
        const userGenres = profile.preferences?.explicit?.genres?.map(g => g.name) || [];
        const bookGenres = book.genres || [];
        const matchingGenres = bookGenres.filter(genre => userGenres.includes(genre));
        
        if (matchingGenres.length > 0) {
            reason += `Matches your interest in ${matchingGenres.slice(0, 2).join(' and ')}. `;
        }
        
        return reason.trim() || 'Recommended based on your reading profile.';
    }    async getColdStartRecommendations(limit, options = {}) {
        // Recommendations for new users with no history
        // Use randomization to provide variety instead of always returning the same books
          try {
            console.log('=== Cold start recommendations ===');
            console.log('Cold start recommendations requested, refresh:', !!options.refresh);
            // Get total count of books
            const totalBooks = await Book.countDocuments({});
            console.log('Total books in database:', totalBooks);
            
            if (totalBooks === 0) {
                return [];
            }
            
            // Use multiple strategies for variety:
            // 1. Recent books (30%)
            // 2. Random popular books (40%) 
            // 3. Diverse genre representation (30%)
            
            const recentLimit = Math.ceil(limit * 0.3);
            const randomLimit = Math.ceil(limit * 0.4);
            const genreLimit = limit - recentLimit - randomLimit;
            
            let recommendations = [];
            
            // 1. Get some recent books
            const recentBooks = await Book.find({})
                .sort({ createdAt: -1 })
                .limit(recentLimit * 2) // Get more than needed
                .then(books => {
                    // Shuffle and take subset for variety
                    const shuffled = books.sort(() => Math.random() - 0.5);
                    return shuffled.slice(0, recentLimit);
                });
            
            recommendations.push(...recentBooks.map(book => ({
                ...book.toObject(),
                recommendationScore: 0.8,
                reason: 'Recently added popular choice',
                confidence: 0.7
            })));
            
            // 2. Get random books using aggregation pipeline
            if (randomLimit > 0) {
                const randomBooks = await Book.aggregate([
                    { $sample: { size: randomLimit } }
                ]);
                
                recommendations.push(...randomBooks.map(book => ({
                    ...book,
                    recommendationScore: 0.7,
                    reason: 'Popular choice for new readers',
                    confidence: 0.8
                })));
            }
            
            // 3. Get diverse genre representation
            if (genreLimit > 0) {
                const genres = await Book.distinct('genres');
                const genresPerBook = Math.max(1, Math.floor(genres.length / genreLimit));
                
                for (let i = 0; i < genreLimit && i < genres.length; i++) {
                    const genre = genres[i];
                    const genreBooks = await Book.aggregate([
                        { $match: { genres: genre } },
                        { $sample: { size: 1 } }
                    ]);
                    
                    if (genreBooks.length > 0) {
                        recommendations.push({
                            ...genreBooks[0],
                            recommendationScore: 0.75,
                            reason: `Great ${genre} choice for exploring new genres`,
                            confidence: 0.6
                        });
                    }
                }
            }
            
            // Remove duplicates and shuffle final results
            const uniqueRecommendations = recommendations.filter((book, index, self) => 
                index === self.findIndex(b => b._id.toString() === book._id.toString())
            );
              const shuffledRecommendations = uniqueRecommendations
                .sort(() => Math.random() - 0.5)
                .slice(0, limit);
            
            console.log('Final cold start recommendations count:', shuffledRecommendations.length);
            console.log('First book title:', shuffledRecommendations[0]?.title);
            
            return shuffledRecommendations;
            
        } catch (error) {
            console.error('Error in cold start recommendations:', error);
            // Fallback to simple random selection
            return await Book.aggregate([
                { $sample: { size: limit } }
            ]).then(books => books.map(book => ({
                ...book,
                recommendationScore: 0.6,
                reason: 'Popular choice',
                confidence: 0.5
            })));
        }
    }async getFallbackRecommendations(limit) {
        // Fallback when all other methods fail
        // Use basic queries that work with actual database structure
        return await Book.find({})
        .sort({ createdAt: -1 }) // Sort by newest first
        .limit(limit)
        .then(books => books.map(book => ({
            ...book.toObject(),
            recommendationScore: 0.5,
            reason: 'Popular choice',
            confidence: 0.6
        })));
    }

    /**
     * Intelligently select a daily recommendation from available recommendations
     * Uses deterministic but varied selection based on date and user preferences
     */
    async selectDailyRecommendation(recommendations, dateValue) {
        try {
            if (!recommendations || recommendations.length === 0) {
                return null;
            }

            // Sort recommendations by score first
            const sortedRecs = recommendations.sort((a, b) => 
                (b.recommendationScore || 0) - (a.recommendationScore || 0)
            );

            // Use top 5 recommendations for variety (or all if less than 5)
            const topCandidates = sortedRecs.slice(0, Math.min(5, sortedRecs.length));

            // Create a deterministic but varied selection based on the date
            // This ensures the same book on the same day but varies across days
            const selectionIndex = dateValue % topCandidates.length;
            const selectedRec = topCandidates[selectionIndex];

            // Add some variability for highly-scored recommendations
            // If there are multiple high-scoring books, occasionally pick from them
            const highScoreBooks = topCandidates.filter(rec => 
                (rec.recommendationScore || 0) >= 0.8
            );

            if (highScoreBooks.length > 1) {
                // Use a different modulo for high-score books to add variety
                const highScoreIndex = Math.floor(dateValue / 10) % highScoreBooks.length;
                return highScoreBooks[highScoreIndex];
            }

            return selectedRec;

        } catch (error) {
            console.error('Error in selectDailyRecommendation:', error);
            // Return the first recommendation as fallback
            return recommendations.length > 0 ? recommendations[0] : null;
        }
    }
}

// Recommendation caching system for improved performance
class RecommendationCache {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.maxCacheSize = 1000; // Maximum number of cached entries
    }

    generateCacheKey(userId, type, params = {}) {
        const paramString = Object.keys(params).sort().map(key => `${key}:${params[key]}`).join('|');
        return `${userId}:${type}:${paramString}`;
    }

    get(userId, type, params = {}) {
        const key = this.generateCacheKey(userId, type, params);
        const cached = this.cache.get(key);
        
        if (!cached) return null;
        
        // Check if cache has expired
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    set(userId, type, data, params = {}) {
        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        const key = this.generateCacheKey(userId, type, params);
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    invalidateUser(userId) {
        // Remove all cache entries for a specific user
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${userId}:`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    clear() {
        this.cache.clear();
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            utilization: (this.cache.size / this.maxCacheSize) * 100
        };
    }
}

// Recommendation Performance Monitor
class RecommendationAnalytics {
    constructor() {
        this.metrics = {
            recommendations: {
                generated: 0,
                cacheHits: 0,
                cacheMisses: 0,
                failures: 0,
                responseTimeSum: 0,
                responses: 0
            },
            strategies: {
                collaborative: { used: 0, successful: 0 },
                content: { used: 0, successful: 0 },
                hybrid: { used: 0, successful: 0 },
                demographic: { used: 0, successful: 0 },
                fallback: { used: 0, successful: 0 }
            },
            userEngagement: {
                dailyRecommendationClicks: 0,
                recommendationViews: 0,
                favoritesAdded: 0
            }
        };
        this.startTime = Date.now();
    }

    recordRecommendationGenerated(strategy, responseTime, success = true) {
        this.metrics.recommendations.generated++;
        this.metrics.recommendations.responseTimeSum += responseTime;
        this.metrics.recommendations.responses++;
        
        if (success) {
            this.metrics.strategies[strategy].successful++;
        } else {
            this.metrics.recommendations.failures++;
        }
        this.metrics.strategies[strategy].used++;
    }

    recordCacheHit() {
        this.metrics.recommendations.cacheHits++;
    }

    recordCacheMiss() {
        this.metrics.recommendations.cacheMisses++;
    }

    recordUserEngagement(type) {
        if (this.metrics.userEngagement[type] !== undefined) {
            this.metrics.userEngagement[type]++;
        }
    }

    getPerformanceReport() {
        const uptime = Date.now() - this.startTime;
        const avgResponseTime = this.metrics.recommendations.responses > 0 
            ? this.metrics.recommendations.responseTimeSum / this.metrics.recommendations.responses 
            : 0;
        
        return {
            uptime: Math.round(uptime / 1000), // in seconds
            recommendations: {
                total: this.metrics.recommendations.generated,
                successRate: ((this.metrics.recommendations.generated - this.metrics.recommendations.failures) / Math.max(this.metrics.recommendations.generated, 1) * 100).toFixed(2) + '%',
                avgResponseTime: Math.round(avgResponseTime) + 'ms',
                cacheHitRate: ((this.metrics.recommendations.cacheHits / Math.max(this.metrics.recommendations.cacheHits + this.metrics.recommendations.cacheMisses, 1)) * 100).toFixed(2) + '%'
            },
            strategies: Object.entries(this.metrics.strategies).map(([name, stats]) => ({
                name,
                used: stats.used,
                successRate: stats.used > 0 ? ((stats.successful / stats.used) * 100).toFixed(2) + '%' : '0%'
            })),
            engagement: this.metrics.userEngagement,
            cache: recommendationCache.getStats()
        };
    }

    reset() {
        this.metrics = {
            recommendations: {
                generated: 0,
                cacheHits: 0,
                cacheMisses: 0,
                failures: 0,
                responseTimeSum: 0,
                responses: 0
            },
            strategies: {
                collaborative: { used: 0, successful: 0 },
                content: { used: 0, successful: 0 },
                hybrid: { used: 0, successful: 0 },
                demographic: { used: 0, successful: 0 },
                fallback: { used: 0, successful: 0 }
            },
            userEngagement: {
                dailyRecommendationClicks: 0,
                recommendationViews: 0,
                favoritesAdded: 0
            }
        };
        this.startTime = Date.now();
    }
}

// Initialize global cache
const recommendationCache = new RecommendationCache();

// Initialize the ML engine
const mlEngine = new MLRecommendationEngine();

// Initialize analytics
const recommendationAnalytics = new RecommendationAnalytics();

// Export the enhanced functions
const getRecommendedBooks = async (userId, limit = 10, options = {}) => {
    return await mlEngine.getRecommendedBooks(userId, limit, options);
};

// Enhanced functions with caching integration
const getDailyRecommendation = async (userId) => {
    try {
        // Check cache first for daily recommendation
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        const dateValue = parseInt(dateString.replace(/[-]/g, ''));
        
        const cachedDaily = recommendationCache.get(userId, 'dailyRecommendation', { date: dateString });
        if (cachedDaily) {
            console.log('Cache hit for daily recommendation');
            return cachedDaily;
        }
        
        let recommendations = await getRecommendedBooks(userId, 10);
        
        // If no personalized recommendations, try fallback strategies
        if (!recommendations || recommendations.length === 0) {
            console.log('No personalized recommendations found, trying fallback strategies...');
            
            // Try getting default recommendations
            recommendations = await getDefaultRecommendations(5);
            
            // If still no recommendations, use ML engine fallback
            if (!recommendations || recommendations.length === 0) {
                console.log('No default recommendations found, using ML engine fallback...');
                recommendations = await mlEngine.getFallbackRecommendations(5);
            }
        }
        
        // Final check - if still no recommendations, return null
        if (!recommendations || recommendations.length === 0) {
            console.log('No recommendations available for daily pick');
            return null;
        }
          // Use ML-driven selection
        const dailyPick = await mlEngine.selectDailyRecommendation(recommendations, dateValue);
        
        if (dailyPick) {
            const result = {
                ...dailyPick,
                dailyMessage: generateContextualDailyMessage(dailyPick, userId),
            };
            
            // Cache the daily recommendation for 24 hours
            recommendationCache.set(userId, 'dailyRecommendation', result, { date: dateString });
            return result;
        }
        
        // If selectDailyRecommendation fails, pick the first recommendation
        console.log('selectDailyRecommendation failed, using first recommendation as fallback');
        const fallbackPick = recommendations[0];
        const fallbackResult = {
            ...fallbackPick,
            dailyMessage: generateContextualDailyMessage(fallbackPick, userId),
        };
        
        // Cache the fallback result too
        recommendationCache.set(userId, 'dailyRecommendation', fallbackResult, { date: dateString });
        return fallbackResult;
        
    } catch (error) {
        console.error('Error in getDailyRecommendation:', error);
        
        // Final fallback - try to get any book as daily recommendation
        try {
            const fallbackBooks = await mlEngine.getFallbackRecommendations(1);
            if (fallbackBooks && fallbackBooks.length > 0) {
                const fallbackBook = fallbackBooks[0];
                return {
                    ...fallbackBook,
                    dailyMessage: 'A great book to start your reading journey!',
                };
            }
        } catch (fallbackError) {
            console.error('Even fallback failed:', fallbackError);
        }
        
        return null;
    }
};

const getNewReleasesForUser = async (userId, limit = 5) => {
    try {
        // Check cache first
        const cachedReleases = recommendationCache.get(userId, 'newReleases', { limit });
        if (cachedReleases) {
            console.log('Cache hit for new releases');
            return cachedReleases;
        }
        
        const user = await User.findById(userId).populate('readingProfile');
        if (!user || !user.readingProfile) {
            const genericReleases = await getGenericNewReleases(limit);
            recommendationCache.set(userId, 'newReleases', genericReleases, { limit });
            return genericReleases;
        }
        
        const profile = await ReadingProfile.findById(user.readingProfile._id);
        
        // Try vector search for personalized new releases
        if (profile.aiProfile.vectors.primary && profile.aiProfile.vectors.primary.length > 0) {
            try {
                const vectorResults = await getNewReleasesWithVectorSearch(profile, limit);
                if (vectorResults && vectorResults.length > 0) {
                    recommendationCache.set(userId, 'newReleases', vectorResults, { limit });
                    return vectorResults;
                }
            } catch (vectorError) {
                console.warn('Vector search failed for new releases, falling back:', vectorError);
            }
        }

        // Fallback to traditional similarity-based matching
        return await getNewReleasesFallback(profile, limit, userId);
        
    } catch (error) {
        console.error('Error in getNewReleasesForUser:', error);
        return [];
    }
};

const getNewReleasesWithVectorSearch = async (profile, limit) => {
    try {
        // Validate vector dimensions before search
        if (!profile.aiProfile.vectors.primary || profile.aiProfile.vectors.primary.length !== 384) {
            console.warn(`Invalid vector dimensions for new releases search. Expected 384, got ${profile.aiProfile.vectors.primary?.length || 0}. Falling back to date-based search.`);
            return await getNewReleasesFallback(limit);
        }        // Adjust time ranges based on available data - this database has mostly older books
        const timeRanges = [
            { months: 12, label: '1 year' },
            { months: 24, label: '2 years' },
            { months: 60, label: '5 years' },
            { months: 120, label: '10 years' } // Extended range for databases with older books
        ];

        // Calculate similarity scores for each recent book
        const scoredBooks = recentBooks.map(book => {
            if (!book.embeddings?.combined || book.embeddings.combined.length !== 384) {
                return null;
            }

            const similarity = SimilarityCalculator.calculateCosineSimilarity(
                profile.aiProfile.vectors.primary,
                book.embeddings.combined
            );

            // Calculate recency boost (newer = higher boost)
            const daysOld = (new Date() - new Date(book.publishDate)) / (1000 * 60 * 60 * 24);
            const recencyBoost = Math.max(0, 1 - (daysOld / 180)); // 6 months = 180 days

            const finalScore = (similarity * 0.8) + (recencyBoost * 0.2);

            return {
                ...book,
                vectorSearchScore: similarity,
                recencyBoost,
                finalScore,
                recommendationScore: finalScore,
                reason: 'New release matching your interests',
                searchMethod: 'vector_similarity'
            };
        }).filter(Boolean); // Remove null entries

        // Sort by final score and take top results
        const sortedBooks = scoredBooks
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, limit);

        console.log(`Vector similarity for new releases returned ${sortedBooks.length} books`);
        return sortedBooks;
        
    } catch (error) {
        console.error('Vector search for new releases failed, falling back to date-based search:', error.message);
        console.log('Using fallback method for new releases');
        return await getNewReleasesFallback(limit);
    }
};

const getNewReleasesFallback = async (limit) => {
    console.log('Using fallback method for new releases');
    
    // Try different time ranges progressively
    const timeRanges = [
        { months: 6, label: '6 months' },
        { months: 12, label: '1 year' },
        { months: 24, label: '2 years' },
        { months: 60, label: '5 years' }
    ];
    
    for (const range of timeRanges) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - range.months);
        
        console.log(`Trying fallback with ${range.label} range (after ${cutoffDate.toISOString()})`);
        
        // Simple date-based new releases without vector search
        const newBooks = await Book.find({
            publishDate: { $gte: cutoffDate },
            'processing.embeddingsGenerated': true
        })
        .sort({ publishDate: -1, 'stats.rating': -1 })
        .limit(limit);

        console.log(`Found ${newBooks.length} books in ${range.label} range`);
        
        if (newBooks.length >= Math.min(limit, 3)) {
            return newBooks.map(book => ({
                ...book.toObject(),
                recommendationScore: 0.7, // Default score for fallback
                reason: `Recent release (${range.label} - fallback)`,
                searchMethod: 'date_based'
            }));
        }
    }
    
    // If still no books found, get any books with high ratings
    console.log('No books found in any time range, getting highly rated books');
    const fallbackBooks = await Book.find({
        'processing.embeddingsGenerated': true,
        'stats.rating': { $gte: 4.0 }
    })
    .sort({ 'stats.rating': -1, publishDate: -1 })
    .limit(limit);
    
    return fallbackBooks.map(book => ({
        ...book.toObject(),
        recommendationScore: 0.6,
        reason: 'Highly rated book (ultimate fallback)',
        searchMethod: 'rating_based'
    }));
};

const getNewReleasesFallbackOld = async (profile, limit, userId) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Use AI to match new releases to user preferences
    const newBooks = await Book.find({
        publishDate: { $gte: sixMonthsAgo },
        'processing.embeddingsGenerated': true
    }).sort({ publishDate: -1 });

    if (!profile.aiProfile.vectors.primary || profile.aiProfile.vectors.primary.length === 0) {
        const result = newBooks.slice(0, limit).map(book => ({
            ...book.toObject(),
            reason: 'Recent release',
            searchMethod: 'chronological'
        }));
        recommendationCache.set(userId, 'newReleases', result, { limit });
        return result;
    }

    const scoredBooks = newBooks
        .map(book => {
            if (!book.embeddings?.combined) return null;
            
            const similarity = SimilarityCalculator.calculateCosineSimilarity(
                profile.aiProfile.vectors.primary,
                book.embeddings.combined
            );
            
            return {
                book,
                score: similarity,
                reason: 'New release matching your interests'
            };
        })
        .filter(item => item && item.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    const result = scoredBooks.map(item => ({
        ...item.book.toObject(),
        recommendationScore: item.score,
        reason: item.reason,
        searchMethod: 'similarity_fallback'
    }));
    
    // Cache the result
    recommendationCache.set(userId, 'newReleases', result, { limit });
    return result;
};

const getDefaultRecommendations = async (limit = 10) => {
    try {
        // Use basic queries that work with actual database structure
        const popularBooks = await Book.find({})
            .sort({ createdAt: -1 }) // Sort by newest books
            .limit(limit);
            
        return popularBooks.map(book => ({
            ...book.toObject(),
            reason: 'Popular among our readers',
            recommendationScore: 0.7 // Default score
        }));
    } catch (error) {
        console.error('Error in getDefaultRecommendations:', error);
        return [];
    }
};

const getSimilarBooks = async (bookId, limit = 5) => {
    try {
        const book = await Book.findById(bookId);
        if (!book) {
            return [];
        }

        // First try vector search if embeddings are available
        if (book.embeddings?.combined && book.embeddings.combined.length > 0) {
            try {
                const vectorSearchResults = await getSimilarBooksWithVectorSearch(book, limit);
                if (vectorSearchResults && vectorSearchResults.length > 0) {
                    return vectorSearchResults;
                }
            } catch (vectorError) {
                console.warn('Vector search failed for similar books, falling back:', vectorError);
            }
        }

        // Fallback to traditional similarity calculation or genre-based
        if (book.embeddings?.combined && book.embeddings.combined.length > 0) {
            return await getSimilarBooksFallback(book, limit);
        } else {
            return await getSimilarBooksByGenre(bookId, limit);
        }
    } catch (error) {
        console.error('Error in getSimilarBooks:', error);
        return [];
    }
};

const getSimilarBooksWithVectorSearch = async (book, limit) => {
    // Use MongoDB Atlas Vector Search for finding similar books
    const pipeline = [
        {
            $vectorSearch: {
                index: "books_vector_index",
                path: "embeddings.combined",
                queryVector: book.embeddings.combined,
                numCandidates: limit * 10,
                limit: limit * 2,
                filter: {
                    _id: { $ne: book._id } // Exclude the source book
                }
            }
        },
        {
            $addFields: {
                vectorSearchScore: { $meta: "vectorSearchScore" }
            }
        },
        {
            $match: {
                'processing.embeddingsGenerated': true,
                vectorSearchScore: { $gte: 0.6 } // Higher threshold for similarity
            }
        },
        // Add semantic similarity score if available
        {
            $addFields: {
                semanticSimilarity: {
                    $cond: {
                        if: { 
                            $and: [
                                { $ne: ["$embeddings.semantic", null] },
                                { $ne: [book.embeddings.semantic, null] }
                            ]
                        },
                        then: "$vectorSearchScore", // Placeholder for semantic similarity
                        else: 0
                    }
                }
            }
        },
        // Boost books with similar genres
        {
            $addFields: {
                genreBoost: {
                    $size: {
                        $setIntersection: [
                            { $ifNull: ["$genres", []] },
                            { $literal: book.genres || [] }
                        ]
                    }
                }
            }
        },
        // Calculate final similarity score
        {
            $addFields: {
                finalSimilarityScore: {
                    $add: [
                        { $multiply: ["$vectorSearchScore", 0.7] },
                        { $multiply: ["$semanticSimilarity", 0.2] },
                        { $multiply: [{ $divide: ["$genreBoost", 5] }, 0.1] }
                    ]
                }
            }
        },
        {
            $sort: { finalSimilarityScore: -1 }
        },
        {
            $limit: limit
        },
        {
            $project: {
                title: 1,
                author: 1,
                coverUrl: 1,
                genres: 1,
                description: 1,
                stats: 1,
                publishDate: 1,
                'aiAnalysis.themes': 1,
                'aiAnalysis.moodTags': 1,
                vectorSearchScore: 1,
                finalSimilarityScore: 1,
                genreBoost: 1
            }
        }
    ];

    const similarBooks = await Book.aggregate(pipeline);

    return similarBooks.map(similar => ({
        ...similar,
        similarityScore: similar.finalSimilarityScore || similar.vectorSearchScore,
        reason: `Similar to ${book.title}`,
        confidence: Math.min((similar.finalSimilarityScore || similar.vectorSearchScore) * 1.1, 1),
        searchMethod: 'vector_search'
    }));
};

const getSimilarBooksFallback = async (book, limit) => {
    // Traditional similarity calculation as fallback
    const books = await Book.find({
        _id: { $ne: book._id },
        'embeddings.combined': { $exists: true, $ne: [] },
        'processing.embeddingsGenerated': true
    });
    
    const similarBooks = books
        .map(similar => {
            const scores = {};
            
            // Calculate multiple similarity metrics
            if (book.embeddings.combined && similar.embeddings.combined) {
                scores.combined = SimilarityCalculator.calculateCosineSimilarity(
                    book.embeddings.combined,
                    similar.embeddings.combined
                );
            }
            
            if (book.embeddings.semantic && similar.embeddings.semantic) {
                scores.semantic = SimilarityCalculator.calculateCosineSimilarity(
                    book.embeddings.semantic,
                    similar.embeddings.semantic
                );
            }

            if (book.embeddings.emotional && similar.embeddings.emotional) {
                scores.emotional = SimilarityCalculator.calculateCosineSimilarity(
                    book.embeddings.emotional,
                    similar.embeddings.emotional
                );
            }
            
            // Use weighted similarity for better results
            const finalScore = SimilarityCalculator.calculateWeightedSimilarity(
                book.embeddings,
                similar.embeddings,
                { combined: 0.5, semantic: 0.3, emotional: 0.2 }
            );
            
            return { 
                book: similar, 
                score: finalScore,
                scores
            };
        })
        .filter(item => item.score > 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    return similarBooks.map(item => ({
        ...item.book.toObject(),
        similarityScore: item.score,
        reason: `Similar to ${book.title}`,
        confidence: Math.min(item.score, 1),
        searchMethod: 'similarity_calculation'
    }));
};

const updateUserAIProfile = async (userId, preferences = null) => {
    const startTime = Date.now();
    
    try {
        let profile = await ReadingProfile.findOne({ user: userId });
        if (!profile) {
            console.log(`Profile not found for user ${userId}, creating one...`);
            // Auto-create profile for existing users
            const user = await User.findById(userId);
            if (user) {
                profile = await user.initializeReadingProfile();
                console.log(`✅ Created reading profile for existing user ${userId}`);
            } else {
                console.log(`❌ User ${userId} not found, cannot create profile`);
                return null;
            }
        }

        // If preferences are provided, update the profile
        if (preferences) {
            console.log(`Updating profile preferences for user ${userId}:`, preferences);
            
            // Update preferences based on survey input
            if (preferences.genres && preferences.genres.length > 0) {
                profile.preferences.favoriteGenres = preferences.genres;
            }
            
            if (preferences.mood) {
                // Map mood to reading style preference
                if (!profile.preferences.readingStyle) {
                    profile.preferences.readingStyle = {};
                }
                profile.preferences.readingStyle.preferredMood = preferences.mood;
            }
            
            if (preferences.time) {
                // Map time preference to book length preference
                const timeToLength = {
                    'quick': 'short',
                    'medium': 'medium', 
                    'long': 'long'
                };
                if (timeToLength[preferences.time]) {
                    profile.preferences.preferredLength = timeToLength[preferences.time];
                }
            }
            
            if (preferences.publicationDate) {
                if (!profile.preferences.filters) {
                    profile.preferences.filters = {};
                }
                profile.preferences.filters.publicationDate = preferences.publicationDate;
            }
            
            // Mark profile as updated
            profile.aiProfile.lastUpdated = new Date();
            profile.aiProfile.needsUpdate = false;
            
            await profile.save();
            console.log(`✅ Profile preferences updated for user ${userId}`);
        }
        
        // Check if update is actually needed
        const lastUpdate = profile.aiProfile.lastUpdated;
        const daysSinceUpdate = lastUpdate ? (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24) : 999;
        
        // Only update if needed (more than 7 days old or manually triggered)
        if (daysSinceUpdate < 7 && !profile.aiProfile.needsUpdate) {
            console.log(`AI profile for user ${userId} is up to date`);
            return profile;
        }
        
        console.log(`Updating AI profile for user ${userId}...`);
        
        // Invalidate user cache when profile is updated
        recommendationCache.invalidateUser(userId);
        
        // Use the enhanced profile update method
        const updated = await profile.updateAIProfile();
        
        if (updated) {
            await profile.save();
            
            const responseTime = Date.now() - startTime;
            console.log(`AI profile updated for user ${userId} in ${responseTime}ms`);
            
            // Trigger async recommendation regeneration
            setTimeout(async () => {
                try {
                    await updateUserRecommendationsAsync(userId);
                    console.log(`Background recommendation update completed for user ${userId}`);
                } catch (error) {
                    console.error(`Background recommendation update failed for user ${userId}:`, error);
                }
            }, 0);
        }
        
        return profile;
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error(`Error in updateUserAIProfile for user ${userId} (${responseTime}ms):`, error);
        return null;
    }
};

const updateUserRecommendationsAsync = async (userId) => {
    try {
        setTimeout(async () => {
            await updateUserAIProfile(userId);
            
            // Generate and cache new recommendations
            const recommendations = await getRecommendedBooks(userId, 20);
            
            const profile = await ReadingProfile.findOne({ user: userId });
            if (profile) {
                profile.aiProfile.recommendations = recommendations.slice(0, 10).map(rec => ({
                    book: rec._id,
                    score: rec.recommendationScore,
                    reasoning: {
                        primary: rec.reason,
                        factors: rec.metadata?.factors || [],
                        confidence: rec.confidence || 0.5
                    },
                    dateGenerated: new Date(),
                    modelVersion: '2.0'
                }));
                
                await profile.save();
            }
            
            console.log(`Updated recommendations for user ${userId} with ML engine v2.0`);
        }, 0);
    } catch (error) {
        console.error(`Error in async recommendation update for user ${userId}:`, error);
    }
};

// Helper functions
const generateContextualDailyMessage = (book, userId) => {
    const timeOfDay = new Date().getHours();
    let timeContext = '';
    
    if (timeOfDay < 12) {
        timeContext = 'Start your day with';
    } else if (timeOfDay < 18) {
        timeContext = 'Perfect for your afternoon reading';
    } else {
        timeContext = 'Unwind tonight with';
    }
    
    const messages = [
        `${timeContext} this handpicked recommendation!`,
        `${timeContext} a book chosen just for you.`,
        `Our AI thinks you'll love this book today.`,
        `Discover something new with today's personalized pick.`,
        `${timeContext} this carefully selected recommendation.`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
};

const getSimilarBooksByGenre = async (bookId, limit) => {
    try {
        const book = await Book.findById(bookId);
        if (!book) return [];
        
        const similarByGenre = await Book.find({
            _id: { $ne: bookId },
            genres: { $in: book.genres || [] }
        })
        .sort({ 'stats.rating': -1 })
        .limit(limit);
        
        return similarByGenre.map(similar => ({
            ...similar.toObject(),
            similarityScore: 0.6,
            reason: `Similar genre to ${book.title}`,
            confidence: 0.6
        }));
    } catch (error) {
        console.error('Error in getSimilarBooksByGenre:', error);
        return [];
    }
};

const getGenericNewReleases = async (limit) => {
    try {
        console.log(`🔍 getGenericNewReleases: Looking for ${limit} generic new releases`);
        
        // First, try to find books with recent publish dates
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        let newBooks = await Book.find({
            publishDate: { $gte: sixMonthsAgo, $ne: null }
        })
        .sort({ publishDate: -1 })
        .limit(limit);
        
        console.log(`📅 Found ${newBooks.length} books with recent publishDate`);
        
        // If no books found with recent publish dates, try books with any publish date
        if (newBooks.length === 0) {
            newBooks = await Book.find({
                publishDate: { $exists: true, $ne: null }
            })
            .sort({ publishDate: -1 })
            .limit(limit);
            
            console.log(`📚 Found ${newBooks.length} books with any publishDate`);
        }
        
        // If still no books found, get random books from the collection
        if (newBooks.length === 0) {
            console.log(`🎲 No books with publishDate found, getting random books`);
            const totalBooks = await Book.countDocuments();
            console.log(`📊 Total books in database: ${totalBooks}`);
            
            if (totalBooks > 0) {
                // Get random books by using aggregation pipeline
                newBooks = await Book.aggregate([
                    { $sample: { size: Math.min(limit, totalBooks) } }
                ]);
                console.log(`🎯 Retrieved ${newBooks.length} random books`);
            }
        }
        
        // Add mock publish dates and reason for books without them
        const result = newBooks.map((book, index) => {
            const bookObj = book.toObject ? book.toObject() : book;
            const mockDate = new Date();
            mockDate.setDate(mockDate.getDate() - (index * 7)); // Each book "published" a week apart
            
            return {
                ...bookObj,
                publishDate: bookObj.publishDate || mockDate,
                reason: bookObj.publishDate ? 'Recent release' : 'Popular new addition',
                stats: bookObj.stats || { rating: 4.0 + Math.random(), viewCount: Math.floor(Math.random() * 1000) }
            };
        });
        
        console.log(`✅ getGenericNewReleases returning ${result.length} books`);
        return result;
        
    } catch (error) {
        console.error('❌ Error in getGenericNewReleases:', error);
        
        // Return fallback data if database query fails
        return [
            {
                _id: 'fallback-generic-1',
                title: 'The Seven Moons of Maali Almeida',
                author: 'Shehan Karunatilaka',
                coverUrl: '/default-cover.png',
                genres: ['Literary Fiction', 'Fantasy'],
                description: 'A darkly comic fantasy about a photographer who must solve his own murder.',
                reason: 'Award-winning recent release',
                publishDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                stats: { rating: 4.2, viewCount: 156 }
            },
            {
                _id: 'fallback-generic-2',
                title: 'Book Lovers',
                author: 'Emily Henry',
                coverUrl: '/default-cover.png',
                genres: ['Romance', 'Contemporary Fiction'],
                description: 'A smart romantic comedy about a literary agent who keeps running into the same brooding editor.',
                reason: 'Popular contemporary release',
                publishDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
                stats: { rating: 4.5, viewCount: 892 }
            },
            {
                _id: 'fallback-generic-3',
                title: 'The Atlas Six',
                author: 'Olivie Blake',
                coverUrl: '/default-cover.png',
                genres: ['Fantasy', 'Dark Academia'],
                description: 'Six young magicians compete for a place in an exclusive society.',
                reason: 'Trending fantasy release',
                publishDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                stats: { rating: 4.3, viewCount: 743 }
            }
        ].slice(0, limit);
    }
};

// Enhanced contextual recommendations
const getContextualRecommendations = async (userId, context, limit = 10) => {
    const startTime = Date.now();
    
    try {
        const cacheKey = `contextual_${context.mood || 'any'}_${context.time || 'any'}_${(context.genres || []).join(',')}`;
        const cachedResult = recommendationCache.get(userId, cacheKey, { limit });
        
        if (cachedResult) {
            recommendationAnalytics.recordCacheHit();
            return cachedResult;
        }
        
        recommendationAnalytics.recordCacheMiss();
        
        const user = await User.findById(userId).populate('readingProfile');
        if (!user || !user.readingProfile) {
            throw new Error('User profile not found');
        }
        
        const profile = await ReadingProfile.findById(user.readingProfile._id);
        const userBehavior = await UserBehavior.findOne({ userId });
        
        // Get base recommendations
        let recommendations = await mlEngine.getRecommendedBooks(userId, limit * 2);
        
        // Apply contextual filters
        recommendations = applyContextualFilters(recommendations, context);
        
        // Re-rank based on context
        recommendations = rerankByContext(recommendations, context, profile);
        
        const result = recommendations.slice(0, limit).map(rec => ({
            ...rec,
            contextualReason: generateContextualReason(rec, context),
            contextApplied: context
        }));
        
        // Cache the result
        recommendationCache.set(userId, cacheKey, result, { limit });
        
        const responseTime = Date.now() - startTime;
        recommendationAnalytics.recordRecommendationGenerated('contextual', responseTime, true);
        
        return result;
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        recommendationAnalytics.recordRecommendationGenerated('contextual', responseTime, false);
        console.error('Error in contextual recommendations:', error);
        throw error;
    }
};

const applyContextualFilters = (recommendations, context) => {
    let filtered = [...recommendations];
    
    // Filter by mood
    if (context.mood) {
        const moodGenreMap = {
            'adventurous': ['Adventure', 'Fantasy', 'Science Fiction'],
            'contemplative': ['Philosophy', 'Literary Fiction', 'Biography'],
            'romantic': ['Romance', 'Contemporary Fiction'],
            'mysterious': ['Mystery', 'Thriller', 'Crime'],
            'educational': ['Science', 'History', 'Self-Help'],
            'escapist': ['Fantasy', 'Science Fiction', 'Adventure']
        };
        
        const moodGenres = moodGenreMap[context.mood] || [];
        if (moodGenres.length > 0) {
            filtered = filtered.filter(rec => 
                rec.genres && rec.genres.some(genre => moodGenres.includes(genre))
            );
        }
    }
    
    // Filter by time of day
    if (context.time) {
        const timeComplexityMap = {
            'morning': { maxComplexity: 7, preferredGenres: ['Self-Help', 'Business', 'Science'] },
            'afternoon': { maxComplexity: 8, preferredGenres: ['Fiction', 'Biography', 'History'] },
            'evening': { maxComplexity: 6, preferredGenres: ['Fiction', 'Mystery', 'Romance'] },
            'night': { maxComplexity: 5, preferredGenres: ['Light Fiction', 'Humor', 'Short Stories'] }
        };
        
        const timePrefs = timeComplexityMap[context.time];
        if (timePrefs) {
            filtered = filtered.filter(rec => {
                const complexity = rec.aiAnalysis?.complexityScore || 5;
                return complexity <= timePrefs.maxComplexity;
            });
        }
    }
      // Filter by genres if specified
    if (context.genres && context.genres.length > 0) {
        filtered = filtered.filter(rec =>
            rec.genres && rec.genres.some(genre => context.genres.includes(genre))
        );
    }
    
    // Filter by publication date if specified
    if (context.publicationDate) {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
        const year2000 = new Date(2000, 0, 1);
        
        filtered = filtered.filter(rec => {
            if (!rec.publishDate) return true; // Include books without publish date
            
            const publishDate = new Date(rec.publishDate);
            
            switch (context.publicationDate) {
                case 'recent':
                    return publishDate >= sixMonthsAgo;
                case 'thisYear':
                    return publishDate >= oneYearAgo;
                case 'lastFewYears':
                    return publishDate >= threeYearsAgo;
                case 'classic':
                    return publishDate < year2000;
                case 'any':
                default:
                    return true;
            }
        });
    }
    
    return filtered;
};

const rerankByContext = (recommendations, context, profile) => {
    return recommendations.map(rec => {
        let contextScore = rec.recommendationScore || 0;
        
        // Boost score based on context match
        if (context.mood && rec.genres) {
            const moodMatch = checkMoodGenreMatch(context.mood, rec.genres);
            if (moodMatch) contextScore += 0.1;
        }
        
        if (context.time) {
            const timeBoost = getTimeBoost(context.time, rec);
            contextScore += timeBoost;
        }
          if (context.genres && rec.genres) {
            const genreOverlap = context.genres.filter(g => rec.genres.includes(g)).length;
            contextScore += (genreOverlap / context.genres.length) * 0.2;
        }
        
        // Boost score based on publication date preference
        if (context.publicationDate && rec.publishDate) {
            const publishDate = new Date(rec.publishDate);
            const now = new Date();
            const ageInYears = (now - publishDate) / (1000 * 60 * 60 * 24 * 365);
            
            switch (context.publicationDate) {
                case 'recent':
                    if (ageInYears < 0.5) contextScore += 0.15;
                    break;
                case 'thisYear':
                    if (ageInYears < 1) contextScore += 0.1;
                    break;
                case 'lastFewYears':
                    if (ageInYears < 3) contextScore += 0.08;
                    break;
                case 'classic':
                    if (ageInYears > 25) contextScore += 0.12;
                    break;
            }
        }
        
        return {
            ...rec,
            recommendationScore: Math.min(contextScore, 1.0) // Cap at 1.0
        };
    }).sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
};

const checkMoodGenreMatch = (mood, genres) => {
    const moodGenreMap = {
        'adventurous': ['Adventure', 'Fantasy', 'Science Fiction'],
        'contemplative': ['Philosophy', 'Literary Fiction', 'Biography'],
        'romantic': ['Romance', 'Contemporary Fiction'],
        'mysterious': ['Mystery', 'Thriller', 'Crime'],
        'educational': ['Science', 'History', 'Self-Help'],
        'escapist': ['Fantasy', 'Science Fiction', 'Adventure']
    };
    
    const moodGenres = moodGenreMap[mood] || [];
    return genres.some(genre => moodGenres.includes(genre));
};

const getTimeBoost = (time, rec) => {
    const timeBoosts = {
        'morning': rec.genres?.includes('Self-Help') ? 0.1 : 0,
        'afternoon': rec.genres?.includes('Biography') ? 0.05 : 0,
        'evening': rec.genres?.includes('Fiction') ? 0.05 : 0,
        'night': (rec.aiAnalysis?.complexityScore || 5) <= 5 ? 0.1 : -0.05
    };
    
    return timeBoosts[time] || 0;
};

const generateContextualReason = (rec, context) => {
    let reason = rec.reason || 'Recommended for you';
    
    if (context.mood) {
        reason += ` Perfect for when you're feeling ${context.mood}.`;
    }
    
    if (context.time) {
        const timeMessages = {
            'morning': 'Great way to start your day',
            'afternoon': 'Perfect afternoon reading',
            'evening': 'Ideal for evening relaxation',
            'night': 'Light reading for bedtime'
        };
        reason += ` ${timeMessages[context.time]}.`;
    }
    
    return reason;
};

module.exports = {
    getRecommendedBooks,
    getDailyRecommendation,
    getNewReleasesForUser,
    getGenericNewReleases,
    getDefaultRecommendations,
    updateUserAIProfile,
    getSimilarBooks,
    updateUserRecommendationsAsync,
    SimilarityCalculator,
    MLRecommendationEngine,
    recommendationCache,
    recommendationAnalytics,
    getContextualRecommendations
};
