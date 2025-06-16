const aiService = require('./src/services/aiService');

async function testRefresh() {
    console.log('🧪 Testing recommendation refresh...');
    
    const userId = '68423091482d1424d5c77f6d'; // Your test user ID
    
    try {
        console.log('\n--- First request (normal) ---');
        const recommendations1 = await aiService.getRecommendedBooks(userId, 3, { refresh: false });
        console.log('Books:', recommendations1.map(r => r.title).join(', '));
        
        console.log('\n--- Second request (refresh) ---');
        const recommendations2 = await aiService.getRecommendedBooks(userId, 3, { refresh: true });
        console.log('Books:', recommendations2.map(r => r.title).join(', '));
        
        console.log('\n--- Third request (refresh again) ---');
        const recommendations3 = await aiService.getRecommendedBooks(userId, 3, { refresh: true });
        console.log('Books:', recommendations3.map(r => r.title).join(', '));
        
        // Check if books are different
        const titles1 = recommendations1.map(r => r.title);
        const titles2 = recommendations2.map(r => r.title);
        const titles3 = recommendations3.map(r => r.title);
        
        const same12 = titles1.every(title => titles2.includes(title));
        const same23 = titles2.every(title => titles3.includes(title));
        
        console.log('\n--- Results ---');
        console.log(`Request 1 vs 2: ${same12 ? '❌ SAME' : '✅ DIFFERENT'}`);
        console.log(`Request 2 vs 3: ${same23 ? '❌ SAME' : '✅ DIFFERENT'}`);
        
        if (!same12 && !same23) {
            console.log('🎉 Refresh is working correctly!');
        } else {
            console.log('⚠️  Refresh may not be working as expected');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    process.exit(0);
}

testRefresh();
