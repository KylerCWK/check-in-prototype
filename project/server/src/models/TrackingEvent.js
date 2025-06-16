const mongoose = require('mongoose');

const TrackingEventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Can track anonymous users
    },
    sessionId: {
        type: String,
        required: true // For anonymous tracking
    },    eventType: {
        type: String,
        enum: [
            'book_view', 'book_click', 'search', 'filter_apply', 'recommendation_view',
            'recommendation_click', 'recommendation_refresh', 'page_visit', 'session_start', 'session_end',
            'book_add_to_list', 'book_remove_from_list', 'book_rate', 'book_review',
            'reading_progress_update', 'qr_scan', 'goal_set', 'goal_achieved'
        ],
        required: true
    },
    entityId: {
        type: String, // Book ID, page name, etc.
        required: false
    },
    entityType: {
        type: String,
        enum: ['book', 'page', 'recommendation', 'search_query', 'filter', 'goal'],
        required: false
    },
    metadata: {
        // Flexible metadata for different event types
        viewDuration: Number, // in seconds
        searchQuery: String,
        filterCriteria: mongoose.Schema.Types.Mixed,
        pageUrl: String,
        userAgent: String,
        ipAddress: String,
        deviceType: String, // mobile, tablet, desktop
        referrer: String,
        coordinates: {
            x: Number,
            y: Number
        },
        scrollDepth: Number, // percentage
        timeSpent: Number, // in seconds
        clickPosition: {
            x: Number,
            y: Number
        },
        recommendationScore: Number,
        rating: Number,
        progress: {
            pagesRead: Number,
            timeSpent: Number,
            percentage: Number
        }
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    // For analytics and ML model training
    processed: {
        type: Boolean,
        default: false
    },
    // Batch processing identifier
    batchId: String
}, {
    timestamps: true
});

// Indexes for performance
TrackingEventSchema.index({ userId: 1, timestamp: -1 });
TrackingEventSchema.index({ sessionId: 1, timestamp: -1 });
TrackingEventSchema.index({ eventType: 1, timestamp: -1 });
TrackingEventSchema.index({ entityId: 1, entityType: 1 });
TrackingEventSchema.index({ processed: 1, timestamp: -1 });

// TTL index for data retention (keep for 2 years)
TrackingEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('TrackingEvent', TrackingEventSchema);
