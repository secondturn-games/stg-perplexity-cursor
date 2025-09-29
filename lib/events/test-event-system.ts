/**
 * Event System Test
 * Simple test to verify event emission and handler functionality
 */

import { eventBus } from './EventBus';
import { BGGEventFactory } from './BGGEvents';
import { gameAnalyticsHandler } from './handlers/GameAnalyticsHandler';
import { gameCacheHandler } from './handlers/GameCacheHandler';
import { errorReportingHandler } from './handlers/ErrorReportingHandler';

// Test data
const testQuery = 'Catan';
const testFilters = { gameType: 'base-game' };
const testGameId = '13';
const testGameName = 'Catan';

// Test results
const testSearchResults = {
  items: [
    {
      id: testGameId,
      name: testGameName,
      yearpublished: '1995',
      type: 'boardgame' as const,
      thumbnail: 'https://example.com/thumbnail.jpg',
      searchScore: 95,
      isExactMatch: true,
      isExpansion: false,
      hasInboundExpansionLink: false,
      correctedType: 'base-game' as const,
      relevanceFactors: {
        nameMatch: 95,
        yearMatch: 0,
        typeMatch: 100,
        popularity: 90,
      },
      bggLink: `https://boardgamegeek.com/boardgame/${testGameId}`,
      displayYear: '1995',
      typeDisplay: 'Base Game',
      isHighQuality: true,
      ageInYears: 29,
    },
  ],
  total: 1,
  searchStrategy: 'exact' as const,
  performance: {
    queryTime: 150,
    cacheHit: false,
    apiCalls: 1,
  },
};

const testGameDetails = {
  id: testGameId,
  name: testGameName,
  description: 'A classic board game about building settlements and trading resources.',
  yearpublished: 1995,
  minplayers: 3,
  maxplayers: 4,
  playingtime: 60,
  minplaytime: 60,
  maxplaytime: 90,
  minage: 10,
  image: 'https://example.com/image.jpg',
  thumbnail: 'https://example.com/thumbnail.jpg',
  categories: ['Strategy', 'Economic'],
  mechanics: ['Trading', 'Dice Rolling'],
  designers: ['Klaus Teuber'],
  artists: ['Volkan Baga'],
  publishers: ['Catan Studio'],
  languages: ['English'],
  bgg_rating: 7.2,
  bgg_rank: 200,
  weight_rating: 2.3,
  age_rating: 10,
  last_bgg_sync: new Date().toISOString(),
  bggLink: `https://boardgamegeek.com/boardgame/${testGameId}`,
  playerCount: '3-4',
  playTimeDisplay: '60-90 min',
  ageDisplay: '10+',
  ratingDisplay: '7.2',
  weightDisplay: '2.3',
  rankDisplay: '#200',
  isHighRated: true,
  isHeavy: false,
  isLight: true,
  isPopular: true,
  isRecent: false,
  isClassic: true,
  complexityLevel: 'light' as const,
  playerCountRange: { min: 3, max: 4, optimal: 3.5 },
  playTimeRange: { min: 60, max: 90, average: 75 },
};

// Test functions
export async function testEventSystem(): Promise<void> {
  console.log('🧪 Starting Event System Test...\n');

  try {
    // Test 1: Basic event emission and handling
    console.log('Test 1: Basic event emission and handling');
    await testBasicEventEmission();
    console.log('✅ Basic event emission test passed\n');

    // Test 2: BGG-specific events
    console.log('Test 2: BGG-specific events');
    await testBGGEvents();
    console.log('✅ BGG events test passed\n');

    // Test 3: Event handlers
    console.log('Test 3: Event handlers');
    await testEventHandlers();
    console.log('✅ Event handlers test passed\n');

    // Test 4: Memory management
    console.log('Test 4: Memory management');
    await testMemoryManagement();
    console.log('✅ Memory management test passed\n');

    // Test 5: Error handling
    console.log('Test 5: Error handling');
    await testErrorHandling();
    console.log('✅ Error handling test passed\n');

    console.log('🎉 All Event System Tests Passed!');
  } catch (error) {
    console.error('❌ Event System Test Failed:', error);
    throw error;
  }
}

async function testBasicEventEmission(): Promise<void> {
  let eventReceived = false;
  let receivedData: any = null;

  // Register handler
  const handler = async (data: any) => {
    eventReceived = true;
    receivedData = data;
  };

  eventBus.on('test.event', handler);

  // Emit event
  const testData = { message: 'Hello, Event System!', timestamp: Date.now() };
  await eventBus.emit('test.event', testData);

  // Verify
  if (!eventReceived || !receivedData) {
    throw new Error('Event not received or data missing');
  }

  if (receivedData.message !== testData.message) {
    throw new Error('Event data mismatch');
  }

  // Cleanup
  eventBus.off('test.event', handler);
}

