import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  // Try to load server port from the server-config.json or default to 5000
  let serverPort = 5000;
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Try multiple possible paths for server-config.json
    const possiblePaths = [
      path.resolve('../server/server-config.json'),
      path.resolve(__dirname, '../server/server-config.json'),
      path.resolve(__dirname, '../../server/server-config.json'),
      '/mnt/c/Users/Kyler/Documents/Check-In-Prototype/project/server/server-config.json'
    ];
    
    let foundConfig = false;
    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        try {
          const serverConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          serverPort = parseInt(serverConfig.serverPort) || 5000;
          console.log(`Detected server running on port ${serverPort} from config file: ${configPath}`);
          foundConfig = true;
          break;
        } catch (parseErr) {
          console.warn('Failed to parse server config file:', parseErr);
        }
      }
    }
    
    if (!foundConfig) {
      console.warn('Server config file not found in any location, using default port 5000');
    }
  } catch (err) {
    console.warn('Could not detect server port, using default 5000:', err);
  }

  // Use environment variable if available
  if (process.env.VITE_API_PORT) {
    serverPort = parseInt(process.env.VITE_API_PORT);
  }

  const envDir = process.cwd();
  
  return {
    plugins: [
      vue({
        include: [/\.vue$/],
        exclude: [/node_modules/]
      })
    ],
    base: './',
    server: {
      port: parseInt(process.env.VITE_PORT || 3000),
      strictPort: false, // Allow vite to find next available port if default is taken
      open: true,
      proxy: {
        '/api': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
          secure: false
        }
      },
    },  build: {
    outDir: 'dist'
  }
  };
})