const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'https://bookly-6t5b.onrender.com';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n🔍 Testing ${description}...`);
    console.log(`URL: ${BACKEND_URL}${endpoint}`);
    
    const startTime = Date.now();
    const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Deployment-Test/1.0.0'
      }
    });
    const endTime = Date.now();
    
    console.log(`✅ ${description} - Status: ${response.status} (${endTime - startTime}ms)`);
    if (response.data) {
      console.log(`   Response preview:`, JSON.stringify(response.data).substring(0, 100) + '...');
    }
    return true;
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Starting deployment verification...');
  console.log(`Backend URL: ${BACKEND_URL}`);
    const tests = [
    ['/', 'Root endpoint'],
    ['/api/health', 'Health check'],
    ['/api/catalog', 'Catalog endpoint'],
    ['/api/catalog/genres', 'Genres endpoint'],
    ['/api/users/me', 'User profile endpoint (should 401 without auth)'],
    ['/api/recommendations', 'Recommendations endpoint'],
    ['/api/auth/health', 'Auth health check (may 404)']
  ];
  
  const results = [];
  
  for (const [endpoint, description] of tests) {
    const success = await testEndpoint(endpoint, description);
    results.push({ endpoint, description, success });
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Summary:');
  results.forEach(({ endpoint, description, success }) => {
    console.log(`${success ? '✅' : '❌'} ${description}: ${endpoint}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Results: ${successCount}/${results.length} endpoints working`);
  
  if (successCount === 0) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check if the server is running on Render');
    console.log('2. Verify environment variables are set');
    console.log('3. Check MongoDB connection');
    console.log('4. Review server logs for errors');
    console.log('5. Ensure all dependencies are installed');
  }
}

main().catch(console.error);
