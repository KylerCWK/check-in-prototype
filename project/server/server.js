const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
require('dotenv').config();

// Import security configurations
const { 
  rateLimits, 
  corsOptions, 
  helmetConfig, 
  mongoSanitizeConfig, 
  hppConfig 
} = require('./src/config/security');

const app = express();

// Security middleware (apply early)
app.use(helmet(helmetConfig));
app.use(mongoSanitize(mongoSanitizeConfig));
app.use(hpp(hppConfig));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://localhost:3000', 
    'https://bookly-lime.vercel.app',
    'https://bookly-lime.vercel.app/',
    // Allow all vercel.app subdomains for your deployments
    /^https:\/\/.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Origin', 'Accept'],
  exposedHeaders: ['X-Total-Count']
}));

// Add CORS debugging middleware
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request from:', req.headers.origin);
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting
app.use('/api/', rateLimits.general);

// Serve uploaded files statically with security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Prevent execution of uploaded files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
  }
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, { 
  dbName: 'qrlibrary',
  serverSelectionTimeoutMS: 5000, // 5 second timeout
  maxPoolSize: 10, // Maintain up to 10 socket connections
  socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
})  .then(() => {
    console.log('Connected to MongoDB (qrlibrary)');
    console.log('Database URL:', process.env.MONGO_URI ? 'Environment variable MONGO_URI found' : 
                process.env.MONGODB_URI ? 'Environment variable MONGODB_URI found' : 'No database URL found');
    console.log('Environment:', process.env.NODE_ENV || 'development');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
    console.error('Please check your database connection string and ensure it\'s properly formatted');
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Backend server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    apiVersion: '1.0.0'
  });
});

// Use any available port from a specific range if the default PORT is busy
const fs = require('fs');
const configDir = path.resolve(__dirname);
const configPath = path.join(configDir, 'server-config.json');

const PORT = process.env.PORT || process.env.SERVER_PORT || 5000;

// Try to start the server, and if the port is busy, try the next one
const startServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port)
      .on('listening', () => {
        console.log(`Server running on port ${port}`);

        const configData = JSON.stringify({ 
          serverPort: port.toString(),
          timestamp: new Date().toISOString()
        });
        
        try {
          fs.writeFileSync(configPath, configData);
          console.log(`Server configuration saved to ${configPath}`);
        } catch (err) {
          console.error(`Failed to write server configuration: ${err.message}`);
        }
        resolve(server);
      })      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying port ${parseInt(port) + 1}...`);
          resolve(startServer(parseInt(port) + 1));
        } else {
          reject(err);
        }
      });
  });
};

// Mount auth routes with stricter rate limiting
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', rateLimits.auth, authRoutes);

// Mount user routes
const userRoutes = require('./src/routes/users-simple');
app.use('/api/users', userRoutes);

// Mount catalog routes with search rate limiting
const catalogRoutes = require('./src/routes/catalog');
app.use('/api/catalog', rateLimits.search, catalogRoutes);

// Mount recommendation routes
const recommendationRoutes = require('./src/routes/recommendations');
app.use('/api/recommendations', recommendationRoutes);

// Mount favorites routes
const favoritesRoutes = require('./src/routes/favorites');
app.use('/api/favorites', favoritesRoutes);

// Mount tracking routes
const trackingRoutes = require('./src/routes/tracking');
app.use('/api/tracking', trackingRoutes);

// Mount company routes
const companyRoutes = require('./src/routes/companies');
app.use('/api/companies', companyRoutes);

// Mount company QR code routes with upload rate limiting
const companyQrRoutes = require('./src/routes/companyQr');
app.use('/api/companies/qr', rateLimits.upload, companyQrRoutes);

// Mount scanning routes
const scanningRoutes = require('./src/routes/scanning');
app.use('/api/scanning', scanningRoutes);

// Mount AI summary route
const aiSummaryRoutes = require('./src/routes/aiSummary');
app.use('/api/ai-summary', aiSummaryRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl
  });
});

// Start the server asynchronously and handle any errors
startServer(PORT).catch(err => {
  console.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});