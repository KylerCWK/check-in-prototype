const express = require('express');
const router = express.Router();

// Simple test route to verify router works
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

module.exports = router;
