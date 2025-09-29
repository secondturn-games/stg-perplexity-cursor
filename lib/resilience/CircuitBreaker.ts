/**
 * Circuit Breaker Pattern Implementation
 * Generic circuit breaker class with configurable failure threshold and timeout
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  timeout: number; // Time in ms before attempting to close circuit
  successThreshold: number; // Number of successes needed to close from half-open
  monitoringPeriod: number; // Time window for failure counting
  maxRequests: number; // Max requests in half-open state
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  failureRate: number;
  lastFailureTime?: string;
  lastSuccessTime?: string;
  stateChangeTime: string;
  stateDuration: number;
  halfOpenRequests: number;
}

export interface CircuitBreakerOptions {
  config?: Partial<CircuitBreakerConfig>;
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  onFailure?: (error: Error, metrics: CircuitBreakerMetrics) => void;
  onSuccess?: (metrics: CircuitBreakerMetrics) => void;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalRequests: number = 0;
  private halfOpenRequests: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private stateChangeTime: Date = new Date();
  private failureWindow: Date[] = [];
  private config: CircuitBreakerConfig;
  private options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions = {}) {
    this.config = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      successThreshold: 3,
      monitoringPeriod: 300000, // 5 minutes
      maxRequests: 3,
      ...options.config,
    };
    this.options = options;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.setState(CircuitState.HALF_OPEN);
      } else {
        if (fallback) {
          return await fallback();
        }
        throw new Error('Circuit breaker is OPEN - operation not allowed');
      }
    }

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenRequests >= this.config.maxRequests) {
        if (fallback) {
          return await fallback();
        }
        throw new Error('Circuit breaker is HALF_OPEN - max requests exceeded');
      }
      this.halfOpenRequests++;
    }

    try {
      this.totalRequests++;
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Check if circuit breaker allows requests
   */
  canExecute(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      return this.shouldAttemptReset();
    }

    if (this.state === CircuitState.HALF_OPEN) {
      return this.halfOpenRequests < this.config.maxRequests;
    }

    return false;
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const now = new Date();
    const stateDuration = now.getTime() - this.stateChangeTime.getTime();
    const failureRate =
      this.totalRequests > 0 ? this.failureCount / this.totalRequests : 0;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      failureRate: Math.round(failureRate * 100) / 100,
      ...(this.lastFailureTime && {
        lastFailureTime: this.lastFailureTime.toISOString(),
      }),
      ...(this.lastSuccessTime && {
        lastSuccessTime: this.lastSuccessTime.toISOString(),
      }),
      stateChangeTime: this.stateChangeTime.toISOString(),
      stateDuration,
      halfOpenRequests: this.halfOpenRequests,
    };
  }

  /**
   * Reset circuit breaker to CLOSED state
   */
  reset(): void {
    this.setState(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenRequests = 0;
    this.failureWindow = [];
  }

  /**
   * Manually open the circuit
   */
  open(): void {
    this.setState(CircuitState.OPEN);
  }

  /**
   * Manually close the circuit
   */
  close(): void {
    this.setState(CircuitState.CLOSED);
  }

  /**
   * Check if circuit should attempt reset from OPEN to HALF_OPEN
   */
  private shouldAttemptReset(): boolean {
    if (this.state !== CircuitState.OPEN) {
      return false;
    }

    const now = new Date();
    const timeSinceLastFailure = this.lastFailureTime
      ? now.getTime() - this.lastFailureTime.getTime()
      : Infinity;

    return timeSinceLastFailure >= this.config.timeout;
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.setState(CircuitState.CLOSED);
      }
    }

    // Clean up old failures from monitoring window
    this.cleanupFailureWindow();

    if (this.options.onSuccess) {
      this.options.onSuccess(this.getMetrics());
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.failureWindow.push(this.lastFailureTime);

    // Clean up old failures from monitoring window
    this.cleanupFailureWindow();

    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.setState(CircuitState.OPEN);
    }

    if (this.options.onFailure) {
      this.options.onFailure(error, this.getMetrics());
    }
  }

  /**
   * Check if circuit should be opened
   */
  private shouldOpenCircuit(): boolean {
    if (this.state === CircuitState.OPEN) {
      return false;
    }

    // Count failures in the monitoring window
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.monitoringPeriod);
    const recentFailures = this.failureWindow.filter(
      failureTime => failureTime >= windowStart
    ).length;

    return recentFailures >= this.config.failureThreshold;
  }

  /**
   * Clean up old failures from monitoring window
   */
  private cleanupFailureWindow(): void {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.monitoringPeriod);
    this.failureWindow = this.failureWindow.filter(
      failureTime => failureTime >= windowStart
    );
  }

  /**
   * Set circuit breaker state
   */
  private setState(newState: CircuitState): void {
    if (this.state === newState) {
      return;
    }

    const previousState = this.state;
    this.state = newState;
    this.stateChangeTime = new Date();

    // Reset counters when changing states
    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      this.halfOpenRequests = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
      this.halfOpenRequests = 0;
    }

    if (this.options.onStateChange) {
      this.options.onStateChange(previousState, newState);
    }

    this.logStateChange(previousState, newState);
  }

  /**
   * Log state changes
   */
  private logStateChange(from: CircuitState, to: CircuitState): void {
    const metrics = this.getMetrics();
    console.log(`[CircuitBreaker] State changed: ${from} → ${to}`, {
      failureCount: metrics.failureCount,
      successCount: metrics.successCount,
      totalRequests: metrics.totalRequests,
      failureRate: metrics.failureRate,
      stateDuration: metrics.stateDuration,
    });
  }
}

/**
 * Circuit breaker factory for common configurations
 */
export class CircuitBreakerFactory {
  /**
   * Create a circuit breaker for API calls
   */
  static createForAPI(
    options: Partial<CircuitBreakerOptions> = {}
  ): CircuitBreaker {
    return new CircuitBreaker({
      config: {
        failureThreshold: 5,
        timeout: 60000, // 1 minute
        successThreshold: 3,
        monitoringPeriod: 300000, // 5 minutes
        maxRequests: 3,
      },
      ...options,
    });
  }

  /**
   * Create a circuit breaker for database operations
   */
  static createForDatabase(
    options: Partial<CircuitBreakerOptions> = {}
  ): CircuitBreaker {
    return new CircuitBreaker({
      config: {
        failureThreshold: 3,
        timeout: 30000, // 30 seconds
        successThreshold: 2,
        monitoringPeriod: 180000, // 3 minutes
        maxRequests: 2,
      },
      ...options,
    });
  }

  /**
   * Create a circuit breaker for external services
   */
  static createForExternalService(
    options: Partial<CircuitBreakerOptions> = {}
  ): CircuitBreaker {
    return new CircuitBreaker({
      config: {
        failureThreshold: 10,
        timeout: 120000, // 2 minutes
        successThreshold: 5,
        monitoringPeriod: 600000, // 10 minutes
        maxRequests: 5,
      },
      ...options,
    });
  }
}
