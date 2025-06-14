#!/bin/bash

# Simple startup script for development
echo "🚀 Starting Check-In Prototype Server..."

# Set development environment
export NODE_ENV=development

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating minimal development environment..."
    cat > .env << EOF
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/checkin-dev
JWT_SECRET=dev-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
EMBEDDING_PROVIDER=mock
EMBEDDING_DIMENSIONS=384
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
EMAIL_ENABLED=false
LOG_LEVEL=debug
EOF
    echo "✅ Created development .env file"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start MongoDB if not running (optional)
# mongod --dbpath ./data/db &

echo "🔧 Starting development server..."
echo "📍 Server will be available at: http://localhost:3000"
echo "📍 Health check: http://localhost:3000/api/health"
echo ""
echo "🛡️  Security features enabled:"
echo "  - JWT Authentication"
echo "  - Input Validation"
echo "  - Rate Limiting (development mode)"
echo "  - CORS Protection"
echo "  - Security Headers"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
node server.js
