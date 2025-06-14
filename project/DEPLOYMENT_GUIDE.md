# Deployment Guide

## Overview
This guide covers deploying the Check-In Prototype with full security measures to production.

## Security Features Implemented

### ✅ Authentication & Authorization
- JWT-based authentication with token blacklisting
- Role-based access control (user, admin)
- Optional authentication for public endpoints
- 2FA support ready for implementation
- Email verification system

### ✅ Input Validation & Sanitization
- Express-validator for all endpoints
- MongoDB injection protection
- HTTP Parameter Pollution (HPP) protection
- XSS protection via Helmet

### ✅ Rate Limiting
- Environment-specific rate limits
- Different limits for auth, search, and upload endpoints
- IP-based throttling

### ✅ Security Headers
- Helmet.js security headers
- CORS configuration
- Content Security Policy (CSP)
- HSTS headers for production

### ✅ Development vs Production
- Test routes disabled in production
- Environment-specific configurations
- Development authentication bypass for testing

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the server directory:

```env
# Environment
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum

# Vector Search & AI
OPENAI_API_KEY=your-openai-api-key
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# Alternative embedding providers (optional)
HUGGINGFACE_API_KEY=your-huggingface-key
COHERE_API_KEY=your-cohere-key
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=your-azure-endpoint

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (for verification)
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Redis (for token blacklisting in production)
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379

# File uploads
MAX_FILE_SIZE=5mb
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
```

### Development Environment Variables

For development, create a `.env.development` file:

```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/checkin-dev
JWT_SECRET=dev-secret-key
OPENAI_API_KEY=your-dev-openai-key
EMAIL_ENABLED=false
REDIS_ENABLED=false
LOG_LEVEL=debug
```

## Deployment Steps

### 1. Server Preparation

```bash
# Install dependencies
cd project/server
npm install --production

# Build client assets
cd ../client
npm install
npm run build

# Copy built assets to server public directory
cp -r dist/* ../server/public/
```

### 2. Database Setup

```bash
# Set up MongoDB Atlas vector search indexes
cd project/server
node src/scripts/setupVectorSearch.js

# Generate embeddings for existing books
node src/scripts/generateEmbeddings.js --all

# Validate the setup
node src/scripts/testVectorSearch.js
```

### 3. Security Configuration

1. **SSL/TLS Certificate**: Obtain and configure SSL certificates
2. **Firewall**: Configure firewall to allow only necessary ports
3. **Database Security**: Enable MongoDB authentication and encryption
4. **Environment Variables**: Secure all environment variables

### 4. Production Server Configuration

#### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'checkin-app',
    script: 'server.js',
    cwd: './project/server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
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
    restart_delay: 4000
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

#### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY project/server/package*.json ./
RUN npm ci --only=production

# Copy application code
COPY project/server/ ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership and switch to user
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

### 5. Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
        limit_req zone=api burst=20 nodelay;
    }
}
```

## Testing the Deployment

### 1. Health Checks

```bash
# Test server health
curl https://yourdomain.com/api/health

# Test authentication
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test rate limiting
for i in {1..20}; do curl https://yourdomain.com/api/catalog; done
```

### 2. Security Testing

```bash
# Test CORS
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://yourdomain.com/api/auth/login

# Test input validation
curl -X POST https://yourdomain.com/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"bookId":"invalid-id"}'

# Test authentication
curl https://yourdomain.com/api/favorites
```

## Monitoring & Maintenance

### 1. Log Monitoring

Set up log aggregation and monitoring:

```bash
# View PM2 logs
pm2 logs checkin-app

# Monitor system resources
pm2 monit

# Set up log rotation
pm2 install pm2-logrotate
```

### 2. Performance Monitoring

- Set up APM tools (New Relic, DataDog, etc.)
- Monitor MongoDB performance
- Track API response times
- Monitor rate limit effectiveness

### 3. Security Monitoring

- Set up security alerts for failed login attempts
- Monitor for suspicious traffic patterns
- Regular security audits
- Keep dependencies updated

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check ALLOWED_ORIGINS environment variable
2. **Token Expiration**: Verify JWT_SECRET and token expiration settings
3. **Rate Limiting**: Adjust rate limits based on usage patterns
4. **Vector Search Issues**: Verify MongoDB Atlas search indexes
5. **Authentication Issues**: Check JWT secret and token blacklisting

### Debug Commands

```bash
# Check environment variables
node -e "console.log(process.env)"

# Test database connection
node src/scripts/healthCheck.js

# Validate vector search
node src/scripts/testVectorSearch.js

# Check security configuration
node -e "console.log(require('./src/config/environment').getConfig())"
```

## Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Environment variables secured
- [ ] Database authentication enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Security headers enabled
- [ ] Test routes disabled in production
- [ ] Monitoring and logging set up
- [ ] Regular security updates scheduled

## Backup and Recovery

1. **Database Backups**: Set up automated MongoDB backups
2. **Code Backups**: Use Git for version control
3. **Environment Backups**: Securely store environment configurations
4. **Recovery Testing**: Regularly test backup restoration

---

For additional support or questions about deployment, refer to the main README.md or create an issue in the project repository.
