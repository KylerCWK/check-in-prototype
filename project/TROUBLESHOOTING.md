# Login Issue Troubleshooting Guide

You're experiencing login issues when trying to access your application deployed on Vercel. Here's how to diagnose and fix the problem:

## Quick Debug Steps

1. **Test the debug page locally first:**
   - Open http://localhost:3000/debug in your browser
   - Click all three test buttons: "Test Health Endpoint", "Test Login", "Test Catalog"
   - All tests should succeed if your local setup is working

2. **Test the debug page on Vercel:**
   - Go to your Vercel deployment URL + `/debug` (e.g., https://yourapp.vercel.app/debug)
   - Run the same tests
   - Compare the results with your local tests

## Common Issues and Solutions

### Issue 1: CORS (Cross-Origin Resource Sharing) Problems
**Symptoms:** You get network errors or 404s when trying to login from Vercel but it works locally.

**Solution:** The backend server.js already includes Vercel domains in CORS configuration:
```javascript
origin: [
  'http://localhost:5173', 
  'http://127.0.0.1:5173', 
  'http://localhost:3000', 
  'https://bookly-lime.vercel.app',
  'https://bookly-lime.vercel.app/',
  // Allow all vercel.app subdomains for your deployments
  /^https:\/\/.*\.vercel\.app$/
],
```

### Issue 2: Environment Variables Not Set in Vercel
**Symptoms:** API calls go to the wrong URL or fail completely.

**To Fix:**
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables"
4. Add: `VITE_API_BASE_URL` = `https://bookly-6t5b.onrender.com`
5. Redeploy your application

### Issue 3: Backend Server Down
**Symptoms:** All API calls fail with network errors.

**To Check:**
- Visit https://bookly-6t5b.onrender.com/api/health directly in your browser
- Should return: `{"status":"ok","timestamp":"...","environment":"production","apiVersion":"1.0.0"}`

### Issue 4: Invalid Credentials
**Symptoms:** Login fails with "Invalid email or password" message.

**Demo Credentials:**
- Email: `demo@bookworm.ai`
- Password: `demo123456`

## Testing Commands

You can also test the API directly with curl:

```bash
# Test health endpoint
curl https://bookly-6t5b.onrender.com/api/health

# Test login
curl -X POST https://bookly-6t5b.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@bookworm.ai","password":"demo123456"}'

# Test catalog
curl https://bookly-6t5b.onrender.com/api/catalog?limit=3
```

## Next Steps

1. **Use the debug page** to identify which specific part is failing
2. **Check the browser console** for detailed error messages
3. **Verify environment variables** are set correctly in Vercel
4. **Check CORS headers** in browser network tab
5. **Test the backend directly** to ensure it's running

If you're still having issues after checking these, the debug page will provide detailed error information that can help identify the exact problem.
