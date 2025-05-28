#!/usr/bin/env node
/**
 * Cross-platform setup script for Check-In-Prototype application
 * This script will:
 * 1. Determine available ports for server and client
 * 2. Create environment files for both server and client
 * 3. Set up necessary configuration files
 */
const fs = require('fs');
const path = require('path');
const net = require('net');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');

// Set up console output
console.log('\n======================================');
console.log('   CHECK-IN PROTOTYPE SETUP SCRIPT');
console.log('======================================\n');

const ROOT_DIR = path.resolve(__dirname);
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const SERVER_DIR = path.join(ROOT_DIR, 'server');

console.log('Setting up Check-In-Prototype application...');
console.log('Root directory:', ROOT_DIR);
console.log('Client directory:', CLIENT_DIR);
console.log('Server directory:', SERVER_DIR);

// Function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

// Function to find an available port starting from a given port
async function findAvailablePort(startPort) {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
}

// Function to create a directory if it doesn't exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Create a random JWT secret
function generateJwtSecret() {
  return crypto.randomBytes(64).toString('hex');
}

async function setup() {
  try {
    // Find available ports
    const serverPort = await findAvailablePort(5000);
    const clientPort = await findAvailablePort(3000);
    
    console.log(`Found available ports - Server: ${serverPort}, Client: ${clientPort}`);
    
    // Ensure directories exist
    ensureDirectoryExists(CLIENT_DIR);
    ensureDirectoryExists(SERVER_DIR);
    
    // Create client .env file
    const clientEnvPath = path.join(CLIENT_DIR, '.env');
    const clientEnvContent = `VITE_PORT=${clientPort}
VITE_API_BASE_URL=http://localhost:${serverPort}
`;

    fs.writeFileSync(clientEnvPath, clientEnvContent);
    console.log(`Created client .env file at ${clientEnvPath}`);
    
    // Create server .env file
    const serverEnvPath = path.join(SERVER_DIR, '.env');
    const jwtSecret = generateJwtSecret();
    const serverEnvContent = `PORT=${serverPort}
MONGO_URI=mongodb+srv://isaiahbyrd:MWKSNYxsjFkwOyoi@qrlibrarycluster.broyvae.mongodb.net/qrlibrary?retryWrites=true&w=majority
JWT_SECRET=${jwtSecret}
`;

    fs.writeFileSync(serverEnvPath, serverEnvContent);
    console.log(`Created server .env file at ${serverEnvPath}`);
    
    // Create server config file
    const serverConfigPath = path.join(SERVER_DIR, 'server-config.json');
    const serverConfigContent = JSON.stringify({ 
      serverPort: serverPort,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    fs.writeFileSync(serverConfigPath, serverConfigContent);
    console.log(`Created server config file at ${serverConfigPath}`);
    
    // Install dependencies
    console.log('Installing dependencies...');
    try {
      console.log('Installing root dependencies...');
      execSync('npm install', { stdio: 'inherit', cwd: ROOT_DIR });
      
      console.log('Installing client dependencies...');
      execSync('npm install', { stdio: 'inherit', cwd: CLIENT_DIR });
      
      console.log('Installing server dependencies...');
      execSync('npm install', { stdio: 'inherit', cwd: SERVER_DIR });
      
      console.log('Dependencies installed successfully!');
    } catch (error) {
      console.error('Error installing dependencies:', error.message);
    }
    
    console.log(`\nSetup complete!`);
    console.log(`Server will run on port ${serverPort}, client will run on port ${clientPort}`);
    console.log(`Run 'npm run dev' to start the application.`);
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setup();
