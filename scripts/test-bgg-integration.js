/**
 * Test BGG Integration
 * Tests the BGG API integration with popular games
 */

const BGG_API_BASE = 'http://localhost:3000/api/bgg';

// Popular games to test
const TEST_GAMES = [
  { name: 'Catan', bggId: '13' },
  { name: 'Ticket to Ride', bggId: '9209' },
  { name: 'Wingspan', bggId: '266192' },
];

/**
 * Test game search
 */
async function testSearch() {
  console.log('🔍 Testing game search...');

  for (const game of TEST_GAMES) {
    try {
      const response = await fetch(
        `${BGG_API_BASE}/search?q=${encodeURIComponent(game.name)}`
      );
      const data = await response.json();

      if (response.ok) {
        console.log(
          `✅ Search for "${game.name}": Found ${data.items?.length || 0} results`
        );
        if (data.items?.length > 0) {
          console.log(
            `   First result: ${data.items[0].name} (ID: ${data.items[0].id})`
          );
        }
      } else {
        console.log(`❌ Search for "${game.name}": ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Search for "${game.name}": ${error.message}`);
    }

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Test game details
 */
async function testGameDetails() {
  console.log('\n🎮 Testing game details...');

  for (const game of TEST_GAMES) {
    try {
      const response = await fetch(`${BGG_API_BASE}/game/${game.bggId}`);
      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Game details for "${game.name}":`);
        console.log(`   Title: ${data.title || data.name}`);
        console.log(`   Year: ${data.year_published || data.yearpublished}`);
        console.log(
          `   Players: ${data.min_players || data.minplayers}-${data.max_players || data.maxplayers}`
        );
        console.log(
          `   Playing Time: ${data.playing_time || data.playingtime} minutes`
        );
        console.log(`   BGG Rating: ${data.bgg_rating}`);
        console.log(`   BGG Rank: ${data.bgg_rank}`);
        console.log(`   Categories: ${data.categories?.join(', ') || 'N/A'}`);
        console.log(`   Mechanics: ${data.mechanics?.join(', ') || 'N/A'}`);
      } else {
        console.log(`❌ Game details for "${game.name}": ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Game details for "${game.name}": ${error.message}`);
    }

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Test batch update
 */
async function testBatchUpdate() {
  console.log('\n📦 Testing batch update...');

  const gameIds = TEST_GAMES.map(game => game.bggId);

  try {
    const response = await fetch(
      `${BGG_API_BASE}/batch?game_ids=${gameIds.join(',')}`
    );
    const data = await response.json();

    if (response.ok) {
      console.log(
        `✅ Batch update: ${data.results?.length || 0} games processed`
      );
      data.results?.forEach((result, index) => {
        const game = TEST_GAMES[index];
        console.log(
          `   ${game.name}: ${result.status}${result.error ? ` (${result.error})` : ''}`
        );
      });
    } else {
      console.log(`❌ Batch update: ${data.error}`);
    }
  } catch (error) {
    console.log(`❌ Batch update: ${error.message}`);
  }
}

/**
 * Test sync popular games
 */
async function testSyncPopular() {
  console.log('\n🔄 Testing sync popular games...');

  try {
    const response = await fetch(`${BGG_API_BASE}/sync?type=popular&limit=5`);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Sync popular: ${data.synced || 0} games synced`);
      if (data.batchResult) {
        console.log(`   Batch status: ${data.batchResult.status}`);
        console.log(
          `   Results: ${data.batchResult.results?.length || 0} processed`
        );
      }
    } else {
      console.log(`❌ Sync popular: ${data.error}`);
    }
  } catch (error) {
    console.log(`❌ Sync popular: ${error.message}`);
  }
}

/**
 * Test image processing
 */
async function testImageProcessing() {
  console.log('\n🖼️ Testing image processing...');

  for (const game of TEST_GAMES) {
    try {
      const response = await fetch(
        `${BGG_API_BASE}/game/${game.bggId}?process_images=true`
      );
      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Image processing for "${game.name}":`);
        console.log(`   Original image: ${data.image ? 'Yes' : 'No'}`);
        console.log(`   Thumbnail: ${data.thumbnail ? 'Yes' : 'No'}`);
      } else {
        console.log(`❌ Image processing for "${game.name}": ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Image processing for "${game.name}": ${error.message}`);
    }

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting BGG Integration Tests\n');
  console.log(
    'Testing with popular games:',
    TEST_GAMES.map(g => g.name).join(', ')
  );
  console.log('='.repeat(50));

  await testSearch();
  await testGameDetails();
  await testBatchUpdate();
  await testSyncPopular();
  await testImageProcessing();

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testSearch,
  testGameDetails,
  testBatchUpdate,
  testSyncPopular,
  testImageProcessing,
  runAllTests,
};
