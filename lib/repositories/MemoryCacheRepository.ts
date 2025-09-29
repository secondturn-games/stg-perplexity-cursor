/**
 * Memory Cache Repository Implementation
 * In-memory cache implementation using Map with TTL support and statistics
 * 
 * This implementation provides fast in-memory caching with automatic cleanup,
 * hit/miss tracking, and comprehensive statistics for monitoring cache performance.
 */

import type { IMemoryCacheRepository, CacheStats, CacheOptions } from './interfaces/ICacheRepository';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: Date;
  createdAt: Date;
  hitCount: number;
  ttl: number;
}

/**
 * Memory cache repository implementation
 * 
 * @template T - The type of data being cached
 * 
 * @example
 * ```typescript
 * const cache = new MemoryCacheRepository<Game>({
 *   defaultTtl: 3600000, // 1 hour
 *   maxSize: 1000,
 *   enableStats: true
 * });
 * 
 * await cache.set('game:123', gameData);
 * const cached = await cache.get('game:123');
 * ```
 */
export class MemoryCacheRepository<T = any> implements IMemoryCacheRepository<T> {
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly stats: CacheStats;
  private cleanupInterval?: NodeJS.Timeout;
  private readonly options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      defaultTtl: options.defaultTtl || 3600000, // 1 hour default
      maxSize: options.maxSize || 1000,
      cleanupInterval: options.cleanupInterval || 300000, // 5 minutes
      enableStats: options.enableStats !== false,
    };

    this.stats = {
      size: 0,
      hitRate: 0,
      totalQueries: 0,
      totalHits: 0,
      totalMisses: 0,
      memoryUsage: 0,
      averageQueryTime: 0,
      lastCleanup: new Date(),
      evictions: 0,
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Retrieve a value from the cache
   * 
   * @param key - The cache key
   * @returns Promise resolving to the cached value or null if not found/expired
   * 
   * @example
   * ```typescript
   * const cachedGame = await cache.get<Game>('game:123');
   * if (cachedGame) {
   *   console.log(`Found cached game: ${cachedGame.title}`);
   * }
   * ```
   */
  async get<K = T>(key: string): Promise<K | null> {
    const startTime = Date.now();
    
    try {
      this.stats.totalQueries++;
      
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.stats.totalMisses++;
        this.updateHitRate();
        return null;
      }

      // Check if entry has expired
      if (entry.expiresAt <= new Date()) {
        this.cache.delete(key);
        this.stats.totalMisses++;
        this.stats.evictions++;
        this.updateHitRate();
        this.updateStats();
        return null;
      }

      // Entry is valid, increment hit count
      entry.hitCount++;
      this.stats.totalHits++;
      this.updateHitRate();
      this.updateQueryTime(Date.now() - startTime);
      
      return entry.value as K;
    } catch (error) {
      this.stats.totalMisses++;
      this.updateHitRate();
      throw new Error(`Cache get error for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store a value in the cache
   * 
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time-to-live in milliseconds (optional, uses default if not provided)
   * @returns Promise that resolves when the value is stored
   * 
   * @example
   * ```typescript
   * await cache.set('game:123', gameData, 3600000); // Cache for 1 hour
   * console.log('Game cached successfully');
   * ```
   */
  async set<K = T>(key: string, value: K, ttl?: number): Promise<void> {
    try {
      const now = new Date();
      const actualTtl = ttl || this.options.defaultTtl;
      const expiresAt = new Date(now.getTime() + actualTtl);

      // Check if we need to evict entries to stay within size limit
      if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
        await this.evictOldest();
      }

      const entry: CacheEntry<K> = {
        value,
        expiresAt,
        createdAt: now,
        hitCount: 0,
        ttl: actualTtl,
      };

      this.cache.set(key, entry as CacheEntry<T>);
      this.updateStats();
    } catch (error) {
      throw new Error(`Cache set error for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a value from the cache
   * 
   * @param key - The cache key to remove
   * @returns Promise that resolves when the key is removed
   * 
   * @example
   * ```typescript
   * await cache.delete('game:123');
   * console.log('Game removed from cache');
   * ```
   */
  async delete(key: string): Promise<void> {
    try {
      const existed = this.cache.delete(key);
      if (existed) {
        this.updateStats();
      }
    } catch (error) {
      throw new Error(`Cache delete error for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a key exists in the cache
   * 
   * @param key - The cache key to check
   * @returns Promise resolving to true if key exists and is not expired, false otherwise
   * 
   * @example
   * ```typescript
   * const exists = await cache.has('game:123');
   * if (exists) {
   *   console.log('Game is cached');
   * }
   * ```
   */
  async has(key: string): Promise<boolean> {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return false;
      }

      // Check if entry has expired
      if (entry.expiresAt <= new Date()) {
        this.cache.delete(key);
        this.stats.evictions++;
        this.updateStats();
        return false;
      }

      return true;
    } catch (error) {
      throw new Error(`Cache has error for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   * 
   * @param pattern - Pattern to match keys (supports wildcards like 'game:*')
   * @returns Promise resolving to the number of keys invalidated
   * 
   * @example
   * ```typescript
   * const invalidated = await cache.invalidate('game:*');
   * console.log(`Invalidated ${invalidated} game cache entries`);
   * ```
   */
  async invalidate(pattern: string): Promise<number> {
    try {
      let invalidated = 0;
      const regex = this.patternToRegex(pattern);

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          invalidated++;
        }
      }

      this.updateStats();
      return invalidated;
    } catch (error) {
      throw new Error(`Cache invalidate error for pattern ${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all cache entries
   * 
   * @returns Promise that resolves when cache is cleared
   * 
   * @example
   * ```typescript
   * await cache.clear();
   * console.log('Cache cleared');
   * ```
   */
  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.updateStats();
    } catch (error) {
      throw new Error(`Cache clear error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns Promise resolving to cache statistics
   * 
   * @example
   * ```typescript
   * const stats = await cache.getStats();
   * console.log(`Cache hit rate: ${stats.hitRate}%`);
   * console.log(`Total entries: ${stats.size}`);
   * ```
   */
  async getStats(): Promise<CacheStats> {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get multiple values from the cache
   * 
   * @param keys - Array of cache keys
   * @returns Promise resolving to object with key-value pairs
   * 
   * @example
   * ```typescript
   * const games = await cache.getMany(['game:123', 'game:456']);
   * console.log(`Retrieved ${Object.keys(games).length} games`);
   * ```
   */
  async getMany<K = T>(keys: string[]): Promise<Record<string, K>> {
    try {
      const results: Record<string, K> = {};
      
      for (const key of keys) {
        const value = await this.get<K>(key);
        if (value !== null) {
          results[key] = value;
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Cache getMany error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set multiple values in the cache
   * 
   * @param entries - Object with key-value pairs to cache
   * @param ttl - Time-to-live in milliseconds (applied to all entries)
   * @returns Promise that resolves when all values are stored
   * 
   * @example
   * ```typescript
   * await cache.setMany({
   *   'game:123': game1,
   *   'game:456': game2
   * }, 3600000);
   * console.log('Multiple games cached');
   * ```
   */
  async setMany<K = T>(entries: Record<string, K>, ttl?: number): Promise<void> {
    try {
      const promises = Object.entries(entries).map(([key, value]) => 
        this.set(key, value, ttl)
      );

      await Promise.all(promises);
    } catch (error) {
      throw new Error(`Cache setMany error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cache entry with metadata
   * 
   * @param key - The cache key
   * @returns Promise resolving to cache entry with metadata or null
   * 
   * @example
   * ```typescript
   * const entry = await cache.getWithMetadata('game:123');
   * if (entry) {
   *   console.log(`Value: ${entry.value}`);
   *   console.log(`Expires at: ${entry.expiresAt}`);
   * }
   * ```
   */
  async getWithMetadata<K = T>(key: string): Promise<{
    value: K;
    expiresAt: Date;
    createdAt: Date;
    hitCount: number;
  } | null> {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return null;
      }

      // Check if entry has expired
      if (entry.expiresAt <= new Date()) {
        this.cache.delete(key);
        this.stats.evictions++;
        this.updateStats();
        return null;
      }

      return {
        value: entry.value as K,
        expiresAt: entry.expiresAt,
        createdAt: entry.createdAt,
        hitCount: entry.hitCount,
      };
    } catch (error) {
      throw new Error(`Cache getWithMetadata error for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extend the TTL of an existing cache entry
   * 
   * @param key - The cache key
   * @param ttl - New time-to-live in milliseconds
   * @returns Promise resolving to true if key exists and was extended, false otherwise
   * 
   * @example
   * ```typescript
   * const extended = await cache.extendTtl('game:123', 7200000); // Extend by 2 hours
   * if (extended) {
   *   console.log('Cache entry TTL extended');
   * }
   * ```
   */
  async extendTtl(key: string, ttl: number): Promise<boolean> {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return false;
      }

      // Check if entry has expired
      if (entry.expiresAt <= new Date()) {
        this.cache.delete(key);
        this.stats.evictions++;
        this.updateStats();
        return false;
      }

      // Extend TTL
      entry.expiresAt = new Date(entry.expiresAt.getTime() + ttl);
      entry.ttl = ttl;
      
      return true;
    } catch (error) {
      throw new Error(`Cache extendTtl error for key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get memory usage information
   * 
   * @returns Promise resolving to memory usage details
   * 
   * @example
   * ```typescript
   * const memoryInfo = await memoryCache.getMemoryInfo();
   * console.log(`Memory usage: ${memoryInfo.used}MB / ${memoryInfo.total}MB`);
   * ```
   */
  async getMemoryInfo(): Promise<{
    used: number;
    total: number;
    percentage: number;
    entries: number;
  }> {
    try {
      const used = process.memoryUsage().heapUsed;
      const total = process.memoryUsage().heapTotal;
      const percentage = (used / total) * 100;

      return {
        used: Math.round(used / 1024 / 1024 * 100) / 100, // MB
        total: Math.round(total / 1024 / 1024 * 100) / 100, // MB
        percentage: Math.round(percentage * 100) / 100,
        entries: this.cache.size,
      };
    } catch (error) {
      throw new Error(`Memory info error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Force garbage collection (if supported by the runtime)
   * 
   * @returns Promise that resolves when GC is complete
   * 
   * @example
   * ```typescript
   * await memoryCache.forceGC();
   * console.log('Garbage collection completed');
   * ```
   */
  async forceGC(): Promise<void> {
    try {
      if (global.gc && typeof global.gc === 'function') {
        global.gc();
      } else {
        console.warn('Garbage collection is not available. Run Node.js with --expose-gc flag.');
      }
    } catch (error) {
      throw new Error(`Force GC error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cache entries by pattern with metadata
   * 
   * @param pattern - Pattern to match keys
   * @returns Promise resolving to array of cache entries with metadata
   * 
   * @example
   * ```typescript
   * const gameEntries = await memoryCache.getEntriesWithMetadata('game:*');
   * console.log(`Found ${gameEntries.length} game cache entries`);
   * ```
   */
  async getEntriesWithMetadata<K = T>(pattern: string): Promise<Array<{
    key: string;
    value: K;
    expiresAt: Date;
    createdAt: Date;
    hitCount: number;
    size: number;
  }>> {
    try {
      const regex = this.patternToRegex(pattern);
      const results: Array<{
        key: string;
        value: K;
        expiresAt: Date;
        createdAt: Date;
        hitCount: number;
        size: number;
      }> = [];

      for (const [key, entry] of this.cache.entries()) {
        if (regex.test(key)) {
          // Check if entry has expired
          if (entry.expiresAt <= new Date()) {
            this.cache.delete(key);
            this.stats.evictions++;
            continue;
          }

          results.push({
            key,
            value: entry.value as K,
            expiresAt: entry.expiresAt,
            createdAt: entry.createdAt,
            hitCount: entry.hitCount,
            size: JSON.stringify(entry.value).length,
          });
        }
      }

      this.updateStats();
      return results;
    } catch (error) {
      throw new Error(`Get entries with metadata error for pattern ${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start the cleanup interval
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    try {
      const now = new Date();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt <= now) {
          this.cache.delete(key);
          cleaned++;
          this.stats.evictions++;
        }
      }

      if (cleaned > 0) {
        this.stats.lastCleanup = new Date();
        this.updateStats();
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Evict the oldest entry (LRU-style eviction)
   */
  private async evictOldest(): Promise<void> {
    try {
      let oldestKey: string | null = null;
      let oldestTime = new Date();

      for (const [key, entry] of this.cache.entries()) {
        if (entry.createdAt < oldestTime) {
          oldestTime = entry.createdAt;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    } catch (error) {
      console.error('Cache eviction error:', error);
    }
  }

  /**
   * Convert pattern string to regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = escaped.replace(/\\\*/g, '.*').replace(/\\\?/g, '.');
    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    if (this.stats.totalQueries > 0) {
      this.stats.hitRate = Math.round((this.stats.totalHits / this.stats.totalQueries) * 100 * 100) / 100;
    }
  }

  /**
   * Update query time statistics
   */
  private updateQueryTime(queryTime: number): void {
    if (this.stats.totalQueries === 1) {
      this.stats.averageQueryTime = queryTime;
    } else {
      this.stats.averageQueryTime = (this.stats.averageQueryTime + queryTime) / 2;
    }
  }

  /**
   * Update general statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = this.calculateMemoryUsage();
  }

  /**
   * Calculate approximate memory usage
   */
  private calculateMemoryUsage(): number {
    try {
      let totalSize = 0;
      
      for (const [key, entry] of this.cache.entries()) {
        totalSize += key.length * 2; // UTF-16 string
        totalSize += JSON.stringify(entry.value).length * 2;
        totalSize += 64; // Approximate overhead for entry object
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Cleanup resources when the cache is destroyed
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.cache.clear();
  }
}

// Extend global to include gc function for TypeScript
declare global {
  var gc: (() => void) | undefined;
}