const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();


const app = express();
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json()); // Parse JSON bodies

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { dbName: 'qrlibrary' })
  .then(() => console.log('Connected to MongoDB (qrlibrary)'))
  .catch((err) => console.error(err));

app.get('/', (req, res) => res.send('Hello from backend!'));
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Mount auth routes from routes/auth.js for /api/auth endpoints
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);