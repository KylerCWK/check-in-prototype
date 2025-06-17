#!/bin/bash

# Render build script
echo "Starting server build process..."

# Navigate to server directory
cd server

# Install dependencies
echo "Installing server dependencies..."
npm install

# Check if all required environment variables are set
echo "Checking environment variables..."
if [ -z "$MONGO_URI" ] && [ -z "$MONGODB_URI" ]; then
    echo "❌ ERROR: MONGO_URI or MONGODB_URI environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET environment variable is required"
    exit 1
fi

echo "✓ Environment variables verified"

# Set NODE_ENV to production if not set
export NODE_ENV=${NODE_ENV:-production}

echo "Environment: $NODE_ENV"
echo "Starting server..."

# Start the server
node server.js
