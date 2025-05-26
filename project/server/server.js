const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./src/routes/auth');
const cors = require('cors');

dotenv.config(); // Load environment variables from .env file

const app = express(); // Create Express app
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  next();
});


// Check if required environment variables are set
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not defined in environment variables');
  process.exit(1);
}
if (!process.env.PORT) {
  console.error('PORT is not defined in environment variables');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB on Google Cloud'))
.catch((err) => console.error('MongoDB connection error:', err));

app.use('/', authRoutes); // Register authentication routes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
