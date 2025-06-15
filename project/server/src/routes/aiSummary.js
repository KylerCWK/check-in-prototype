console.log('✅ aiSummary.js loaded');

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Check for Hugging Face API key when route is called, not at module load time
const getHuggingFaceApiKey = () => {
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
    if (!HF_API_KEY) {
        console.error('Hugging Face API key is not set in environment variables');
        throw new Error('Hugging Face API key is required');
    }
    return HF_API_KEY;
};

router.get('/test', (req, res) => {
    res.json({ message: 'AI summary test endpoint is working!' });
});

router.post('/summary', async (req, res) => {
const { title } = req.body;

if (!title || typeof title !== 'string') {
  return res.status(400).json({ error: 'Invalid or missing "title" in request body' });
}

try {
  // Get the API key when the route is called
  const HF_API_KEY = getHuggingFaceApiKey();

  const plainPrompt = `The book is titled "${title}". Based on the title alone, generate a short and imaginative summary (2–3 sentences). Assume it is a fictional novel.`;

  const response = await axios.post(
    'https://api-inference.huggingface.co/models/google/pegasus-xsum',
    { inputs: plainPrompt },
    {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    }
  );

  const summary = response.data?.[0]?.summary_text || 'Summary not available.';
  res.json({ summary });
} catch (err) {
  console.error('Hugging Face summary error:', err.response?.data || err.message);
  
  // If it's an API key error, return a more specific message
  if (err.message === 'Hugging Face API key is required') {
    return res.status(500).json({ error: 'AI service configuration error: API key not configured' });
  }
  
  res.status(500).json({ error: 'Failed to generate summary from Hugging Face API' });
}
});


module.exports = router;
