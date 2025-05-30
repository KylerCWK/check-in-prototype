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
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { dbName: 'qrlibrary' })
  .then(() => console.log('Connected to MongoDB (qrlibrary)'))
  .catch((err) => console.error(err));

app.get('/', (req, res) => res.send('Hello from backend!'));

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
const path = require('path');
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
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying port ${port + 1}...`);
          resolve(startServer(port + 1));
        } else {
          reject(err);
        }
      });
  });
};

// Mount auth routes from routes/auth.js for /api/auth endpoints
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

// Mount catalog routes
const catalogRoutes = require('./src/routes/catalog');
app.use('/api/catalog', catalogRoutes);

// Start the server asynchronously and handle any errors
startServer(PORT).catch(err => {
  console.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});