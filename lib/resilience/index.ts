/**
 * Resilience Module
 * Exports all circuit breaker and fallback strategy components
 */

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitBreakerFactory,
  CircuitState,
  type CircuitBreakerConfig,
  type CircuitBreakerOptions,
  type CircuitBreakerMetrics,
} from './CircuitBreaker';

// BGG Circuit Breaker
export {
  BGGCircuitBreaker,
  BGGCircuitBreakerFactory,
  type BGGCircuitBreakerConfig,
  type BGGCircuitBreakerOptions,
} from './BGGCircuitBreaker';

// Fallback Strategies
export {
  FallbackStrategies,
  type FallbackSearchOptions,
  type FallbackGameDetailsOptions,
  type FallbackCollectionOptions,
} from './FallbackStrategies';
