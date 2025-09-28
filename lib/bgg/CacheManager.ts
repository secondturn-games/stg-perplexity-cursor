/**
 * Cache Manager
 * Handles caching logic and adaptive TTL
 */

import { BGGCacheEntry, BGGConfig } from '@/types/bgg.types';

export class CacheManager {
  private cache: Map<string, BGGCacheEntry> = new Map();
  private config: BGGConfig;
  private cacheStats = {
    totalQueries: 0,
    totalHits: 0,
    totalMisses: 0,
    queryTimes: [] as number[],
    lastCleanup: new Date(),
  };

  constructor(config: BGGConfig) {
    this.config = config;
    this.startCacheCleanup();
  }

  /**
   * Get item from cache
   */
  get(key: string): any | null {
    this.cacheStats.totalQueries++;

    const entry = this.cache.get(key);
    if (!entry) {
      this.cacheStats.totalMisses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.cacheStats.totalMisses++;
      return null;
    }

    this.cacheStats.totalHits++;
    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: any, customTTL?: number): void {
    // Implement LRU cache eviction
    if (this.cache.size >= this.config.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Calculate adaptive TTL based on performance
    const ttl = customTTL || this.calculateAdaptiveTTL(key, data);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Calculate adaptive TTL based on search performance and data characteristics
   */
  private calculateAdaptiveTTL(key: string, data: any): number {
    const baseTTL = this.config.cache.ttl;

    // Performance-based adjustments
    let multiplier = 1.0;

    // If this is a search result, adjust based on result quality
    if (key.startsWith('search:')) {
      const searchData = data as any;

      // More results = longer cache (likely more comprehensive)
      if (searchData.items && searchData.items.length > 10) {
        multiplier *= 1.5;
      }

      // Exact search results = longer cache (more precise)
      if (searchData.searchStrategy === 'exact') {
        multiplier *= 1.3;
      }

      // High search scores = longer cache (better quality results)
      if (searchData.items && searchData.items.length > 0) {
        const avgScore =
          searchData.items.reduce(
            (sum: number, item: any) => sum + (item.searchScore || 0),
            0
          ) / searchData.items.length;
        if (avgScore > 70) {
          multiplier *= 1.2;
        }
      }
    }

    // Game details = longer cache (rarely change)
    if (key.startsWith('game:')) {
      multiplier *= 2.0;
    }

    // Collection data = shorter cache (changes more frequently)
    if (key.startsWith('collection:')) {
      multiplier *= 0.5;
    }

    // Recent performance adjustment
    if (this.cacheStats.queryTimes.length > 0) {
      const avgQueryTime =
        this.cacheStats.queryTimes.reduce((a, b) => a + b, 0) /
        this.cacheStats.queryTimes.length;

      // Fast queries = longer cache (good performance)
      if (avgQueryTime < 1000) {
        multiplier *= 1.2;
      }
      // Slow queries = shorter cache (might need fresher data)
      else if (avgQueryTime > 3000) {
        multiplier *= 0.8;
      }
    }

    // Cache hit rate adjustment
    if (this.cacheStats.totalQueries > 0) {
      const hitRate = this.cacheStats.totalHits / this.cacheStats.totalQueries;

      // High hit rate = longer cache (working well)
      if (hitRate > 0.7) {
        multiplier *= 1.1;
      }
      // Low hit rate = shorter cache (might be stale)
      else if (hitRate < 0.3) {
        multiplier *= 0.9;
      }
    }

    // Apply bounds to prevent extreme values
    multiplier = Math.max(0.1, Math.min(3.0, multiplier));

    const adaptiveTTL = Math.round(baseTTL * multiplier);

    if (this.config.debug.enabled) {
      console.log(
        `🔄 Adaptive TTL for ${key}: ${baseTTL}ms -> ${adaptiveTTL}ms (${multiplier.toFixed(2)}x)`
      );
    }

    return adaptiveTTL;
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache();
    }, this.config.cache.cleanupInterval);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0 && this.config.debug.enabled) {
      console.log(`🧹 Cache cleanup: removed ${cleanedCount} expired entries`);
    }

    this.cacheStats.lastCleanup = new Date();
  }

  /**
   * Record performance metrics
   */
  recordPerformance(queryTime: number): void {
    this.cacheStats.queryTimes.push(queryTime);

    // Keep only last 100 query times
    if (this.cacheStats.queryTimes.length > 100) {
      this.cacheStats.queryTimes = this.cacheStats.queryTimes.slice(-100);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const averageQueryTime =
      this.cacheStats.queryTimes.length > 0
        ? this.cacheStats.queryTimes.reduce((a, b) => a + b, 0) /
          this.cacheStats.queryTimes.length
        : 0;

    return {
      totalQueries: this.cacheStats.totalQueries,
      totalHits: this.cacheStats.totalHits,
      totalMisses: this.cacheStats.totalMisses,
      hitRate:
        this.cacheStats.totalQueries > 0
          ? (this.cacheStats.totalHits / this.cacheStats.totalQueries) * 100
          : 0,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      lastCleanup: this.cacheStats.lastCleanup,
    };
  }

  /**
   * Get adaptive cache statistics
   */
  getAdaptiveCacheStats(): {
    averageTTL: number;
    ttlMultiplier: number;
    cacheAge: number;
    adaptiveEntries: number;
  } {
    const now = Date.now();
    let totalTTL = 0;
    let adaptiveEntries = 0;
    let oldestEntry = now;

    for (const [key, entry] of this.cache.entries()) {
      totalTTL += entry.ttl;
      adaptiveEntries++;
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
    }

    const averageTTL = adaptiveEntries > 0 ? totalTTL / adaptiveEntries : 0;
    const ttlMultiplier = averageTTL / this.config.cache.ttl;
    const cacheAge = now - oldestEntry;

    return {
      averageTTL: Math.round(averageTTL),
      ttlMultiplier: Math.round(ttlMultiplier * 100) / 100,
      cacheAge: Math.round(cacheAge),
      adaptiveEntries,
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.cacheStats = {
      totalQueries: 0,
      totalHits: 0,
      totalMisses: 0,
      queryTimes: [],
      lastCleanup: new Date(),
    };
  }

  /**
   * Clear cache for specific pattern
   */
  clearPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
