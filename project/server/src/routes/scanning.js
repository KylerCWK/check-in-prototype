const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Company = require('../models/Company');
const User = require('../models/User');
const Book = require('../models/Book');
const TrackingEvent = require('../models/TrackingEvent');

/**
 * @route   POST /api/companies/process-scan
 * @desc    Process a QR code scan from the company dashboard
 * @access  Private
 */
router.post('/process-scan', auth, async (req, res) => {
    try {
        const { qrData, timestamp } = req.body;

        // Find user's company
        const user = await User.findById(req.user.id).populate('companyAffiliations.company');
        const activeCompany = user.companyAffiliations.find(ca => ca.status === 'approved' && ca.isDefault);

        if (!activeCompany) {
            return res.status(403).json({
                success: false,
                message: 'No active company affiliation found'
            });
        }

        // Validate QR data format and extract book ID
        let bookId;
        try {
            // Assuming QR format is JSON with at least a bookId field
            const parsed = JSON.parse(qrData);
            bookId = parsed.bookId;
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid QR code format'
            });
        }

        // Find the book
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Create tracking event
        const trackingEvent = new TrackingEvent({
            userId: req.user.id,
            sessionId: req.sessionID || 'company-scan',
            eventType: 'qr_scan',
            entityId: bookId,
            entityType: 'book',
            metadata: {
                companyId: activeCompany.company._id,
                scanLocation: req.body.location, // Optional scan location
                deviceInfo: req.body.deviceInfo // Optional device info
            }
        });

        await trackingEvent.save();

        // Return scan result with book details
        return res.json({
            success: true,
            message: 'Scan processed successfully',
            book: {
                id: book._id,
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl,
                publishDate: book.publishDate
            }
        });
    } catch (error) {
        console.error('Error processing scan:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing scan',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/companies/recent-scans
 * @desc    Get recent QR code scans for the company
 * @access  Private
 */
router.get('/recent-scans', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Find user's company
        const user = await User.findById(req.user.id);
        const activeCompany = user.companyAffiliations.find(ca => ca.status === 'approved' && ca.isDefault);

        if (!activeCompany) {
            return res.status(403).json({
                success: false,
                message: 'No active company affiliation found'
            });
        }

        // Get recent scans for the company
        const recentScans = await TrackingEvent.find({
            'metadata.companyId': activeCompany.company,
            eventType: 'qr_scan'
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate({
            path: 'entityId',
            model: 'Book',
            select: 'title author coverUrl publishDate'
        });

        return res.json({
            success: true,
            scans: recentScans.map(scan => ({
                id: scan._id,
                timestamp: scan.createdAt,
                book: scan.entityId,
                location: scan.metadata.scanLocation,
                deviceInfo: scan.metadata.deviceInfo
            }))
        });
    } catch (error) {
        console.error('Error fetching recent scans:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching recent scans',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/companies/scanning-stats
 * @desc    Get scanning statistics for the company
 * @access  Private
 */
router.get('/scanning-stats', auth, async (req, res) => {
    try {
        // Find user's company
        const user = await User.findById(req.user.id);
        const activeCompany = user.companyAffiliations.find(ca => ca.status === 'approved' && ca.isDefault);

        if (!activeCompany) {
            return res.status(403).json({
                success: false,
                message: 'No active company affiliation found'
            });
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

        // Get scan counts
        const [todayCount, weekCount, totalCount] = await Promise.all([
            // Today's scans
            TrackingEvent.countDocuments({
                'metadata.companyId': activeCompany.company,
                eventType: 'qr_scan',
                createdAt: { $gte: today }
            }),
            
            // This week's scans
            TrackingEvent.countDocuments({
                'metadata.companyId': activeCompany.company,
                eventType: 'qr_scan',
                createdAt: { $gte: weekAgo }
            }),
            
            // Total scans
            TrackingEvent.countDocuments({
                'metadata.companyId': activeCompany.company,
                eventType: 'qr_scan'
            })
        ]);

        return res.json({
            success: true,
            stats: {
                today: todayCount,
                thisWeek: weekCount,
                total: totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching scanning stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching scanning stats',
            error: error.message
        });
    }
});

module.exports = router;
