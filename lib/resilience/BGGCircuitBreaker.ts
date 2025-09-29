/**
 * BGG Circuit Breaker
 * BGG-specific circuit breaker with custom failure detection and fallback strategies
 */

import {
  CircuitBreaker,
  CircuitBreakerConfig,
  CircuitBreakerOptions,
  CircuitState,
} from './CircuitBreaker';
import { BGGError } from '@/types/bgg.types';
import { eventBus } from '../events/EventBus';
import { BGGEventFactory } from '../events/BGGEvents';

export interface BGGCircuitBreakerConfig extends CircuitBreakerConfig {
  // BGG-specific configurations
  rateLimitThreshold: number; // Number of rate limit errors before opening
  apiUnavailableThreshold: number; // Number of API unavailable errors before opening
  networkErrorThreshold: number; // Number of network errors before opening
  parseErrorThreshold: number; // Number of parse errors before opening
}

export interface BGGCircuitBreakerOptions extends CircuitBreakerOptions {
  config?: Partial<BGGCircuitBreakerConfig>;
  enableEventEmission?: boolean; // Whether to emit events for state changes
  enableDetailedLogging?: boolean; // Whether to enable detailed logging
}

export class BGGCircuitBreaker {
  private circuitBreaker: CircuitBreaker;
  private errorCounts: Map<string, number> = new Map();
  private config: BGGCircuitBreakerConfig;
  private options: BGGCircuitBreakerOptions;

  constructor(options: BGGCircuitBreakerOptions = {}) {
    this.config = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      successThreshold: 3,
      monitoringPeriod: 300000, // 5 minutes
      maxRequests: 3,
      rateLimitThreshold: 3,
      apiUnavailableThreshold: 2,
      networkErrorThreshold: 4,
      parseErrorThreshold: 5,
      ...options.config,
    };

    this.options = {
      enableEventEmission: true,
      enableDetailedLogging: false,
      ...options,
    };

    this.circuitBreaker = new CircuitBreaker({
      config: this.config,
      onStateChange: this.handleStateChange.bind(this),
      onFailure: this.handleFailure.bind(this),
      onSuccess: this.handleSuccess.bind(this),
    });
  }

  /**
   * Execute BGG operation with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    operationType: string = 'unknown'
  ): Promise<T> {
    try {
      return await this.circuitBreaker.execute(operation, fallback);
    } catch (error) {
      // Re-throw the error with additional context
      if (error instanceof BGGError) {
        throw this.enhanceBGGError(error, operationType);
      }
      throw error;
    }
  }

  /**
   * Check if circuit breaker allows BGG operations
   */
  canExecute(): boolean {
    return this.circuitBreaker.canExecute();
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  /**
   * Get BGG-specific metrics
   */
  getMetrics() {
    const baseMetrics = this.circuitBreaker.getMetrics();
    return {
      ...baseMetrics,
      errorCounts: Object.fromEntries(this.errorCounts.entries()),
      bggSpecificConfig: {
        rateLimitThreshold: this.config.rateLimitThreshold,
        apiUnavailableThreshold: this.config.apiUnavailableThreshold,
        networkErrorThreshold: this.config.networkErrorThreshold,
        parseErrorThreshold: this.config.parseErrorThreshold,
      },
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.circuitBreaker.reset();
    this.errorCounts.clear();
  }

  /**
   * Manually open circuit
   */
  open(): void {
    this.circuitBreaker.open();
  }

  /**
   * Manually close circuit
   */
  close(): void {
    this.circuitBreaker.close();
  }

  /**
   * Check if error should trigger circuit breaker
   */
  private shouldTriggerCircuitBreaker(error: Error): boolean {
    if (!(error instanceof BGGError)) {
      return true; // Non-BGG errors always trigger
    }

    const errorCode = error.code;
    const currentCount = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, currentCount + 1);

    // Check specific thresholds for different error types
    switch (errorCode) {
      case 'RATE_LIMIT':
        return currentCount + 1 >= this.config.rateLimitThreshold;
      case 'API_UNAVAILABLE':
        return currentCount + 1 >= this.config.apiUnavailableThreshold;
      case 'NETWORK_ERROR':
        return currentCount + 1 >= this.config.networkErrorThreshold;
      case 'PARSE_ERROR':
        return currentCount + 1 >= this.config.parseErrorThreshold;
      default:
        return currentCount + 1 >= this.config.failureThreshold;
    }
  }

  /**
   * Handle circuit breaker state changes
   */
  private handleStateChange(from: CircuitState, to: CircuitState): void {
    if (this.options.enableDetailedLogging) {
      console.log(`[BGGCircuitBreaker] State change: ${from} → ${to}`);
    }

    if (this.options.enableEventEmission) {
      this.emitStateChangeEvent(from, to);
    }
  }

  /**
   * Handle operation failures
   */
  private handleFailure(error: Error, metrics: any): void {
    if (this.options.enableDetailedLogging) {
      console.log(`[BGGCircuitBreaker] Operation failed:`, {
        error: error.message,
        code: error instanceof BGGError ? error.code : 'UNKNOWN',
        metrics,
      });
    }

    if (this.options.enableEventEmission) {
      this.emitFailureEvent(error, metrics);
    }
  }

  /**
   * Handle operation successes
   */
  private handleSuccess(metrics: any): void {
    if (this.options.enableDetailedLogging) {
      console.log(`[BGGCircuitBreaker] Operation succeeded:`, metrics);
    }

    if (this.options.enableEventEmission) {
      this.emitSuccessEvent(metrics);
    }
  }

  /**
   * Emit state change event
   */
  private emitStateChangeEvent(from: CircuitState, to: CircuitState): void {
    const event = {
      eventType: 'bgg.circuit_breaker.state_change',
      timestamp: new Date().toISOString(),
      eventId: `bgg_cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'bgg-circuit-breaker',
      data: {
        from,
        to,
        metrics: this.getMetrics(),
      },
    };

    eventBus.emit('bgg.circuit_breaker.state_change', event).catch(error => {
      console.error(
        'Failed to emit circuit breaker state change event:',
        error
      );
    });
  }

  /**
   * Emit failure event
   */
  private emitFailureEvent(error: Error, metrics: any): void {
    const event = BGGEventFactory.createBGGApiErrorEvent(
      'circuit_breaker_operation',
      error instanceof BGGError
        ? error
        : new BGGError('API_ERROR', error.message, {
            operation: 'circuit_breaker_execution',
          }),
      { url: 'circuit-breaker', method: 'EXECUTE' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    eventBus.emit('bgg.api.error', event).catch(error => {
      console.error('Failed to emit circuit breaker failure event:', error);
    });
  }

  /**
   * Emit success event
   */
  private emitSuccessEvent(metrics: any): void {
    const event = {
      eventType: 'bgg.circuit_breaker.success',
      timestamp: new Date().toISOString(),
      eventId: `bgg_cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'bgg-circuit-breaker',
      data: {
        metrics,
      },
    };

    eventBus.emit('bgg.circuit_breaker.success', event).catch(error => {
      console.error('Failed to emit circuit breaker success event:', error);
    });
  }

  /**
   * Enhance BGG error with circuit breaker context
   */
  private enhanceBGGError(error: BGGError, operationType: string): BGGError {
    const circuitState = this.getState();
    const metrics = this.getMetrics();

    return new BGGError(
      error.code,
      `${error.message} (Circuit: ${circuitState})`,
      {
        ...error.details,
        circuitState,
        operationType,
        failureCount: metrics.failureCount,
        totalRequests: metrics.totalRequests,
        failureRate: metrics.failureRate,
      },
      error.retryAfter,
      circuitState === CircuitState.OPEN
        ? 'BGG service is temporarily unavailable. Please try again later.'
        : error.userMessage
    );
  }

  /**
   * Get health status for monitoring
   */
  getHealthStatus(): {
    healthy: boolean;
    state: CircuitState;
    lastError?: string;
    errorRate: number;
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const healthy = metrics.state === CircuitState.CLOSED;
    const recommendations: string[] = [];

    if (metrics.state === CircuitState.OPEN) {
      recommendations.push('Circuit is OPEN - BGG API is experiencing issues');
      recommendations.push('Consider using cached data or fallback responses');
    } else if (metrics.state === CircuitState.HALF_OPEN) {
      recommendations.push('Circuit is HALF_OPEN - testing recovery');
      recommendations.push('Monitor closely for continued issues');
    }

    if (metrics.failureRate > 0.5) {
      recommendations.push(
        'High failure rate detected - investigate BGG API health'
      );
    }

    if (metrics.failureCount > this.config.failureThreshold * 0.8) {
      recommendations.push('Approaching failure threshold - monitor closely');
    }

    return {
      healthy,
      state: metrics.state,
      ...(metrics.lastFailureTime && { lastError: metrics.lastFailureTime }),
      errorRate: metrics.failureRate,
      recommendations,
    };
  }
}

