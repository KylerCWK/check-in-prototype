// Simple test route file to isolate the issue
const express = require('express');
const router = express.Router();

// Simple test endpoint that doesn't depend on auth or models
router.get('/test', (req, res) => {
  res.json({ message: 'User routes are working!', timestamp: new Date().toISOString() });
});

// The problematic /me endpoint with better error handling
router.get('/me', (req, res) => {
  res.status(401).json({ 
    error: 'Authentication required', 
    message: 'This endpoint requires authentication',
    endpoint: '/api/users/me'
  });
});

module.exports = router;
