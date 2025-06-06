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
    }

    async getRecommendedBooks(userId, limit = 10, options = {}) {
        try {
            const user = await User.findById(userId).populate('readingProfile');
            if (!user || !user.readingProfile) {
                return await this.getColdStartRecommendations(limit);
            }

            const profile = await ReadingProfile.findById(user.readingProfile._id);
            const userBehavior = await UserBehavior.findOne({ userId });

            // Multi-strategy recommendation approach
            const strategies = [
                { method: 'collaborative', weight: 0.4 },
                { method: 'content', weight: 0.3 },
                { method: 'hybrid', weight: 0.2 },
                { method: 'demographic', weight: 0.1 }
            ];

            let allRecommendations = [];

            for (const strategy of strategies) {
                const strategyRecs = await this.getRecommendationsByStrategy(
                    strategy.method, 
                    profile, 
                    userBehavior, 
                    Math.ceil(limit * 1.5)
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
            const finalRecs = this.applyDiversityAndNovelty(aggregatedRecs, profile, limit);

            // Generate explanations
            return finalRecs.map(rec => ({
                ...rec.book.toObject(),
                recommendationScore: rec.finalScore,
                confidence: rec.confidence,
                reason: this.generateAdvancedReason(rec, profile),
                metadata: {
                    strategies: rec.strategies,
                    modelVersion: this.modelVersion,
                    factors: rec.factors
                }
            }));

        } catch (error) {
            console.error('Error in advanced getRecommendedBooks:', error);
            return await this.getFallbackRecommendations(limit);
        }
    }

    async getRecommendationsByStrategy(strategy, profile, userBehavior, limit) {
        switch (strategy) {
            case 'collaborative':
                return await this.getCollaborativeRecommendations(profile, userBehavior, limit);
            case 'content':
                return await this.getContentBasedRecommendations(profile, limit);
            case 'hybrid':
                return await this.getHybridRecommendations(profile, userBehavior, limit);
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

            return recommendations;
        } catch (error) {
            console.error('Error in collaborative recommendations:', error);
            return [];
        }
    }

    async getContentBasedRecommendations(profile, limit) {
        try {
            if (!profile.aiProfile.vectors.primary || profile.aiProfile.vectors.primary.length === 0) {
                return [];
            }

            // Find books with similar content using embeddings
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

                    if (book.embeddings.textual && profile.aiProfile.vectors.genre) {
                        similarities.genre = SimilarityCalculator.calculateCosineSimilarity(
                            profile.aiProfile.vectors.genre,
                            book.embeddings.textual.slice(0, profile.aiProfile.vectors.genre.length)
                        );
                    }

                    if (book.embeddings.emotional && profile.aiProfile.vectors.emotional) {
                        similarities.emotional = SimilarityCalculator.calculateCosineSimilarity(
                            profile.aiProfile.vectors.emotional,
                            book.embeddings.emotional
                        );
                    }

                    // Weighted combined score
                    const finalScore = (
                        (similarities.primary || 0) * 0.5 +
                        (similarities.genre || 0) * 0.3 +
                        (similarities.emotional || 0) * 0.2
                    );

                    return {
                        book,
                        score: finalScore,
                        confidence: Object.keys(similarities).length / 3,
                        factors: ['content_similarity', 'embedding_match'],
                        similarities
                    };
                })
                .filter(item => item && item.score > 0.4)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

            return recommendations;
        } catch (error) {
            console.error('Error in content-based recommendations:', error);
            return [];
        }
    }

    async getHybridRecommendations(profile, userBehavior, limit) {
        try {
            // Combine multiple approaches with dynamic weighting
            const contentRecs = await this.getContentBasedRecommendations(profile, limit * 2);
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

            return hybrid
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

        } catch (error) {
            console.error('Error in hybrid recommendations:', error);
            return [];
        }
    }

    async getDemographicRecommendations(profile, userBehavior, limit) {
        try {
            // Recommend based on similar demographic groups
            const userCluster = userBehavior?.mlInsights?.userCluster || 'general';
            
            // Find popular books in the user's demographic cluster
            const clusterBooks = await Book.find({
                'aiAnalysis.clusters.audienceCluster': userCluster,
                'stats.rating': { $gte: 3.5 },
                'stats.viewCount': { $gte: 10 }
            })
            .sort({ 'stats.rating': -1, 'stats.viewCount': -1 })
            .limit(limit);

            return clusterBooks.map(book => ({
                book,
                score: (book.stats.rating / 5) * 0.7 + (Math.log(book.stats.viewCount + 1) / 10) * 0.3,
                confidence: 0.6,
                factors: ['demographic_match', 'cluster_popularity'],
                cluster: userCluster
            }));

        } catch (error) {
            console.error('Error in demographic recommendations:', error);
            return [];
        }
    }

    async findSimilarUsers(profile, userBehavior, limit = 50) {
        try {
            // Find users with similar reading patterns and preferences
            const currentUserBooks = profile.readingHistory.map(h => h.book.toString());
            
            // Use aggregation to find users with overlapping books
            const similarUsers = await ReadingProfile.aggregate([
                {
                    $match: {
                        user: { $ne: profile.user },
                        'readingHistory.book': { $in: currentUserBooks.map(id => mongoose.Types.ObjectId(id)) }
                    }
                },
                {
                    $project: {
                        user: 1,
                        commonBooks: {
                            $size: {
                                $filter: {
                                    input: '$readingHistory',
                                    cond: { $in: ['$$this.book', currentUserBooks.map(id => mongoose.Types.ObjectId(id))] }
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
    }

    applyDiversityAndNovelty(recommendations, profile, limit) {
        // Apply diversity constraints to avoid too many similar books
        const diverseRecs = [];
        const genreCounts = {};
        const authorCounts = {};
        const complexityCounts = { low: 0, medium: 0, high: 0 };
        
        for (const rec of recommendations) {
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
    }

    async getColdStartRecommendations(limit) {
        // Recommendations for new users with no history
        return await Book.find({
            'stats.rating': { $gte: 4.0 },
            'stats.viewCount': { $gte: 100 }
        })
        .sort({ 'stats.rating': -1, 'stats.viewCount': -1 })
        .limit(limit)
        .then(books => books.map(book => ({
            ...book.toObject(),
            recommendationScore: book.stats.rating / 5,
            reason: 'Highly rated and popular among all readers',
            confidence: 0.8
        })));
    }

    async getFallbackRecommendations(limit) {
        // Fallback when all other methods fail
        return await Book.find({
            'stats.rating': { $gte: 3.5 }
        })
        .sort({ 'stats.viewCount': -1 })
        .limit(limit)
        .then(books => books.map(book => ({
            ...book.toObject(),
            recommendationScore: 0.5,
            reason: 'Popular choice',
            confidence: 0.6
        })));
    }
}

// Initialize the ML engine
const mlEngine = new MLRecommendationEngine();

// Export the enhanced functions
const getRecommendedBooks = async (userId, limit = 10) => {
    return await mlEngine.getRecommendedBooks(userId, limit);
};

// Rest of the existing functions with improvements...
const getDailyRecommendation = async (userId) => {
    try {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        const dateValue = parseInt(dateString.replace(/[-]/g, ''));
        
        const recommendations = await getRecommendedBooks(userId, 10);
        if (!recommendations || recommendations.length === 0) {
            return null;
        }
        
        // Use ML-driven selection instead of simple modulo
        const dailyPick = await mlEngine.selectDailyRecommendation(recommendations, dateValue);
        
        if (dailyPick) {
            return {
                ...dailyPick,
                dailyMessage: generateContextualDailyMessage(dailyPick, userId),
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error in getDailyRecommendation:', error);
        return null;
    }
};

const getNewReleasesForUser = async (userId, limit = 5) => {
    try {
        const user = await User.findById(userId).populate('readingProfile');
        if (!user || !user.readingProfile) {
            return await getGenericNewReleases(limit);
        }
        
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const profile = await ReadingProfile.findById(user.readingProfile._id);
        
        // Use AI to match new releases to user preferences
        const newBooks = await Book.find({
            publishDate: { $gte: sixMonthsAgo },
            'processing.embeddingsGenerated': true
        }).sort({ publishDate: -1 });

        if (!profile.aiProfile.vectors.primary || profile.aiProfile.vectors.primary.length === 0) {
            return newBooks.slice(0, limit).map(book => ({
                ...book.toObject(),
                reason: 'Recent release'
            }));
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

        return scoredBooks.map(item => ({
            ...item.book.toObject(),
            recommendationScore: item.score,
            reason: item.reason
        }));
    } catch (error) {
        console.error('Error in getNewReleasesForUser:', error);
        return [];
    }
};

const getDefaultRecommendations = async (limit = 10) => {
    try {
        const popularBooks = await Book.find({
            'stats.rating': { $gte: 3.5 },
            'stats.viewCount': { $gte: 10 }
        })
        .sort({ 'stats.rating': -1, 'stats.viewCount': -1 })
        .limit(limit);
            
        return popularBooks.map(book => ({
            ...book.toObject(),
            reason: 'Popular among our readers',
            recommendationScore: book.stats.rating / 5
        }));
    } catch (error) {
        console.error('Error in getDefaultRecommendations:', error);
        return [];
    }
};

const getSimilarBooks = async (bookId, limit = 5) => {
    try {
        const book = await Book.findById(bookId);
        if (!book || !book.embeddings?.combined || book.embeddings.combined.length === 0) {
            return await getSimilarBooksByGenre(bookId, limit);
        }
        
        const books = await Book.find({
            _id: { $ne: bookId },
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
                
                const finalScore = scores.combined || 0;
                
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
            confidence: Math.min(item.score, 1)
        }));
    } catch (error) {
        console.error('Error in getSimilarBooks:', error);
        return [];
    }
};

const updateUserAIProfile = async (userId) => {
    try {
        const profile = await ReadingProfile.findOne({ user: userId });
        if (!profile) {
            return null;
        }
        
        // Use the enhanced profile update method
        const updated = await profile.updateAIProfile();
        
        if (updated) {
            await profile.save();
            console.log(`AI profile updated for user ${userId}`);
        }
        
        return profile;
    } catch (error) {
        console.error('Error in updateUserAIProfile:', error);
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
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const newBooks = await Book.find({
        publishDate: { $gte: sixMonthsAgo }
    })
    .sort({ publishDate: -1 })
    .limit(limit);
    
    return newBooks.map(book => ({
        ...book.toObject(),
        reason: 'Recent release'
    }));
};

module.exports = {
    getRecommendedBooks,
    getDailyRecommendation,
    getNewReleasesForUser,
    getDefaultRecommendations,
    updateUserAIProfile,
    getSimilarBooks,
    updateUserRecommendationsAsync,
    SimilarityCalculator,
    MLRecommendationEngine
};