/**
 * BGG Circuit Breaker Factory
 */
export class BGGCircuitBreakerFactory {
  /**
   * Create circuit breaker for BGG search operations
   */
  static createForSearch(
    options: Partial<BGGCircuitBreakerOptions> = {}
  ): BGGCircuitBreaker {
    return new BGGCircuitBreaker({
      config: {
        failureThreshold: 5,
        timeout: 60000, // 1 minute
        successThreshold: 3,
        monitoringPeriod: 300000, // 5 minutes
        maxRequests: 3,
        rateLimitThreshold: 3,
        apiUnavailableThreshold: 2,
        networkErrorThreshold: 4,
        parseErrorThreshold: 5,
      },
      enableEventEmission: true,
      enableDetailedLogging: process.env.NODE_ENV === 'development',
      ...options,
    });
  }

  /**
   * Create circuit breaker for BGG game details operations
   */
  static createForGameDetails(
    options: Partial<BGGCircuitBreakerOptions> = {}
  ): BGGCircuitBreaker {
    return new BGGCircuitBreaker({
      config: {
        failureThreshold: 3,
        timeout: 45000, // 45 seconds
        successThreshold: 2,
        monitoringPeriod: 180000, // 3 minutes
        maxRequests: 2,
        rateLimitThreshold: 2,
        apiUnavailableThreshold: 1,
        networkErrorThreshold: 3,
        parseErrorThreshold: 4,
      },
      enableEventEmission: true,
      enableDetailedLogging: process.env.NODE_ENV === 'development',
      ...options,
    });
  }

  /**
   * Create circuit breaker for BGG collection operations
   */
  static createForCollection(
    options: Partial<BGGCircuitBreakerOptions> = {}
  ): BGGCircuitBreaker {
    return new BGGCircuitBreaker({
      config: {
        failureThreshold: 4,
        timeout: 90000, // 1.5 minutes
        successThreshold: 2,
        monitoringPeriod: 240000, // 4 minutes
        maxRequests: 2,
        rateLimitThreshold: 2,
        apiUnavailableThreshold: 1,
        networkErrorThreshold: 3,
        parseErrorThreshold: 4,
      },
      enableEventEmission: true,
      enableDetailedLogging: process.env.NODE_ENV === 'development',
      ...options,
    });
  }
}
