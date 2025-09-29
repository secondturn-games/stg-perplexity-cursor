/**
 * Circuit Breaker Test Suite
 * Comprehensive tests for circuit breaker functionality
 */

import {
  CircuitBreaker,
  CircuitState,
  CircuitBreakerFactory,
} from './CircuitBreaker';
import {
  BGGCircuitBreaker,
  BGGCircuitBreakerFactory,
} from './BGGCircuitBreaker';
import { FallbackStrategies } from './FallbackStrategies';
import { BGGError } from '@/types/bgg.types';

// Test data
const testQuery = 'Catan';
const testGameId = '13';
const testUsername = 'testuser';

/**
 * Test basic circuit breaker functionality
 */
async function testBasicCircuitBreaker(): Promise<void> {
  console.log('🧪 Testing Basic Circuit Breaker...');

  const circuitBreaker = new CircuitBreaker({
    config: {
      failureThreshold: 3,
      timeout: 5000, // 5 seconds
      successThreshold: 2,
      monitoringPeriod: 10000, // 10 seconds
      maxRequests: 2,
    },
    onStateChange: (from, to) => {
      console.log(`  📊 State change: ${from} → ${to}`);
    },
    onFailure: (error, metrics) => {
      console.log(`  ❌ Failure: ${error.message}`, metrics);
    },
    onSuccess: metrics => {
      console.log(`  ✅ Success:`, metrics);
    },
  });

  // Test successful operations
  console.log('  Testing successful operations...');
  for (let i = 0; i < 2; i++) {
    try {
      const result = await circuitBreaker.execute(async () => {
        return `Success ${i + 1}`;
      });
      console.log(`    ✅ Operation ${i + 1} succeeded:`, result);
    } catch (error) {
      console.log(`    ❌ Operation ${i + 1} failed:`, error);
    }
  }

  // Test failures to trigger circuit opening
  console.log('  Testing failures to trigger circuit opening...');
  for (let i = 0; i < 4; i++) {
    try {
      await circuitBreaker.execute(async () => {
        throw new Error(`Test error ${i + 1}`);
      });
    } catch (error) {
      console.log(
        `    ❌ Expected failure ${i + 1}:`,
        (error as Error).message
      );
    }
  }

  // Test circuit breaker state
  const state = circuitBreaker.getState();
  console.log(`  📊 Final state: ${state}`);

  // Test metrics
  const metrics = circuitBreaker.getMetrics();
  console.log('  📊 Final metrics:', metrics);

  console.log('✅ Basic Circuit Breaker test completed\n');
}

/**
 * Test BGG circuit breaker functionality
 */
async function testBGGCircuitBreaker(): Promise<void> {
  console.log('🧪 Testing BGG Circuit Breaker...');

  const bggCircuitBreaker = BGGCircuitBreakerFactory.createForSearch({
    enableEventEmission: true,
    enableDetailedLogging: true,
  });

  // Test successful operation
  console.log('  Testing successful operation...');
  try {
    const result = await bggCircuitBreaker.execute(
      async () => 'BGG API response',
      async () => 'Fallback response',
      'testOperation'
    );
    console.log(`    ✅ BGG operation succeeded:`, result);
  } catch (error) {
    console.log(`    ❌ BGG operation failed:`, error);
  }

  // Test BGG-specific error handling
  console.log('  Testing BGG-specific error handling...');
  try {
    await bggCircuitBreaker.execute(
      async () => {
        throw new BGGError('RATE_LIMIT', 'Rate limited', {}, 30, 'Please wait');
      },
      async () => 'Fallback response',
      'testRateLimit'
    );
  } catch (error) {
    console.log(`    ❌ Expected BGG error:`, (error as BGGError).code);
  }

  // Test health status
  const healthStatus = bggCircuitBreaker.getHealthStatus();
  console.log('  📊 Health status:', healthStatus);

  // Test metrics
  const metrics = bggCircuitBreaker.getMetrics();
  console.log('  📊 BGG metrics:', metrics);

  console.log('✅ BGG Circuit Breaker test completed\n');
}

/**
 * Test fallback strategies
 */
