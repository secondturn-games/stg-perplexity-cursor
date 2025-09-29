/**
 * Game Cache Handler
 * Handles cache invalidation, updates, and optimization
 */

import { EventHandler } from '../EventBus';
import {
  BGGEvent,
  GameCachedEvent,
  CacheHitEvent,
  CacheMissEvent,
  CacheEvictedEvent,
  GameSearchedEvent,
  GameDetailsFetchedEvent,
} from '../BGGEvents';

export class GameCacheHandler {
  private cacheStats: Map<
    string,
    {
      hits: number;
      misses: number;
      lastAccess: string;
      size: number;
    }
  > = new Map();

  private evictionHistory: Array<{
    cacheKey: string;
    reason: string;
    timestamp: string;
    age: number;
  }> = [];

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Cache events
    this.handleGameCached = this.handleGameCached.bind(this);
    this.handleCacheHit = this.handleCacheHit.bind(this);
    this.handleCacheMiss = this.handleCacheMiss.bind(this);
    this.handleCacheEvicted = this.handleCacheEvicted.bind(this);

    // BGG service events
    this.handleGameSearched = this.handleGameSearched.bind(this);
    this.handleGameDetailsFetched = this.handleGameDetailsFetched.bind(this);
  }

  /**
   * Handle game cached events
   */
  handleGameCached: EventHandler<GameCachedEvent> = async event => {
    try {
      const { cacheKey, dataType, gameId, query, ttl, size } = event.data;

      // Track cache entry
      this.trackCacheEntry(cacheKey, dataType, size);

      // Log cache operation
      this.logCacheOperation('cached', {
        cacheKey,
        dataType,
        gameId,
        query: this.sanitizeQuery(query),
        ttl,
        size,
        timestamp: event.timestamp,
      });

      // Update cache statistics
      this.updateCacheStats(cacheKey, 'cached');
    } catch (error) {
      console.error(
        'GameCacheHandler: Error handling game cached event:',
        error
      );
    }
  };

  /**
   * Handle cache hit events
   */
  handleCacheHit: EventHandler<CacheHitEvent> = async event => {
    try {
      const { cacheKey, dataType, gameId, query, age } = event.data;

      // Track cache hit
      this.trackCacheHit(cacheKey, age);

      // Log cache operation
      this.logCacheOperation('hit', {
        cacheKey,
        dataType,
        gameId,
        query: this.sanitizeQuery(query),
        age,
        timestamp: event.timestamp,
      });

      // Update cache statistics
      this.updateCacheStats(cacheKey, 'hit');
    } catch (error) {
      console.error('GameCacheHandler: Error handling cache hit event:', error);
    }
  };

  /**
   * Handle cache miss events
   */
  handleCacheMiss: EventHandler<CacheMissEvent> = async event => {
    try {
      const { cacheKey, dataType, gameId, query } = event.data;

      // Track cache miss
      this.trackCacheMiss(cacheKey);

      // Log cache operation
      this.logCacheOperation('miss', {
        cacheKey,
        dataType,
        gameId,
        query: this.sanitizeQuery(query),
        timestamp: event.timestamp,
      });

      // Update cache statistics
      this.updateCacheStats(cacheKey, 'miss');
    } catch (error) {
      console.error(
        'GameCacheHandler: Error handling cache miss event:',
        error
      );
    }
  };

  /**
   * Handle cache evicted events
   */
  handleCacheEvicted: EventHandler<CacheEvictedEvent> = async event => {
    try {
      const { cacheKey, dataType, reason, age, size } = event.data;

      // Track cache eviction
      this.trackCacheEviction(cacheKey, reason, age, size);

      // Log cache operation
      this.logCacheOperation('evicted', {
        cacheKey,
        dataType,
        reason,
        age,
        size,
        timestamp: event.timestamp,
      });

      // Update cache statistics
      this.updateCacheStats(cacheKey, 'evicted');
    } catch (error) {
      console.error(
        'GameCacheHandler: Error handling cache evicted event:',
        error
      );
    }
  };

  /**
   * Handle game searched events (for cache optimization)
   */
  handleGameSearched: EventHandler<GameSearchedEvent> = async event => {
    try {
      const { query, results, performance } = event.data;

      // Analyze cache performance for this search
      this.analyzeSearchCachePerformance(query, performance);

      // Suggest cache optimizations
      this.suggestCacheOptimizations(query, results, performance);
    } catch (error) {
      console.error(
        'GameCacheHandler: Error handling game searched event:',
        error
      );
    }
  };

  /**
   * Handle game details fetched events (for cache optimization)
   */
  handleGameDetailsFetched: EventHandler<GameDetailsFetchedEvent> =
    async event => {
      try {
        const { gameId, gameName, performance } = event.data;

        // Analyze cache performance for this game details fetch
        this.analyzeGameDetailsCachePerformance(gameId, performance);

        // Update cache recommendations
        this.updateCacheRecommendations(gameId, gameName);
      } catch (error) {
        console.error(
          'GameCacheHandler: Error handling game details fetched event:',
          error
        );
      }
    };

  /**
   * Track cache entry
   */
  private trackCacheEntry(
    cacheKey: string,
    dataType: string,
    size: number
  ): void {
    this.cacheStats.set(cacheKey, {
      hits: 0,
      misses: 0,
      lastAccess: new Date().toISOString(),
      size,
    });
  }

  /**
   * Track cache hit
   */
  private trackCacheHit(cacheKey: string, age: number): void {
    const stats = this.cacheStats.get(cacheKey);
    if (stats) {
      stats.hits++;
      stats.lastAccess = new Date().toISOString();
    }
  }

  /**
   * Track cache miss
   */
  private trackCacheMiss(cacheKey: string): void {
    const stats = this.cacheStats.get(cacheKey);
    if (stats) {
      stats.misses++;
    } else {
      // Create new entry for miss
      this.cacheStats.set(cacheKey, {
        hits: 0,
        misses: 1,
        lastAccess: new Date().toISOString(),
        size: 0,
      });
    }
  }

  /**
   * Track cache eviction
   */
  private trackCacheEviction(
    cacheKey: string,
    reason: string,
    age: number,
    size: number
  ): void {
    this.evictionHistory.push({
      cacheKey,
      reason,
      timestamp: new Date().toISOString(),
      age,
    });

    // Keep only last 1000 eviction records
    if (this.evictionHistory.length > 1000) {
      this.evictionHistory = this.evictionHistory.slice(-1000);
    }

    // Remove from stats
    this.cacheStats.delete(cacheKey);
  }

  /**
   * Update cache statistics
   */
  private updateCacheStats(
    cacheKey: string,
    operation: 'cached' | 'hit' | 'miss' | 'evicted'
  ): void {
    const stats = this.cacheStats.get(cacheKey);
    if (stats) {
      stats.lastAccess = new Date().toISOString();
    }
  }

  /**
   * Analyze search cache performance
   */
  private analyzeSearchCachePerformance(query: string, performance: any): void {
    const cacheKey = `search:${query}`;
    const stats = this.cacheStats.get(cacheKey);

    if (stats) {
      const hitRate = stats.hits / (stats.hits + stats.misses);

      if (hitRate < 0.3) {
        this.logCacheOptimization('low_hit_rate', {
          cacheKey,
          hitRate: Math.round(hitRate * 100) / 100,
          suggestion: 'Consider increasing TTL or improving cache key strategy',
        });
      }
    }
  }

  /**
   * Analyze game details cache performance
   */
  private analyzeGameDetailsCachePerformance(
    gameId: string,
    performance: any
  ): void {
    const cacheKey = `game:${gameId}`;
    const stats = this.cacheStats.get(cacheKey);

    if (stats) {
      const hitRate = stats.hits / (stats.hits + stats.misses);

      if (hitRate > 0.8) {
        this.logCacheOptimization('high_hit_rate', {
          cacheKey,
          hitRate: Math.round(hitRate * 100) / 100,
          suggestion: 'Cache is performing well for this game',
        });
      }
    }
  }

  /**
   * Suggest cache optimizations
   */
  private suggestCacheOptimizations(
    query: string,
    results: any,
    performance: any
  ): void {
    // Suggest optimizations based on search patterns
    if (performance.cacheHit && performance.queryTime > 100) {
      this.logCacheOptimization('slow_cache_hit', {
        query: this.sanitizeQuery(query),
        queryTime: performance.queryTime,
        suggestion: 'Consider optimizing cache retrieval or data structure',
      });
    }

    if (!performance.cacheHit && results.itemsCount === 0) {
      this.logCacheOptimization('empty_result_caching', {
        query: this.sanitizeQuery(query),
        suggestion:
          'Consider caching empty results to avoid repeated API calls',
      });
    }
  }

  /**
   * Update cache recommendations
   */
  private updateCacheRecommendations(gameId: string, gameName: string): void {
    // Update recommendations based on game popularity
    const stats = this.cacheStats.get(`game:${gameId}`);
    if (stats && stats.hits > 5) {
      this.logCacheOptimization('popular_game', {
        gameId,
        gameName: this.sanitizeGameName(gameName),
        hits: stats.hits,
        suggestion: 'Consider extending TTL for popular games',
      });
    }
  }

  /**
   * Log cache operation
   */
  private logCacheOperation(operation: string, data: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache] ${operation}:`, data);
    }
  }

  /**
   * Log cache optimization suggestion
   */
  private logCacheOptimization(type: string, data: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache Optimization] ${type}:`, data);
    }
  }

  /**
   * Sanitize query for logging
   */
  private sanitizeQuery(query?: string): string | undefined {
    if (!query) {
      return undefined;
    }
    return query.replace(/[<>\"']/g, '').substring(0, 100);
  }

  /**
   * Sanitize game name for logging
   */
  private sanitizeGameName(name: string): string {
    return name.replace(/[<>\"']/g, '').substring(0, 100);
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    totalEntries: number;
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    averageSize: number;
    evictionCount: number;
    topEntries: Array<{
      cacheKey: string;
      hits: number;
      misses: number;
      hitRate: number;
      size: number;
    }>;
  } {
    let totalHits = 0;
    let totalMisses = 0;
    let totalSize = 0;
    const entries: Array<{
      cacheKey: string;
      hits: number;
      misses: number;
      hitRate: number;
      size: number;
    }> = [];

    for (const [cacheKey, stats] of this.cacheStats.entries()) {
      totalHits += stats.hits;
      totalMisses += stats.misses;
      totalSize += stats.size;

      const hitRate = stats.hits / (stats.hits + stats.misses);
      entries.push({
        cacheKey,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: Math.round(hitRate * 100) / 100,
        size: stats.size,
      });
    }

    const hitRate =
      totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;
    const averageSize =
      this.cacheStats.size > 0 ? totalSize / this.cacheStats.size : 0;

    // Sort by hit rate and take top 20
    const topEntries = entries
      .sort((a, b) => b.hitRate - a.hitRate)
      .slice(0, 20);

    return {
      totalEntries: this.cacheStats.size,
      totalHits,
      totalMisses,
      hitRate: Math.round(hitRate * 100) / 100,
      averageSize: Math.round(averageSize * 100) / 100,
      evictionCount: this.evictionHistory.length,
      topEntries,
    };
  }

  /**
   * Get eviction history
   */
  getEvictionHistory(): Array<{
    cacheKey: string;
    reason: string;
    timestamp: string;
    age: number;
  }> {
    return [...this.evictionHistory].reverse().slice(0, 100); // Last 100 evictions
  }

  /**
   * Clear cache statistics
   */
  clearStatistics(): void {
    this.cacheStats.clear();
    this.evictionHistory = [];
  }
}

// Export singleton instance
export const gameCacheHandler = new GameCacheHandler();
