// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Security settings based on environment
const securityConfig = {
  // CORS settings
  cors: {
    development: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      credentials: true
    },
    production: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
      credentials: true
    }
  },

  // Rate limiting
  rateLimiting: {
    development: {
      auth: { windowMs: 15 * 60 * 1000, max: 20 }, // More lenient for dev
      general: { windowMs: 60 * 1000, max: 100 },
      search: { windowMs: 60 * 1000, max: 60 },
      vectorSearch: { windowMs: 60 * 1000, max: 20 },
      upload: { windowMs: 60 * 60 * 1000, max: 10 }
    },
    production: {
      auth: { windowMs: 15 * 60 * 1000, max: 10 }, // Stricter for production
      general: { windowMs: 60 * 1000, max: 30 },
      search: { windowMs: 60 * 1000, max: 30 },
      vectorSearch: { windowMs: 60 * 1000, max: 10 },
      upload: { windowMs: 60 * 60 * 1000, max: 5 }
    }
  },

  // Features enabled/disabled
  features: {
    development: {
      testRoutes: true,
      devAuth: true,
      detailedErrors: true,
      swagger: true
    },
    production: {
      testRoutes: false,
      devAuth: false,
      detailedErrors: false,
      swagger: false
    }
  },

  // Database settings
  database: {
    development: {
      maxPoolSize: 10,
      retryWrites: true
    },
    production: {
      maxPoolSize: 50,
      retryWrites: true,
      ssl: true
    }
  },

  // JWT settings
  jwt: {
    development: {
      expiresIn: '7d', // Longer for development convenience
      algorithm: 'HS256'
    },
    production: {
      expiresIn: '1d', // Shorter for security
      algorithm: 'HS256'
    }
  }
};

// Get configuration for current environment
function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  return {
    environment: env,
    isDevelopment,
    isProduction,
    isTest,
    cors: securityConfig.cors[env] || securityConfig.cors.development,
    rateLimiting: securityConfig.rateLimiting[env] || securityConfig.rateLimiting.development,
    features: securityConfig.features[env] || securityConfig.features.development,
    database: securityConfig.database[env] || securityConfig.database.development,
    jwt: securityConfig.jwt[env] || securityConfig.jwt.development,
    
    // Additional environment-specific settings
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/checkin',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    
    // API keys and external services
    openaiApiKey: process.env.OPENAI_API_KEY,
    huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
    cohereApiKey: process.env.COHERE_API_KEY,
    azureApiKey: process.env.AZURE_OPENAI_API_KEY,
    
    // File upload settings
    maxFileSize: process.env.MAX_FILE_SIZE || '5mb',
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    
    // Logging
    logLevel: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    
    // Email settings (for production)
    emailEnabled: process.env.EMAIL_ENABLED === 'true',
    emailProvider: process.env.EMAIL_PROVIDER || 'smtp',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT || 587,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    
    // Redis settings (for production token blacklisting)
    redisEnabled: process.env.REDIS_ENABLED === 'true',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
  };
}

module.exports = {
  getConfig,
  isDevelopment,
  isProduction,
  isTest
};
