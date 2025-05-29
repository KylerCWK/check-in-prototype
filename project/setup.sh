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
cat > ./server/.env << EOL
PORT=$SERVER_PORT
MONGO_URI=mongodb+srv://isaiahbyrd:MWKSNYxsjFkwOyoi@qrlibrarycluster.broyvae.mongodb.net/qrlibrary?retryWrites=true&w=majority
JWT_SECRET=my_secure_jwt_secret_key_$(openssl rand -hex 32)
EOL
echo "Server .env file created."

# Install dependencies
echo "Installing dependencies..."
npm install
cd ./client && npm install

# Mobile setup
echo "Setting up mobile development environment..."
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "QR Check-In" "com.example.qrbookapp" --web-dir "dist"
npx cap add android
npx cap add ios

# Install mobile plugins
npm install @capacitor/camera @capacitor/status-bar @capacitor/splash-screen @capacitor/app @capacitor/device

# Build the web app and sync with mobile projects
npm run build
npx cap sync

cd ../server && npm install
cd ..

echo "Setup complete!"
echo "For web development: 'npm run dev'"
echo "For Android development: 'cd client && npm run cap:android'"
echo "For iOS development: 'cd client && npm run cap:ios'"
echo "Server will run on port $SERVER_PORT, client will run on port $CLIENT_PORT"
