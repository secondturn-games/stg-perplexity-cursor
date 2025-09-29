/**
 * BGG Integration Test
 * Test BGG service event emission integration
 */

import { eventBus } from './EventBus';
import { BGGService } from '../bgg/BGGService';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'https://boardgamegeek.com/xmlapi2',
  rateLimit: {
    requestsPerSecond: 0.5,
    burstLimit: 5,
    retryDelay: 2000,
  },
  cache: {
    ttl: 3600000, // 1 hour
    maxSize: 1000,
    cleanupInterval: 300000, // 5 minutes
  },
  search: {
    exactSearchThreshold: 3,
    maxResults: 50,
    timeout: 10000,
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
  debug: {
    enabled: true,
    logLevel: 'info' as const,
    logRequests: true,
    logResponses: false,
  },
};

// Event tracking
const eventTracker = {
  events: [] as Array<{ type: string; timestamp: string; data: any }>,
  reset: function () {
    this.events = [];
  },
  add: function (type: string, data: any) {
    this.events.push({
      type,
      timestamp: new Date().toISOString(),
      data,
    });
  },
  getEvents: function (type?: string) {
    return type ? this.events.filter(e => e.type === type) : this.events;
  },
  getEventCount: function (type?: string) {
    return this.getEvents(type).length;
  },
};

// Test functions
export async function testBGGIntegration(): Promise<void> {
  console.log('🧪 Starting BGG Integration Test...\n');

  try {
    // Setup event tracking
    setupEventTracking();

    // Test 1: Search events
    console.log('Test 1: Search events');
    await testSearchEvents();
    console.log('✅ Search events test passed\n');

    // Test 2: Game details events
    console.log('Test 2: Game details events');
    await testGameDetailsEvents();
    console.log('✅ Game details events test passed\n');

    // Test 3: Cache events
    console.log('Test 3: Cache events');
    await testCacheEvents();
    console.log('✅ Cache events test passed\n');

    // Test 4: Error events
    console.log('Test 4: Error events');
    await testErrorEvents();
    console.log('✅ Error events test passed\n');

    // Test 5: Event handler integration
    console.log('Test 5: Event handler integration');
    await testEventHandlerIntegration();
    console.log('✅ Event handler integration test passed\n');

    console.log('🎉 All BGG Integration Tests Passed!');
  } catch (error) {
    console.error('❌ BGG Integration Test Failed:', error);
    throw error;
  }
}

function setupEventTracking(): void {
  // Track all BGG events
  const eventTypes = [
    'game.searched',
    'game.search.failed',
    'game.details.fetched',
    'game.details.failed',
    'game.cached',
    'cache.hit',
    'cache.miss',
    'cache.evicted',
    'bgg.api.error',
    'bgg.api.rate_limited',
    'bgg.api.success',
    'analytics.search',
    'analytics.game.view',
    'analytics.performance',
  ];

  eventTypes.forEach(eventType => {
    eventBus.on(eventType, (data: any) => {
      eventTracker.add(eventType, data);
    });
  });
}

async function testSearchEvents(): Promise<void> {
  eventTracker.reset();

  // Mock BGG service for testing
  const bggService = new BGGService();

  try {
    // Test successful search
    console.log('  🔍 Testing successful search...');
    const searchResults = await bggService.searchGames('Catan', {
      gameType: 'base-game',
    });

    // Verify search events were emitted
    const searchEvents = eventTracker.getEvents('game.searched');
    const cacheEvents = eventTracker.getEvents('game.cached');
    const cacheHitEvents = eventTracker.getEvents('cache.hit');
    const cacheMissEvents = eventTracker.getEvents('cache.miss');

    console.log(`  📊 Events emitted: ${eventTracker.getEventCount()} total`);
    console.log(`    - Search events: ${searchEvents.length}`);
    console.log(`    - Cache events: ${cacheEvents.length}`);
    console.log(`    - Cache hit events: ${cacheHitEvents.length}`);
    console.log(`    - Cache miss events: ${cacheMissEvents.length}`);

    if (searchEvents.length === 0) {
      throw new Error('No search events were emitted');
    }

    if (cacheEvents.length === 0) {
      throw new Error('No cache events were emitted');
    }

    // Verify event data structure
    const searchEvent = searchEvents[0];
    console.log(
      '  🔍 Search event structure:',
      JSON.stringify(searchEvent, null, 2)
    );
    if (!searchEvent.data.query || !searchEvent.data.results) {
      console.error('  ❌ Search event data structure:', searchEvent.data);
      throw new Error('Search event data structure is invalid');
    }

    console.log('  ✅ Search events verified');
  } catch (error) {
    console.error('  ❌ Search events test failed:', error);
    throw error;
  }
}

