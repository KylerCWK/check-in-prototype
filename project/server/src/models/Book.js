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
    embeddings: [Number], // For AI similarity matching
    metadata: {
        pageCount: Number,
        language: String,
        readingLevel: String,
        isbn: String,
        publisher: String
    },
    aiAnalysis: {
        themes: [String],
        moodTags: [String],
        complexityScore: Number,
        recommendationScore: {
            type: Number,
            default: 0
        }
    },
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
        }
    }
}, {
    timestamps: true
});

// Add text index for search functionality
BookSchema.index({ 
    title: 'text', 
    author: 'text', 
    'genres': 'text',
    'topics': 'text',
    description: 'text'
});

module.exports = mongoose.model('Book', BookSchema);
