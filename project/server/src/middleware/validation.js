const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Common validation rules
const commonValidations = {
  // MongoDB ObjectId validation
  mongoId: param('id').isMongoId().withMessage('Invalid ID format'),
  
  // Pagination validation
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],

  // Search validation
  search: [
    query('search').optional().isLength({ min: 1, max: 100 }).trim().escape()
      .withMessage('Search query must be between 1 and 100 characters'),
    query('searchBy').optional().isIn(['all', 'title', 'author', 'genre'])
      .withMessage('Invalid searchBy parameter'),
    query('sortBy').optional().isIn(['popular', 'newest', 'rating', 'title', 'relevance', 'trending'])
      .withMessage('Invalid sortBy parameter')
  ],

  // Genre validation
  genre: query('genre').optional().isLength({ min: 1, max: 50 }).trim().escape()
    .withMessage('Genre must be between 1 and 50 characters'),

  // Email validation
  email: body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),

  // Password validation (strong password requirements)
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  // Name validation
  name: body('name').isLength({ min: 1, max: 100 }).trim().escape()
    .withMessage('Name must be between 1 and 100 characters'),

  // Company code validation
  companyCode: body('companyCode').optional().isLength({ min: 4, max: 20 }).trim()
    .withMessage('Company code must be between 4 and 20 characters')
};

// Specific validation chains for different endpoints
const validationChains = {
  // Auth validations
  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.name,
    commonValidations.companyCode,
    handleValidationErrors
  ],

  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],

  // Catalog validations
  catalogList: [
    ...commonValidations.pagination,
    ...commonValidations.search,
    commonValidations.genre,
    handleValidationErrors
  ],

  catalogById: [
    commonValidations.mongoId,
    handleValidationErrors
  ],

  // Semantic search validation
  semanticSearch: [
    body('query').isLength({ min: 1, max: 200 }).trim().escape()
      .withMessage('Search query must be between 1 and 200 characters'),
    body('limit').optional().isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    body('page').optional().isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    handleValidationErrors
  ],

  // Recommendations validation
  recommendations: [
    query('limit').optional().isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    handleValidationErrors
  ],
  // Favorites validation
  addFavorite: [
    body('bookId').isMongoId().withMessage('Valid book ID is required'),
    handleValidationErrors
  ],

  removeFavorite: [
    param('bookId').isMongoId().withMessage('Valid book ID is required'),
    handleValidationErrors
  ],

  // User ID validation for test routes
  userId: [
    param('userId').isMongoId().withMessage('Valid user ID is required'),
    handleValidationErrors
  ],

  bookId: [
    param('bookId').isMongoId().withMessage('Valid book ID is required'),
    handleValidationErrors
  ],

  // Test favorites validation
  testAddFavorite: [
    param('userId').isMongoId().withMessage('Valid user ID is required'),
    body('bookId').isMongoId().withMessage('Valid book ID is required'),
    handleValidationErrors
  ],

  testRemoveFavorite: [
    param('userId').isMongoId().withMessage('Valid user ID is required'),
    param('bookId').isMongoId().withMessage('Valid book ID is required'),
    handleValidationErrors
  ],

  // Auth validation
  verifyEmail: [
    body('token').isLength({ min: 20, max: 100 }).withMessage('Valid verification token is required'),
    handleValidationErrors
  ],

  verify2FA: [
    body('token').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Valid 6-digit token is required'),
    handleValidationErrors
  ],

  validate2FA: [
    body('userId').isMongoId().withMessage('Valid user ID is required'),
    body('token').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Valid 6-digit token is required'),
    handleValidationErrors
  ],

  // Tracking validation
  trackReadingSession: [
    body('bookId').isMongoId().withMessage('Valid book ID is required'),
    body('sessionData').isObject().withMessage('Session data must be an object'),
    handleValidationErrors
  ],

  trackSearch: [
    body('query').optional().isLength({ min: 1, max: 200 }).withMessage('Query must be between 1 and 200 characters'),
    body('filters').optional().isObject().withMessage('Filters must be an object'),
    body('results').optional().isArray().withMessage('Results must be an array'),
    handleValidationErrors
  ],

  trackEvent: [
    body('eventType').isLength({ min: 1, max: 50 }).withMessage('Event type is required'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object'),
    handleValidationErrors
  ],

  processBatch: [
    body('batchId').isMongoId().withMessage('Valid batch ID is required'),
    handleValidationErrors
  ],

  // Company validation
  createCompany: [
    body('name').isLength({ min: 1, max: 100 }).trim().withMessage('Company name is required'),
    body('contactEmail').isEmail().normalizeEmail().withMessage('Valid contact email is required'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('website').optional().isURL().withMessage('Website must be a valid URL'),
    body('domains').optional().isArray().withMessage('Domains must be an array'),
    handleValidationErrors
  ],
  // Similar books validation
  similarBooks: [
    param('bookId').isMongoId().withMessage('Valid book ID is required'),
    query('limit').optional().isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1 and 20'),
    handleValidationErrors
  ],

  // Book view tracking validation
  trackBookView: [
    body('bookId').isMongoId().withMessage('Valid book ID is required'),
    body('viewDuration').optional().isInt({ min: 0, max: 3600000 })
      .withMessage('View duration must be between 0 and 3600000 milliseconds'),
    handleValidationErrors
  ],

  // Company QR validation
  generateQR: [
    body('companyCode').isLength({ min: 4, max: 20 }).trim()
      .withMessage('Company code must be between 4 and 20 characters'),
    body('logo').optional().isBase64().withMessage('Logo must be a valid base64 string'),
    handleValidationErrors
  ]
};

module.exports = {
  validationChains,
  handleValidationErrors,
  commonValidations
};