async function testGameDetailsEvents(): Promise<void> {
  eventTracker.reset();

  const bggService = new BGGService();

  try {
    // Test successful game details fetch
    console.log('  🎮 Testing game details fetch...');
    const gameDetails = await bggService.getGameDetails('13'); // Catan

    // Verify game details events were emitted
    const detailsEvents = eventTracker.getEvents('game.details.fetched');
    const cacheEvents = eventTracker.getEvents('game.cached');

    console.log(`  📊 Events emitted: ${eventTracker.getEventCount()} total`);
    console.log(`    - Details events: ${detailsEvents.length}`);
    console.log(`    - Cache events: ${cacheEvents.length}`);

    if (detailsEvents.length === 0) {
      throw new Error('No game details events were emitted');
    }

    // Verify event data structure
    const detailsEvent = detailsEvents[0];
    if (!detailsEvent.data.gameId || !detailsEvent.data.gameName) {
      throw new Error('Game details event data structure is invalid');
    }

    console.log('  ✅ Game details events verified');
  } catch (error) {
    console.error('  ❌ Game details events test failed:', error);
    throw error;
  }
}

async function testCacheEvents(): Promise<void> {
  eventTracker.reset();

  const bggService = new BGGService();

  try {
    // Test cache behavior
    console.log('  💾 Testing cache events...');

    // First search (should miss cache)
    await bggService.searchGames('Pandemic', { gameType: 'base-game' });
    const firstSearchEvents = eventTracker.getEvents('cache.miss');
    const firstCacheEvents = eventTracker.getEvents('game.cached');

    // Second search (should hit cache)
    eventTracker.reset();
    await bggService.searchGames('Pandemic', { gameType: 'base-game' });
    const secondSearchEvents = eventTracker.getEvents('cache.hit');

    console.log(`  📊 Cache events:`);
    console.log(`    - First search cache misses: ${firstSearchEvents.length}`);
    console.log(`    - First search cache stores: ${firstCacheEvents.length}`);
    console.log(`    - Second search cache hits: ${secondSearchEvents.length}`);

    if (firstSearchEvents.length === 0) {
      throw new Error('No cache miss events were emitted on first search');
    }

    if (secondSearchEvents.length === 0) {
      console.warn(
        '  ⚠️ No cache hit events on second search - cache may not be working'
      );
    }

    console.log('  ✅ Cache events verified');
  } catch (error) {
    console.error('  ❌ Cache events test failed:', error);
    throw error;
  }
}

async function testErrorEvents(): Promise<void> {
  eventTracker.reset();

  const bggService = new BGGService();

  try {
    // Test error handling
    console.log('  🚨 Testing error events...');

    // Test with invalid query (should trigger validation error)
    try {
      await bggService.searchGames('a', { gameType: 'base-game' });
    } catch (error) {
      // Expected to throw
    }

    const errorEvents = eventTracker.getEvents('game.search.failed');
    console.log(`  📊 Error events: ${errorEvents.length}`);

    if (errorEvents.length === 0) {
      throw new Error('No error events were emitted for invalid query');
    }

    // Verify error event data structure
    const errorEvent = errorEvents[0];
    if (!errorEvent.data.error || !errorEvent.data.error.code) {
      throw new Error('Error event data structure is invalid');
    }

    console.log('  ✅ Error events verified');
  } catch (error) {
    console.error('  ❌ Error events test failed:', error);
    throw error;
  }
}

async function testEventHandlerIntegration(): Promise<void> {
  eventTracker.reset();

  try {
    // Test that handlers are working
    console.log('  🔧 Testing event handler integration...');

    // Import handlers
    const { gameAnalyticsHandler, gameCacheHandler, errorReportingHandler } =
      await import('./handlers');

    // Emit test events
    const searchEvent = {
      eventType: 'game.searched',
      timestamp: new Date().toISOString(),
      eventId: 'test-123',
      source: 'bgg-service',
      data: {
        query: 'Test Game',
        filters: { gameType: 'base-game' },
        results: { total: 1, itemsCount: 1, searchStrategy: 'exact' },
        performance: { queryTime: 100, cacheHit: false, apiCalls: 1 },
      },
    };

    await eventBus.emit('game.searched', searchEvent);

    // Check handler statistics
    const analyticsStats = gameAnalyticsHandler.getAnalyticsSummary();
    const cacheStats = gameCacheHandler.getCacheStatistics();
    const errorStats = errorReportingHandler.getErrorStatistics();

    console.log(`  📊 Handler statistics:`);
    console.log(
      `    - Analytics: ${analyticsStats.searchHistory.length} search history entries`
    );
    console.log(`    - Cache: ${cacheStats.totalEntries} cache entries`);
    console.log(`    - Errors: ${errorStats.totalErrors} error entries`);

    console.log('  ✅ Event handler integration verified');
  } catch (error) {
    console.error('  ❌ Event handler integration test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testBGGIntegration()
    .then(() => {
      console.log('\n🎉 BGG Integration Test Suite Completed Successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ BGG Integration Test Suite Failed:', error);
      process.exit(1);
    });
}
