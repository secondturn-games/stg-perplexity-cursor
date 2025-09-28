/**
 * Simple BGG Integration Test
 * Tests the BGG API integration with basic functionality
 */

// Test the BGG client directly
async function testBGGClient() {
  console.log('🧪 Testing BGG Client directly...');

  try {
    // Import the BGG client (this will work in Node.js)
    const { bggClient } = await import('../lib/bgg-client.ts');

    console.log('✅ BGG client imported successfully');

    // Test search
    console.log('🔍 Testing search...');
    try {
      const searchResults = await bggClient.searchGames('Catan');
      console.log('✅ Search successful:', searchResults);
    } catch (error) {
      console.log('❌ Search failed:', error.message);
    }

    // Test game details
    console.log('🎮 Testing game details...');
    try {
      const gameDetails = await bggClient.getGameDetails('13');
      console.log('✅ Game details successful:', gameDetails);
    } catch (error) {
      console.log('❌ Game details failed:', error.message);
    }
  } catch (error) {
    console.log('❌ Failed to import BGG client:', error.message);
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API endpoints...');

  const baseUrl = 'http://localhost:3000/api/bgg';

  // Test search endpoint
  try {
    console.log('🔍 Testing search endpoint...');
    const response = await fetch(`${baseUrl}/search?q=Catan`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Search endpoint successful:', data);
    } else {
      console.log('❌ Search endpoint failed:', data);
    }
  } catch (error) {
    console.log('❌ Search endpoint error:', error.message);
  }

  // Test game details endpoint
  try {
    console.log('🎮 Testing game details endpoint...');
    const response = await fetch(`${baseUrl}/game/13`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Game details endpoint successful:', data);
    } else {
      console.log('❌ Game details endpoint failed:', data);
    }
  } catch (error) {
    console.log('❌ Game details endpoint error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting BGG Integration Tests\n');
  console.log('='.repeat(50));

  await testBGGClient();
  await testAPIEndpoints();

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testBGGClient,
  testAPIEndpoints,
  runTests,
};
