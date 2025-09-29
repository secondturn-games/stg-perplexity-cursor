/**
 * BGG API Optimizer
 * Intelligent API usage patterns and rate limiting optimizations
 */

import { BGGAPIClient } from '../BGGAPIClient';
import { BGGError } from '@/types/bgg.types';

export interface APIOptimizationConfig {
  adaptiveRateLimit: boolean;
  predictiveCaching: boolean;
  batchOptimization: boolean;
  fallbackStrategy: 'cache' | 'skip' | 'retry';
}

export interface APIUsageMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rateLimitHits: number;
  cacheHitRate: number;
}

export class BGGAPIOptimizer {
  private apiClient: BGGAPIClient;
  private config: APIOptimizationConfig;
  private metrics: APIUsageMetrics;
  private requestHistory: Array<{
    timestamp: number;
    endpoint: string;
    success: boolean;
    responseTime: number;
    rateLimited: boolean;
  }> = [];

  constructor(apiClient: BGGAPIClient, config: APIOptimizationConfig) {
    this.apiClient = apiClient;
    this.config = config;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0,
      cacheHitRate: 0,
    };
  }

  /**
   * Optimized search with intelligent batching
   */
  async optimizedSearch(
    queries: string[],
    gameTypes: string[] = ['boardgame', 'boardgameexpansion']
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    // Group queries by type to minimize API calls
    const queryGroups = this.groupQueriesByType(queries, gameTypes);

    for (const [gameType, typeQueries] of queryGroups.entries()) {
      try {
        // Process queries in batches to respect rate limits
        const batchResults = await this.processBatchQueries(
          typeQueries,
          gameType
        );

        // Merge results
        for (const [query, result] of batchResults.entries()) {
          results.set(query, result);
        }
      } catch (error) {
        console.warn(`Failed to process ${gameType} queries:`, error);
        // Continue with other types
      }
    }

    return results;
  }

  /**
   * Intelligent rate limiting with adaptive backoff
   */
  async adaptiveRequest<T>(
    requestFn: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<T> {
    const startTime = Date.now();
    let rateLimited = false;

    try {
      // Check if we should throttle based on recent history
      if (this.shouldThrottle()) {
        const delay = this.calculateThrottleDelay();
        console.log(`⏳ Throttling ${context} request by ${delay}ms`);
        await this.delay(delay);
      }

      const result = await requestFn();
      const responseTime = Date.now() - startTime;

      // Record successful request
      this.recordRequest({
        timestamp: Date.now(),
        endpoint: context,
        success: true,
        responseTime,
        rateLimited: false,
      });

      this.updateMetrics(true, responseTime, false);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Check if it's a rate limit error
      if (this.isRateLimitError(error)) {
        rateLimited = true;
        this.updateMetrics(false, responseTime, true);

        // Implement exponential backoff
        const backoffDelay = this.calculateBackoffDelay();
        console.log(
          `🔄 Rate limited on ${context}, backing off ${backoffDelay}ms`
        );
        await this.delay(backoffDelay);

        // Retry once with backoff
        try {
          const result = await requestFn();
          this.updateMetrics(true, Date.now() - startTime, false);
          return result;
        } catch (retryError) {
          this.updateMetrics(false, Date.now() - startTime, true);
          throw retryError;
        }
      } else {
        this.updateMetrics(false, responseTime, false);
        throw error;
      }
    }
  }

  /**
   * Predictive caching for likely requests
   */
  async predictiveCacheWarming(popularTerms: string[]): Promise<void> {
    console.log('🔮 Starting predictive cache warming...');

    // Warm cache for popular search terms during low-traffic periods
    const currentHour = new Date().getHours();
    const isLowTraffic = currentHour < 6 || currentHour > 22; // Night hours

    if (!isLowTraffic) {
      console.log('⏸️ Skipping predictive warming during peak hours');
      return;
    }

    for (const term of popularTerms.slice(0, 20)) {
      // Limit to top 20
      try {
        await this.adaptiveRequest(
          () => this.apiClient.searchGames(term, false, 'all'),
          `predictive-warm-${term}`
        );

        // Small delay between requests
        await this.delay(1000);
      } catch (error) {
        console.warn(`Failed to warm cache for ${term}:`, error);
      }
    }
  }

  /**
   * Batch game details requests efficiently
   */
  async batchGameDetails(gameIds: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const batchSize = 5; // BGG can handle small batches

    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batch = gameIds.slice(i, i + batchSize);

      try {
        // Process batch concurrently but with rate limiting
        const batchPromises = batch.map(gameId =>
          this.adaptiveRequest(
            () => this.apiClient.getGameDetails(gameId),
            `batch-details-${gameId}`
          )
        );

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          const gameId = batch[index];
          if (gameId && result.status === 'fulfilled') {
            results.set(gameId, result.value);
          } else if (result.status === 'rejected') {
            console.warn(
              `Failed to get details for game ${gameId}:`,
              result.reason
            );
          }
        });

        // Delay between batches
        if (i + batchSize < gameIds.length) {
          await this.delay(2000); // 2 second delay between batches
        }
      } catch (error) {
        console.error(`Batch ${i / batchSize + 1} failed:`, error);
      }
    }

    return results;
  }

  /**
   * Get API usage metrics
   */
  getMetrics(): APIUsageMetrics & {
    recentHistory: Array<{ timestamp: number; success: boolean }>;
  } {
    return {
      ...this.metrics,
      recentHistory: this.requestHistory.slice(-100), // Last 100 requests
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0,
      cacheHitRate: 0,
    };
    this.requestHistory = [];
  }

  /**
   * Check if we should throttle requests
   */
  private shouldThrottle(): boolean {
    if (!this.config.adaptiveRateLimit) {
      return false;
    }

    const now = Date.now();
    const recentRequests = this.requestHistory.filter(
      req => now - req.timestamp < 60000 // Last minute
    );

    // If we've made more than 50 requests in the last minute, throttle
    if (recentRequests.length > 50) {
      return true;
    }

    // If recent rate limit hits, be more conservative
    const recentRateLimits = recentRequests.filter(req => req.rateLimited);
    if (recentRateLimits.length > 2) {
      return true;
    }

    return false;
  }

  /**
   * Calculate throttle delay based on recent activity
   */
  private calculateThrottleDelay(): number {
    const now = Date.now();
    const recentRequests = this.requestHistory.filter(
      req => now - req.timestamp < 60000
    );

    const baseDelay = 1000; // 1 second base
    const multiplier = Math.min(recentRequests.length / 10, 5); // Up to 5x delay

    return baseDelay * multiplier;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(): number {
    const recentRateLimits = this.requestHistory.filter(
      req => req.rateLimited && Date.now() - req.timestamp < 300000 // Last 5 minutes
    );

    const baseDelay = 5000; // 5 seconds base
    const multiplier = Math.pow(2, Math.min(recentRateLimits.length, 6)); // Max 64x delay

    return Math.min(baseDelay * multiplier, 300000); // Max 5 minutes
  }

  /**
   * Group queries by type to optimize API calls
   */
  private groupQueriesByType(
    queries: string[],
    gameTypes: string[]
  ): Map<string, string[]> {
    const groups = new Map<string, string[]>();

    for (const gameType of gameTypes) {
      groups.set(gameType, [...queries]); // Each type gets all queries
    }

    return groups;
  }

  /**
   * Process batch of queries for a specific game type
   */
  private async processBatchQueries(
    queries: string[],
    gameType: string
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    for (const query of queries) {
      try {
        const result = await this.adaptiveRequest(
          () => this.apiClient.searchGamesByType(query, gameType, false),
          `batch-search-${gameType}-${query}`
        );

        results.set(query, result);

        // Small delay between individual queries
        await this.delay(500);
      } catch (error) {
        console.warn(`Failed to search ${query} for ${gameType}:`, error);
      }
    }

    return results;
  }

  /**
   * Record request in history
   */
  private recordRequest(request: (typeof this.requestHistory)[0]): void {
    this.requestHistory.push(request);

    // Keep only last 1000 requests
    if (this.requestHistory.length > 1000) {
      this.requestHistory = this.requestHistory.slice(-1000);
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(
    success: boolean,
    responseTime: number,
    rateLimited: boolean
  ): void {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    if (rateLimited) {
      this.metrics.rateLimitHits++;
    }

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) +
        responseTime) /
      this.metrics.totalRequests;
  }

  /**
   * Check if error is rate limit related
   */
  private isRateLimitError(error: any): boolean {
    if (error instanceof BGGError) {
      return error.code === 'RATE_LIMIT';
    }

    if (error instanceof Error) {
      return (
        error.message.toLowerCase().includes('rate limit') ||
        error.message.toLowerCase().includes('too many requests')
      );
    }

    return false;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