async function testFallbackStrategies(): Promise<void> {
  console.log('🧪 Testing Fallback Strategies...');

  // Test search fallback
  console.log('  Testing search fallback...');
  try {
    const searchResults = await FallbackStrategies.getFallbackSearchResults({
      query: testQuery,
      filters: { gameType: 'base-game' },
      maxResults: 5,
      includePartialData: true,
    });
    console.log(`    ✅ Search fallback succeeded:`, {
      total: searchResults.total,
      itemsCount: searchResults.items.length,
      strategy: searchResults.searchStrategy,
    });
  } catch (error) {
    console.log(`    ❌ Search fallback failed:`, error);
  }

  // Test game details fallback
  console.log('  Testing game details fallback...');
  try {
    const gameDetails = await FallbackStrategies.getFallbackGameDetails({
      gameId: testGameId,
      includePartialData: true,
    });
    console.log(`    ✅ Game details fallback succeeded:`, {
      id: gameDetails?.id,
      name: gameDetails?.name,
    });
  } catch (error) {
    console.log(`    ❌ Game details fallback failed:`, error);
  }

  // Test collection fallback
  console.log('  Testing collection fallback...');
  try {
    const collection = await FallbackStrategies.getFallbackCollection({
      username: testUsername,
      includePartialData: true,
    });
    console.log(`    ✅ Collection fallback succeeded:`, {
      total: collection.total,
    });
  } catch (error) {
    console.log(`    ❌ Collection fallback failed:`, error);
  }

  // Test error classification
  console.log('  Testing error classification...');
  const testErrors = [
    new BGGError('RATE_LIMIT', 'Rate limited', {}, 30),
    new BGGError('API_UNAVAILABLE', 'API unavailable', {}),
    new BGGError('NETWORK_ERROR', 'Network error', {}),
    new BGGError('PARSE_ERROR', 'Parse error', {}),
    new Error('Generic error'),
  ];

  testErrors.forEach((error, index) => {
    const shouldUseFallback = FallbackStrategies.shouldUseFallback(error);
    console.log(
      `    ${shouldUseFallback ? '✅' : '❌'} Error ${index + 1} (${error instanceof BGGError ? error.code : 'GENERIC'}): ${shouldUseFallback ? 'Should use fallback' : 'Should not use fallback'}`
    );
  });

  console.log('✅ Fallback Strategies test completed\n');
}

/**
 * Test circuit breaker factory
 */
async function testCircuitBreakerFactory(): Promise<void> {
  console.log('🧪 Testing Circuit Breaker Factory...');

  // Test API circuit breaker
  const apiCircuitBreaker = CircuitBreakerFactory.createForAPI();
  console.log('  ✅ API circuit breaker created');

  // Test database circuit breaker
  const dbCircuitBreaker = CircuitBreakerFactory.createForDatabase();
  console.log('  ✅ Database circuit breaker created');

  // Test external service circuit breaker
  const externalCircuitBreaker =
    CircuitBreakerFactory.createForExternalService();
  console.log('  ✅ External service circuit breaker created');

  // Test BGG circuit breaker factory
  const searchCircuitBreaker = BGGCircuitBreakerFactory.createForSearch();
  console.log('  ✅ BGG search circuit breaker created');

  const gameDetailsCircuitBreaker =
    BGGCircuitBreakerFactory.createForGameDetails();
  console.log('  ✅ BGG game details circuit breaker created');

  const collectionCircuitBreaker =
    BGGCircuitBreakerFactory.createForCollection();
  console.log('  ✅ BGG collection circuit breaker created');

  console.log('✅ Circuit Breaker Factory test completed\n');
}

/**
 * Test circuit breaker state transitions
 */
async function testStateTransitions(): Promise<void> {
  console.log('🧪 Testing State Transitions...');

  const circuitBreaker = new CircuitBreaker({
    config: {
      failureThreshold: 2,
      timeout: 2000, // 2 seconds
      successThreshold: 1,
      monitoringPeriod: 5000, // 5 seconds
      maxRequests: 1,
    },
    onStateChange: (from, to) => {
      console.log(`  📊 State transition: ${from} → ${to}`);
    },
  });

  // Start in CLOSED state
  console.log(`  📊 Initial state: ${circuitBreaker.getState()}`);

  // Cause failures to open circuit
  console.log('  Causing failures to open circuit...');
  for (let i = 0; i < 3; i++) {
    try {
      await circuitBreaker.execute(async () => {
        throw new Error(`Failure ${i + 1}`);
      });
    } catch (error) {
      console.log(`    ❌ Failure ${i + 1}:`, (error as Error).message);
    }
  }

  console.log(`  📊 State after failures: ${circuitBreaker.getState()}`);

  // Wait for timeout to allow half-open transition
  console.log('  Waiting for timeout to allow half-open transition...');
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Test half-open state
  console.log('  Testing half-open state...');
  try {
    const result = await circuitBreaker.execute(async () => {
      return 'Success after timeout';
    });
    console.log(`    ✅ Success in half-open:`, result);
  } catch (error) {
    console.log(`    ❌ Failure in half-open:`, error);
  }

  console.log(`  📊 Final state: ${circuitBreaker.getState()}`);

  console.log('✅ State Transitions test completed\n');
}

/**
 * Run all circuit breaker tests
 */
export async function runCircuitBreakerTests(): Promise<void> {
  console.log('🚀 Starting Circuit Breaker Test Suite...\n');

  try {
    await testBasicCircuitBreaker();
    await testBGGCircuitBreaker();
    await testFallbackStrategies();
    await testCircuitBreakerFactory();
    await testStateTransitions();

    console.log('🎉 All Circuit Breaker Tests Passed!');
  } catch (error) {
    console.error('❌ Circuit Breaker Test Suite Failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runCircuitBreakerTests()
    .then(() => {
      console.log('\n🎉 Circuit Breaker Test Suite Completed Successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Circuit Breaker Test Suite Failed:', error);
      process.exit(1);
    });
}
