/**
 * Development Authentication Bypass Middleware
 * Only active in development mode for testing purposes
 */

const { authMiddleware } = require('./auth');

// Development test user - only for development environment
const DEV_TEST_USER = {
  id: '60d5ecb74b24a000154f1234',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  companyCode: 'TEST001'
};

/**
 * Development middleware that bypasses auth for test routes
 * NEVER use this in production
 */
function devAuthBypass(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      error: 'Test endpoints not available in production',
      code: 'ENDPOINT_NOT_FOUND'
    });
  }

  // In development, simulate authenticated user
  req.user = DEV_TEST_USER;
  next();
}

/**
 * Conditional auth middleware - enforces auth in production, allows bypass in dev
 */
function conditionalAuth(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return authMiddleware(req, res, next);
  } else {
    // In development, allow both authenticated and test requests
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authMiddleware(req, res, next);
    } else {
      // No auth header, use test user in development
      req.user = DEV_TEST_USER;
      next();
    }
  }
}

/**
 * Middleware to validate development environment for test routes
 */
function requireDevelopment(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      error: 'Test endpoints not available in production',
      code: 'ENDPOINT_NOT_FOUND'
    });
  }
  next();
}

module.exports = {
  devAuthBypass,
  conditionalAuth,
  requireDevelopment,
  DEV_TEST_USER
};
