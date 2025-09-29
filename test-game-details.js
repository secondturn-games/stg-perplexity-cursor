const fetch = require('node-fetch');

async function testGameDetails() {
  try {
    console.log('Testing game details API...');

    const response = await fetch(
      'http://localhost:3000/api/bgg/game-details/410201'
    );
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Game details API is working correctly!');
    } else {
      console.log('❌ Game details API returned an error:', data);
    }
  } catch (error) {
    console.error('❌ Error testing game details API:', error);
  }
}

testGameDetails();