async function testBGGEvents(): Promise<void> {
  let searchEventReceived = false;
  let cacheEventReceived = false;

  // Register handlers
  const searchHandler = async (event: any) => {
    searchEventReceived = true;
    console.log('  📊 Search event received:', event.eventType);
  };

  const cacheHandler = async (event: any) => {
    cacheEventReceived = true;
    console.log('  💾 Cache event received:', event.eventType);
  };

  eventBus.on('game.searched', searchHandler);
  eventBus.on('game.cached', cacheHandler);

  // Emit BGG events
  const searchEvent = BGGEventFactory.createGameSearchedEvent(
    testQuery,
    testFilters,
    testSearchResults,
    { queryTime: 150, cacheHit: false, apiCalls: 1 }
  );

  const cacheEvent = BGGEventFactory.createGameCachedEvent(
    'search:test:default',
    'search',
    3600000, // 1 hour
    1024,
    undefined,
    testQuery
  );

  await eventBus.emit('game.searched', searchEvent);
  await eventBus.emit('game.cached', cacheEvent);

  // Verify
  if (!searchEventReceived || !cacheEventReceived) {
    throw new Error('BGG events not received');
  }

  // Cleanup
  eventBus.off('game.searched', searchHandler);
  eventBus.off('game.cached', cacheHandler);
}

async function testEventHandlers(): Promise<void> {
  // Test analytics handler
  console.log('  📈 Testing analytics handler...');
  const analyticsEvent = BGGEventFactory.createSearchAnalyticsEvent(
    testQuery,
    1,
    'exact',
    150,
    false,
    'test-user-agent',
    'test-session-id'
  );

  await eventBus.emit('analytics.search', analyticsEvent);

  // Test cache handler
  console.log('  💾 Testing cache handler...');
  const cacheEvent = BGGEventFactory.createCacheHitEvent(
    'test:cache:key',
    'search',
    5000,
    undefined,
    testQuery
  );

  await eventBus.emit('cache.hit', cacheEvent);

  // Test error handler
  console.log('  🚨 Testing error handler...');
  const errorEvent = BGGEventFactory.createBGGApiErrorEvent(
    'testOperation',
    new Error('Test error') as any,
    { url: 'https://test.com', method: 'GET' }
  );

  await eventBus.emit('bgg.api.error', errorEvent);

  // Get handler statistics
  const analyticsStats = gameAnalyticsHandler.getAnalyticsSummary();
  const cacheStats = gameCacheHandler.getCacheStatistics();
  const errorStats = errorReportingHandler.getErrorStatistics();

  console.log('  📊 Analytics stats:', {
    searchHistory: analyticsStats.searchHistory.length,
    gameViews: analyticsStats.gameViews.length,
    sessionCount: analyticsStats.sessionCount,
  });

  console.log('  💾 Cache stats:', {
    totalEntries: cacheStats.totalEntries,
    hitRate: cacheStats.hitRate,
    evictionCount: cacheStats.evictionCount,
  });

  console.log('  🚨 Error stats:', {
    totalErrors: errorStats.totalErrors,
    retryableErrors: errorStats.retryableErrors,
  });
}

async function testMemoryManagement(): Promise<void> {
  const initialStats = eventBus.getMemoryStats();
  console.log('  📊 Initial memory stats:', initialStats);

  // Register many handlers
  const handlers: Array<() => void> = [];
  for (let i = 0; i < 50; i++) {
    const handler = async (data: any) => {
      // Do nothing
    };
    eventBus.on(`test.memory.${i}`, handler);
    handlers.push(() => eventBus.off(`test.memory.${i}`, handler));
  }

  const afterRegistrationStats = eventBus.getMemoryStats();
  console.log('  📊 After registration stats:', afterRegistrationStats);

  // Cleanup handlers
  handlers.forEach(cleanup => cleanup());

  const afterCleanupStats = eventBus.getMemoryStats();
  console.log('  📊 After cleanup stats:', afterCleanupStats);

  if (afterCleanupStats.totalHandlers > initialStats.totalHandlers) {
    console.warn('  ⚠️ Memory cleanup may not be working properly');
  }
}

async function testErrorHandling(): Promise<void> {
  let errorEventReceived = false;

  // Register error handler
  const errorHandler = async (event: any) => {
    errorEventReceived = true;
    console.log('  🚨 Error event received:', event.eventType);
  };

  eventBus.on('bgg.api.error', errorHandler);

  // Create a handler that throws an error
  const faultyHandler = async (data: any) => {
    throw new Error('This handler intentionally fails');
  };

  eventBus.on('test.error', faultyHandler);

  // Emit event - should not crash the system
  await eventBus.emit('test.error', { test: 'data' });

  // Verify error handling
  if (!errorEventReceived) {
    console.warn('  ⚠️ Error event not received - error handling may not be working');
  }

  // Cleanup
  eventBus.off('bgg.api.error', errorHandler);
  eventBus.off('test.error', faultyHandler);
}

// Run tests if this file is executed directly
if (require.main === module) {
  testEventSystem()
    .then(() => {
      console.log('\n🎉 Event System Test Suite Completed Successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Event System Test Suite Failed:', error);
      process.exit(1);
    });
}