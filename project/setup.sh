#!/bin/bash

# Setup script for application
echo "Setting up Check-In-Prototype application..."

# Determine available ports
find_available_port() {
    local port=$1
    while true; do
        (echo >/dev/tcp/localhost/$port) >/dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo $port
            return
        fi
        ((port++))
    done
}

SERVER_PORT=$(find_available_port 5000)
CLIENT_PORT=$(find_available_port 3000)

echo "Found available ports - Server: $SERVER_PORT, Client: $CLIENT_PORT"

# Create client .env file
echo "Creating client .env file..."
mkdir -p ./client
cat > ./client/.env << EOL
VITE_PORT=$CLIENT_PORT
VITE_API_BASE_URL=http://localhost:$SERVER_PORT
EOL
echo "Client .env file created."

# Create server .env file
echo "Creating server .env file..."
mkdir -p ./server

# Check for required environment variables
if [ -z "$MONGODB_URI" ]; then
    echo "❌ ERROR: MONGODB_URI environment variable is required"
    echo "Please set it with: export MONGODB_URI='your_mongodb_connection_string'"
    exit 1
fi

if [ -z "$HUGGINGFACE_API_KEY" ]; then
    echo "❌ ERROR: HUGGINGFACE_API_KEY environment variable is required"
    echo "Please set it with: export HUGGINGFACE_API_KEY='your_huggingface_api_key'"
    exit 1
fi

# Generate JWT secret if not provided
JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}

cat > ./server/.env << EOL
PORT=$SERVER_PORT
MONGODB_URI=$MONGODB_URI
MONGO_URI=$MONGODB_URI
JWT_SECRET=$JWT_SECRET

# Embedding Service Configuration
EMBEDDING_PROVIDER=${EMBEDDING_PROVIDER:-huggingface}
EMBEDDING_MODEL=${EMBEDDING_MODEL:-sentence-transformers/all-MiniLM-L6-v2}
EMBEDDING_DIMENSIONS=${EMBEDDING_DIMENSIONS:-384}
HUGGINGFACE_API_KEY=$HUGGINGFACE_API_KEY
EOL
echo "✅ Server .env file created from environment variables."

# Install dependencies
echo "Installing dependencies..."
npm install
cd ./client && npm install
cd ../server && npm install
cd ..

echo "Setup complete! Run 'npm run dev' to start the application."
echo "Server will run on port $SERVER_PORT, client will run on port $CLIENT_PORT"
