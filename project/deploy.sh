#!/bin/bash

# Production deployment script for Check-In Prototype
set -e

echo "🚀 Starting production deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    print_warning ".env file not found in server directory."
    print_warning "Please create a .env file with required environment variables."
    print_warning "See DEPLOYMENT_GUIDE.md for details."
fi

# Set production environment
export NODE_ENV=production

print_status "Setting up production environment..."

# Create logs directory
mkdir -p logs
print_success "Created logs directory"

# Install server dependencies
print_status "Installing server dependencies..."
cd server
npm ci --only=production
cd ..
print_success "Server dependencies installed"

# Build client
print_status "Building client application..."
cd client
npm ci
npm run build
cd ..
print_success "Client application built"

# Copy client build to server public directory
print_status "Copying client assets to server..."
mkdir -p server/public
cp -r client/dist/* server/public/
print_success "Client assets copied"

# Set up MongoDB vector search (if not already done)
print_status "Setting up vector search indexes..."
cd server
if node src/scripts/setupVectorSearch.js; then
    print_success "Vector search indexes set up"
else
    print_warning "Vector search setup failed or already exists"
fi
cd ..

# Generate embeddings if needed
print_status "Checking embeddings..."
cd server
if node src/scripts/testVectorSearch.js > /dev/null 2>&1; then
    print_success "Embeddings are ready"
else
    print_warning "Generating embeddings (this may take a while)..."
    if node src/scripts/generateEmbeddings.js --all; then
        print_success "Embeddings generated successfully"
    else
        print_error "Failed to generate embeddings"
        exit 1
    fi
fi
cd ..

# Check PM2 installation
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 globally..."
    npm install -g pm2
    print_success "PM2 installed"
fi

# Stop existing PM2 processes
print_status "Stopping existing processes..."
pm2 delete checkin-app 2>/dev/null || true
print_success "Existing processes stopped"

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Display status
print_status "Application status:"
pm2 list

# Setup PM2 startup (optional)
if [ "$1" = "--setup-startup" ]; then
    print_status "Setting up PM2 startup..."
    pm2 startup
    print_warning "Please run the command shown above to enable PM2 startup"
fi

print_success "🎉 Production deployment completed!"
print_status "Application is running on port 3000"
print_status "View logs with: pm2 logs checkin-app"
print_status "Monitor with: pm2 monit"

# Health check
print_status "Performing health check..."
sleep 5
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "✅ Health check passed - Application is responding"
else
    print_error "❌ Health check failed - Application may not be responding"
    print_status "Check logs with: pm2 logs checkin-app"
    exit 1
fi

echo ""
print_success "🚀 Deployment successful! Your application is ready for production."
echo ""
print_status "Next steps:"
echo "  1. Configure your reverse proxy (Nginx/Apache)"
echo "  2. Set up SSL certificates"
echo "  3. Configure your domain DNS"
echo "  4. Set up monitoring and alerts"
echo ""
print_status "For detailed instructions, see DEPLOYMENT_GUIDE.md"
