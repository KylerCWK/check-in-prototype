const express = require('express');
const router = express.Router();
const path = require('path');
const QRCode = require('qrcode');
const jimp = require('jimp');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middleware/auth');
const Company = require('../models/Company');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'company-logos');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/company-logos')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// Get company QR code settings
router.get('/qr-settings', auth, async (req, res) => {
    try {
        const company = await Company.findById(req.user.company);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        res.json(company.qrCodeSettings);
    } catch (error) {
        console.error('Error fetching QR settings:', error);
        res.status(500).json({ message: 'Error fetching QR settings' });
    }
});

// Update company QR code settings
router.post('/qr-settings', auth, upload.single('logo'), async (req, res) => {
    try {
        const company = await Company.findById(req.user.company);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const settings = {
            primaryColor: req.body.primaryColor,
            secondaryColor: req.body.secondaryColor,
            template: req.body.template
        };

        if (req.file) {
            settings.logo = `/uploads/company-logos/${req.file.filename}`;
        }

        company.qrCodeSettings = {
            ...company.qrCodeSettings,
            ...settings
        };

        await company.save();
        res.json({ message: 'QR settings updated successfully', settings: company.qrCodeSettings });
    } catch (error) {
        console.error('Error updating QR settings:', error);
        res.status(500).json({ message: 'Error updating QR settings' });
    }
});

// Generate QR code for book
router.post('/qr-code', auth, upload.single('logo'), async (req, res) => {
    try {
        const company = await Company.findById(req.user.company);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const { bookId, template, primaryColor, secondaryColor } = req.body;
        const settings = {
            primaryColor: primaryColor || company.qrCodeSettings.primaryColor,
            secondaryColor: secondaryColor || company.qrCodeSettings.secondaryColor,
            template: template || company.qrCodeSettings.template,
            logo: company.qrCodeSettings.logo
        };

        // Create QR code options based on template
        const qrOptions = {
            errorCorrectionLevel: 'H',
            margin: 2,
            color: {
                dark: settings.primaryColor,
                light: '#ffffff00' // transparent background
            }
        };

        // Generate base QR code
        const qrBuffer = await QRCode.toBuffer(`${process.env.APP_URL}/books/${bookId}`, qrOptions);

        // Load QR code as image
        const qrImage = await jimp.read(qrBuffer);
        
        // If we have a logo, overlay it on the QR code
        if (settings.logo) {
            const logo = await jimp.read(path.join(__dirname, '..', '..', settings.logo));
            const qrSize = qrImage.getWidth();
            const logoSize = qrSize * 0.3; // Logo should be 30% of QR code size
            
            logo.resize(logoSize, logoSize);
            const xPos = (qrSize - logoSize) / 2;
            const yPos = (qrSize - logoSize) / 2;
            
            qrImage.composite(logo, xPos, yPos);
        }

        // Add template effects based on selected template
        switch(settings.template) {
            case 'modern':
                // Add rounded corners and gradient overlay
                qrImage.circle();
                break;
            case 'classic':
                // Add border and shadow
                qrImage.border(10, settings.secondaryColor);
                break;
        }

        // Convert to buffer and send
        const finalBuffer = await qrImage.getBufferAsync(jimp.MIME_PNG);
        res.type('image/png').send(finalBuffer);

    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ message: 'Error generating QR code' });
    }
});

module.exports = router;
