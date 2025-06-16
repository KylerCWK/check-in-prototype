const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { getConfig } = require('./environment');

const config = getConfig();

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // General API rate limit
  general: createRateLimit(
    config.rateLimiting.general.windowMs,
    config.rateLimiting.general.max,
    'Too many requests from this IP, please try again later'
  ),

  // Auth endpoints (more restrictive)
  auth: createRateLimit(
    config.rateLimiting.auth.windowMs,
    config.rateLimiting.auth.max,
    'Too many authentication attempts, please try again later'
  ),

  // Search endpoints (moderate)
  search: createRateLimit(
    config.rateLimiting.search.windowMs,
    config.rateLimiting.search.max,
    'Too many search requests, please try again later'
  ),

  // Vector search (more expensive operations)
  vectorSearch: createRateLimit(
    config.rateLimiting.vectorSearch.windowMs,
    config.rateLimiting.vectorSearch.max,
    'Too many semantic search requests, please try again later'
  ),

  // Upload endpoints (very restrictive)
  upload: createRateLimit(
    config.rateLimiting.upload.windowMs,
    config.rateLimiting.upload.max,
    'Too many upload attempts, please try again later'
  )
};

// CORS configuration
const corsOptions = {
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

// Helmet configuration for security headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"], // Allow external images (book covers)
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for external images
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

// MongoDB sanitization to prevent NoSQL injection
const mongoSanitizeConfig = {
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key: ${key} in ${req.method} ${req.path}`);
  }
};

// HPP (HTTP Parameter Pollution) protection
const hppConfig = {
  whitelist: ['genre', 'author', 'tag'] // Allow multiple values for these parameters
};

module.exports = {
  rateLimits,
  corsOptions,
  helmetConfig,
  mongoSanitizeConfig,
  hppConfig
};
