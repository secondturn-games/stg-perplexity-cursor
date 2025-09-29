/**
 * Simple Event System Test
 * Quick test to verify event emission works
 */

import { eventBus } from './EventBus';
import { BGGEventFactory } from './BGGEvents';

async function simpleTest() {
  console.log('🧪 Running Simple Event System Test...\n');

  let eventCount = 0;
  const events: any[] = [];

  // Track all events
  const trackEvent = (event: any) => {
    eventCount++;
    events.push(event);
    console.log(`📊 Event ${eventCount}: ${event.eventType}`);
  };

  // Register handlers
  eventBus.on('game.searched', trackEvent);
  eventBus.on('game.cached', trackEvent);
  eventBus.on('cache.hit', trackEvent);
  eventBus.on('cache.miss', trackEvent);

  try {
    // Test 1: Emit search event
    console.log('Test 1: Emitting search event...');
    const searchEvent = BGGEventFactory.createGameSearchedEvent(
      'Catan',
      { gameType: 'base-game' },
      {
        items: [],
        total: 0,
        searchStrategy: 'exact',
        performance: { queryTime: 100, cacheHit: false, apiCalls: 1 },
      },
      { queryTime: 100, cacheHit: false, apiCalls: 1 }
    );
    await eventBus.emit('game.searched', searchEvent);

    // Test 2: Emit cache event
    console.log('Test 2: Emitting cache event...');
    const cacheEvent = BGGEventFactory.createGameCachedEvent(
      'search:test:default',
      'search',
      3600000,
      1024,
      undefined,
      'test'
    );
    await eventBus.emit('game.cached', cacheEvent);

    // Test 3: Emit cache hit event
    console.log('Test 3: Emitting cache hit event...');
    const cacheHitEvent = BGGEventFactory.createCacheHitEvent(
      'search:test:default',
      'search',
      5000,
      undefined,
      'test'
    );
    await eventBus.emit('cache.hit', cacheHitEvent);

    // Test 4: Emit cache miss event
    console.log('Test 4: Emitting cache miss event...');
    const cacheMissEvent = BGGEventFactory.createCacheMissEvent(
      'search:test:default',
      'search',
      undefined,
      'test'
    );
    await eventBus.emit('cache.miss', cacheMissEvent);

    console.log(`\n✅ Test completed! Emitted ${eventCount} events`);
    console.log('📊 Event summary:');
    events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.eventType} - ${event.timestamp}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run test
simpleTest()
  .then(success => {
    if (success) {
      console.log('\n🎉 Simple Event System Test Passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Simple Event System Test Failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test crashed:', error);
    process.exit(1);
  });
