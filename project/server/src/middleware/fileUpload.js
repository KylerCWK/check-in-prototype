const multer = require('multer');
const path = require('path');

// File size limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed file types
const MIME_TYPES = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/svg+xml': 'svg'
};

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', '..', 'uploads', 'company-logos'));
    },
    filename: function (req, file, cb) {
        const name = file.originalname
            .toLowerCase()
            .split(' ')
            .join('-')
            .split('.')
            .slice(0, -1)
            .join('.');
        const extension = MIME_TYPES[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + extension);
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    const isValid = !!MIME_TYPES[file.mimetype];
    if (!isValid) {
        cb(new Error('Invalid file type'), false);
    }
    cb(null, isValid);
};

// Create multer upload object
const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: fileFilter
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
            });
        }
    }
    if (err.message === 'Invalid file type') {
        return res.status(400).json({
            message: 'Invalid file type. Allowed types are: ' + Object.keys(MIME_TYPES).join(', ')
        });
    }
    next(err);
};

module.exports = {
    upload,
    handleUploadError
};
