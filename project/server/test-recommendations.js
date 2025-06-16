const axios = require('axios');

async function testRecommendations() {
    const baseUrl = 'http://localhost:5000';
    const testUserId = '60d5ecb74b24a000154f1234';
    
    console.log('=== TESTING RECOMMENDATIONS API ===');
    
    try {
        // Test 1: Normal recommendations
        console.log('\n1. Testing normal recommendations...');
        const response1 = await axios.get(`${baseUrl}/api/recommendations/test/${testUserId}?limit=3`);
        console.log('Status:', response1.status);
        console.log('Count:', response1.data.count);
        console.log('First book:', response1.data.data[0]?.title);
        
        // Test 2: Refresh recommendations
        console.log('\n2. Testing refresh recommendations...');
        const response2 = await axios.get(`${baseUrl}/api/recommendations/test/${testUserId}?limit=3&refresh=true`);
        console.log('Status:', response2.status);
        console.log('Count:', response2.data.count);
        console.log('First book:', response2.data.data[0]?.title);
        
        // Test 3: Another refresh
        console.log('\n3. Testing another refresh...');
        const response3 = await axios.get(`${baseUrl}/api/recommendations/test/${testUserId}?limit=3&refresh=true`);
        console.log('Status:', response3.status);
        console.log('Count:', response3.data.count);
        console.log('First book:', response3.data.data[0]?.title);
        
        // Compare results
        console.log('\n=== COMPARISON ===');
        console.log('Normal vs Refresh 1 - Same book?', 
            response1.data.data[0]?.title === response2.data.data[0]?.title);
        console.log('Refresh 1 vs Refresh 2 - Same book?', 
            response2.data.data[0]?.title === response3.data.data[0]?.title);
            
    } catch (error) {
        console.error('Error testing recommendations:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testRecommendations();
