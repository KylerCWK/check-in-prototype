/**
 * Restart script for the QR check-in application
 * This script ensures the client and server can communicate correctly
 */
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

// If server-config.json exists, remove it to ensure a clean restart
const configPath = path.join(__dirname, 'server', 'server-config.json');
if (fs.existsSync(configPath)) {
  console.log('Removing existing server-config.json...');
  fs.unlinkSync(configPath);
}

// Kill any running node processes on the expected ports (optional)
const isWindows = process.platform === 'win32';
const killCommand = isWindows ? 
  'taskkill /F /IM node.exe' : 
  "pkill -f 'node.*server\\.js'";

exec(killCommand, (error) => {
  if (error && error.code !== 1) {
    console.error('Error killing existing processes:', error);
  } else {
    console.log('Cleaned up any existing processes.');
  }

  // Start the server first to establish the port
  console.log('Starting server...');
  const serverProcess = spawn('node', ['./server/server.js'], {
    stdio: 'inherit',
    detached: false
  });

  // Wait for the server to start and create the config file
  setTimeout(() => {
    console.log('Starting client...');
    const clientProcess = spawn('npm', ['run', 'client'], {
      stdio: 'inherit',
      detached: false
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Shutting down...');
      serverProcess.kill();
      clientProcess.kill();
      process.exit();
    });
  }, 3000); // Wait 3 seconds for server to start
});
