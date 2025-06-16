module.exports = {
  apps: [{
    name: 'checkin-app',
    script: 'server.js',
    cwd: './server',
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    watch: process.env.NODE_ENV === 'development',
    ignore_watch: ['node_modules', 'uploads', 'logs'],
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    
    // Health check
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true,
    
    // Advanced PM2 features
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Environment-specific settings
    node_args: process.env.NODE_ENV === 'development' ? '--inspect' : '',
    
    // Graceful shutdown
    listen_timeout: 3000,
    kill_timeout: 5000
  }]
};
