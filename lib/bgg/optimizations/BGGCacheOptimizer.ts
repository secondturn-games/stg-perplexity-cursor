/**
 * BGG Cache Optimizer
 * Intelligent caching strategies for different BGG operations
 */

import { CacheManager } from '../CacheManager';
import { BGGSearchResponse, BGGGameDetails } from '@/types/bgg.types';

export interface CacheStrategy {
  ttl: number;
  maxSize: number;
  priority: 'low' | 'normal' | 'high';
  preload: boolean;
}

export class BGGCacheOptimizer {
  private cacheManager: CacheManager;
  private strategies: Map<string, CacheStrategy> = new Map();

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
    this.initializeStrategies();
  }

  /**
   * Initialize cache strategies for different operation types
   */
  private initializeStrategies(): void {
    // Search results - moderate TTL, high priority for popular searches
    this.strategies.set('search', {
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 1000,
      priority: 'high',
      preload: true,
    });

    // Game details - longer TTL, high priority
    this.strategies.set('game-details', {
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      maxSize: 5000,
      priority: 'high',
      preload: true,
    });

    // User collections - shorter TTL, normal priority
    this.strategies.set('collection', {
      ttl: 15 * 60 * 1000, // 15 minutes
      maxSize: 500,
      priority: 'normal',
      preload: false,
    });

    // Cache statistics - short TTL, low priority
    this.strategies.set('stats', {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      priority: 'low',
      preload: false,
    });
  }

  /**
   * Get cache key with strategy-specific formatting
   */
  getCacheKey(operation: string, identifier: string, filters?: any): string {
    const strategy = this.strategies.get(operation);
    if (!strategy) {
      return `${operation}:${identifier}`;
    }

    // Add filter hash for search operations
    if (operation === 'search' && filters) {
      const filterHash = this.hashFilters(filters);
      return `${operation}:${identifier}:${filterHash}`;
    }

    return `${operation}:${identifier}`;
  }

  /**
   * Cache data with operation-specific strategy
   */
  cacheData<T>(
    operation: string,
    identifier: string,
    data: T,
    filters?: any
  ): void {
    const strategy = this.strategies.get(operation);
    if (!strategy) {
      this.cacheManager.set(`${operation}:${identifier}`, data);
      return;
    }

    const cacheKey = this.getCacheKey(operation, identifier, filters);
    this.cacheManager.set(cacheKey, data, strategy.ttl);
  }

  /**
   * Get cached data with operation-specific strategy
   */
  getCachedData<T>(
    operation: string,
    identifier: string,
    filters?: any
  ): T | null {
    const cacheKey = this.getCacheKey(operation, identifier, filters);
    return this.cacheManager.get(cacheKey);
  }

  /**
   * Intelligent cache warming for popular searches
   */
  async warmCacheForPopularSearches(): Promise<void> {
    const popularSearches = [
      'Catan',
      'Ticket to Ride',
      'Wingspan',
      'Pandemic',
      'Azul',
      'Gloomhaven',
      'Terraforming Mars',
      'Splendor',
      'Codenames',
      'Dixit',
    ];

    console.log('🔥 Warming cache for popular searches...');

    for (const searchTerm of popularSearches) {
      try {
        // Check if already cached
        const existing = this.getCachedData('search', searchTerm, {
          gameType: 'all',
        });
        if (existing) {
          continue;
        }

        // Preload with a lightweight search (would need BGGService reference)
        console.log(`🔥 Prewarming cache for: ${searchTerm}`);
        // This would be called from BGGService during cache warming
      } catch (error) {
        console.warn(`⚠️ Failed to warm cache for ${searchTerm}:`, error);
      }
    }
  }

  /**
   * Smart cache invalidation based on operation type
   */
  invalidateCache(operation: string, identifier?: string): void {
    if (identifier) {
      // Invalidate specific item
      const strategy = this.strategies.get(operation);
      if (strategy) {
        const pattern = `${operation}:${identifier}*`;
        this.cacheManager.clearPattern(pattern);
      }
    } else {
      // Invalidate all items of this operation type
      const pattern = `${operation}:*`;
      this.cacheManager.clearPattern(pattern);
    }
  }

  /**
   * Get cache performance metrics by operation type
   */
  getOperationMetrics(operation: string) {
    const strategy = this.strategies.get(operation);
    if (!strategy) {
      return null;
    }

    const stats = this.cacheManager.getCacheStats();
    return {
      operation,
      strategy,
      stats: {
        hitRate: stats.hitRate,
        totalQueries: stats.totalQueries,
        averageQueryTime: stats.averageQueryTime,
      },
    };
  }

  /**
   * Hash filters for cache key generation
   */
  private hashFilters(filters: any): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key];
        return result;
      }, {} as any);

    return Buffer.from(JSON.stringify(sortedFilters))
      .toString('base64')
      .slice(0, 8);
  }

  /**
   * Predict cache needs based on usage patterns
   */
  predictCacheNeeds(operation: string, identifier: string): boolean {
    const strategy = this.strategies.get(operation);
    if (!strategy || !strategy.preload) {
      return false;
    }

    // Simple heuristic: preload high-priority operations
    return strategy.priority === 'high';
  }

  /**
   * Get optimal cache strategy for operation
   */
  getStrategy(operation: string): CacheStrategy | null {
    return this.strategies.get(operation) || null;
  }
}
