/**
 * AI Service for Book Recommendations
 * This service provides the core functionality for AI-based book recommendations.
 */

const mongoose = require('mongoose');
const Book = mongoose.model('Book');
const ReadingProfile = mongoose.model('ReadingProfile');
const User = mongoose.model('User');

/**
 * Similarity calculation methods
 */
const calculateCosineSimilarity = (vector1, vector2) => {
    if (!vector1 || !vector2 || vector1.length !== vector2.length) {
        return 0;
    }

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Get recommended books based on user's reading profile
 * @param {ObjectId} userId - The user ID
 * @param {Number} limit - Maximum number of books to return
 * @returns {Array} Array of book recommendations
 */
const getRecommendedBooks = async (userId, limit = 10) => {
    try {
        // Get user's reading profile
        const user = await User.findById(userId).populate('readingProfile');
        if (!user || !user.readingProfile) {
            return [];
        }

        const profile = await ReadingProfile.findById(user.readingProfile._id);
        if (!profile.aiProfile.interestVector || profile.aiProfile.interestVector.length === 0) {
            // If no interest vector exists, generate default recommendations
            return getDefaultRecommendations(limit);
        }

        // Find books with embeddings and calculate similarity
        const books = await Book.find({ embeddings: { $exists: true, $ne: [] } });
        
        const recommendations = books
            .map(book => {
                if (!book.embeddings || book.embeddings.length === 0) {
                    return { book, score: 0 };
                }
                
                // Calculate similarity score
                const score = calculateCosineSimilarity(
                    profile.aiProfile.interestVector, 
                    book.embeddings
                );
                
                return { book, score };
            })
            .filter(item => item.score > 0.3) // Threshold for minimum similarity
            .sort((a, b) => b.score - a.score) // Sort by highest similarity
            .slice(0, limit); // Limit the number of results
        
        // Log the recommendations for debugging
        console.log(`Generated ${recommendations.length} recommendations for user ${userId}`);
        
        return recommendations.map(item => ({
            ...item.book.toObject(),
            recommendationScore: item.score,
            reason: generateRecommendationReason(item.book, item.score, profile)
        }));
    } catch (error) {
        console.error('Error in getRecommendedBooks:', error);
        return [];
    }
};

/**
 * Get daily book recommendation
 * @param {ObjectId} userId - The user ID
 * @returns {Object} A single book recommendation for the day
 */
const getDailyRecommendation = async (userId) => {
    try {
        // Use the date to generate a "random" but stable pick for the day
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        const dateValue = parseInt(dateString.replace(/[-]/g, ''));
        
        // Get 5 recommendations
        const recommendations = await getRecommendedBooks(userId, 5);
        if (!recommendations || recommendations.length === 0) {
            return null;
        }
        
        // Pick one based on the date value (ensures same recommendation all day)
        const dailyPick = recommendations[dateValue % recommendations.length];
        
        if (dailyPick) {
            return {
                ...dailyPick,
                dailyMessage: generateDailyMessage(dailyPick),
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error in getDailyRecommendation:', error);
        return null;
    }
};

/**
 * Get newly released books that match user interests
 * @param {ObjectId} userId - The user ID
 * @param {Number} limit - Maximum number of books to return
 * @returns {Array} Array of new book recommendations
 */
const getNewReleasesForUser = async (userId, limit = 5) => {
    try {
        const user = await User.findById(userId).populate('readingProfile');
        if (!user || !user.readingProfile) {
            return [];
        }
        
        // Define "new" as books published in the last 90 days
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        // Get the user's preferred genres and topics
        const profile = await ReadingProfile.findById(user.readingProfile._id);
        const preferredGenres = profile.preferences.genres || [];
        const preferredTopics = profile.preferences.topics || [];
        
        // Query for new books matching the user's interests
        const newBooks = await Book.find({
            publishDate: { $gte: threeMonthsAgo },
            $or: [
                { genres: { $in: preferredGenres } },
                { topics: { $in: preferredTopics } }
            ]
        }).sort({ publishDate: -1 }).limit(limit);
        
        return newBooks.map(book => ({
            ...book.toObject(),
            reason: 'New release matching your interests'
        }));
    } catch (error) {
        console.error('Error in getNewReleasesForUser:', error);
        return [];
    }
};

/**
 * Get fallback book recommendations when AI data is insufficient
 * @param {Number} limit - Maximum number of books to return
 * @returns {Array} Array of popular book recommendations
 */
const getDefaultRecommendations = async (limit = 10) => {
    try {
        // Return the most popular books based on view count and rating
        const popularBooks = await Book.find()
            .sort({ 'stats.rating': -1, 'stats.viewCount': -1 })
            .limit(limit);
            
        return popularBooks.map(book => ({
            ...book.toObject(),
            reason: 'Popular among our readers'
        }));
    } catch (error) {
        console.error('Error in getDefaultRecommendations:', error);
        return [];
    }
};

/**
 * Generate a reason for recommending a specific book
 * @param {Object} book - The book object
 * @param {Number} score - The similarity score
 * @param {Object} profile - The user reading profile
 * @returns {String} A personalized recommendation reason
 */
const generateRecommendationReason = (book, score, profile) => {
    // Get user's preferred genres
    const preferredGenres = profile.preferences.genres || [];
    
    // Check if the book matches any preferred genres
    const matchingGenres = book.genres?.filter(genre => 
        preferredGenres.includes(genre)
    ) || [];
    
    // Generate recommendations based on matching features
    if (matchingGenres.length > 0) {
        return `Matches your interest in ${matchingGenres.join(', ')}`;
    } else if (score > 0.7) {
        return `Strongly aligns with your reading preferences`;
    } else if (score > 0.5) {
        return `Similar to books you've enjoyed`;
    } else {
        return `You might enjoy this based on your reading history`;
    }
};

/**
 * Generate a personalized daily message for book recommendation
 * @param {Object} book - The book object 
 * @returns {String} A personalized daily message
 */
const generateDailyMessage = (book) => {
    const messages = [
        `Today's handpicked recommendation just for you!`,
        `We thought you might enjoy this book today.`,
        `Looking for something new? Try this book today!`,
        `Our AI picked this book especially for your mood today.`,
        `Expand your horizons with today's recommendation.`
    ];
    
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
};

/**
 * Update a user's AI profile based on their reading history and preferences
 * @param {ObjectId} userId - The user ID
 * @returns {Object} The updated reading profile
 */
const updateUserAIProfile = async (userId) => {
    try {
        const profile = await ReadingProfile.findOne({ user: userId });
        if (!profile) {
            return null;
        }
        
        // In a real implementation, this would:
        // 1. Analyze user's reading history
        // 2. Extract preferences and patterns
        // 3. Generate or update an interest vector
        // 4. Update the user's AI profile
        
        // For now, we'll use a placeholder implementation
        profile.aiProfile.interestVector = generateMockInterestVector();
        profile.aiProfile.lastUpdated = new Date();
        
        await profile.save();
        return profile;
    } catch (error) {
        console.error('Error in updateUserAIProfile:', error);
        return null;
    }
};

/**
 * Generate a mock interest vector for demonstration purposes
 * This would be replaced with actual AI models in production
 * @returns {Array} An array representing the user's interest vector
 */
const generateMockInterestVector = () => {
    // Generate a 128-dimensional vector with random values between -1 and 1
    return Array.from({ length: 128 }, () => Math.random() * 2 - 1);
};

/**
 * Get books similar to a specific book
 * @param {String} bookId - The book ID
 * @param {Number} limit - Maximum number of books to return
 * @returns {Array} Array of similar books
 */
const getSimilarBooks = async (bookId, limit = 5) => {
    try {
        const book = await Book.findById(bookId);
        if (!book || !book.embeddings || book.embeddings.length === 0) {
            return [];
        }
        
        // Find books with embeddings
        const books = await Book.find({
            _id: { $ne: bookId }, // Exclude the current book
            embeddings: { $exists: true, $ne: [] }
        });
        
        // Calculate similarity scores
        const similarBooks = books
            .map(similar => {
                const score = calculateCosineSimilarity(
                    book.embeddings,
                    similar.embeddings
                );
                return { book: similar, score };
            })
            .filter(item => item.score > 0.4) // Threshold for similarity
            .sort((a, b) => b.score - a.score) // Sort by highest score
            .slice(0, limit);
            
        return similarBooks.map(item => ({
            ...item.book.toObject(),
            similarityScore: item.score,
            reason: `Similar to ${book.title}`
        }));
    } catch (error) {
        console.error('Error in getSimilarBooks:', error);
        return [];
    }
};

/**
 * Update user's recommendations asynchronously based on their viewing history
 * This method is called when a user views a book, but doesn't block the response
 * @param {ObjectId} userId - The user ID
 */
const updateUserRecommendationsAsync = async (userId) => {
    try {
        // We run this asynchronously, so it doesn't block the API response
        setTimeout(async () => {
            await updateUserAIProfile(userId);
            console.log(`Updated recommendations for user ${userId} based on view tracking`);
        }, 0);
    } catch (error) {
        console.error(`Error in async recommendation update for user ${userId}:`, error);
    }
};

module.exports = {
    getRecommendedBooks,
    getDailyRecommendation,
    getNewReleasesForUser,
    getDefaultRecommendations,
    updateUserAIProfile,
    getSimilarBooks,
    updateUserRecommendationsAsync
};
