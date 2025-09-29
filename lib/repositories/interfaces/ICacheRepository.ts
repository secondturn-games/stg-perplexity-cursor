/**
 * Cache Repository Interface
 * Defines the contract for caching operations with support for TTL and statistics
 *
 * This interface abstracts caching implementations, allowing for flexible
 * cache backends (memory, Redis, etc.) while maintaining consistent behavior.
 */

/**
 * Cache statistics interface
 */
export interface CacheStats {
  /** Total number of cache entries */
  size: number;
  /** Cache hit rate as a percentage (0-100) */
  hitRate: number;
  /** Total number of cache queries performed */
  totalQueries: number;
  /** Total number of cache hits */
  totalHits: number;
  /** Total number of cache misses */
  totalMisses: number;
  /** Memory usage in bytes (if applicable) */
  memoryUsage?: number;
  /** Average query time in milliseconds */
  averageQueryTime: number;
  /** Last cleanup operation timestamp */
  lastCleanup: Date;
  /** Cache eviction count */
  evictions: number;
}

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Default time-to-live in milliseconds */
  defaultTtl?: number;
  /** Maximum cache size */
  maxSize?: number;
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;
  /** Enable statistics tracking */
  enableStats?: boolean;
}

/**
 * Generic cache repository interface
 *
 * @template T - The type of data being cached
 */
export interface ICacheRepository<T = any> {
  /**
   * Retrieve a value from the cache
   *
   * @param key - The cache key
   * @returns Promise resolving to the cached value or null if not found
   * @throws {Error} When cache operation fails
   *
   * @example
   * ```typescript
   * const cachedGame = await cache.get<Game>('game:123');
   * if (cachedGame) {
   *   console.log(`Found cached game: ${cachedGame.title}`);
   * }
   * ```
   */
  get<K = T>(key: string): Promise<K | null>;

  /**
   * Store a value in the cache
   *
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time-to-live in milliseconds (optional, uses default if not provided)
   * @returns Promise that resolves when the value is stored
   * @throws {Error} When cache operation fails
   *
   * @example
   * ```typescript
   * await cache.set('game:123', gameData, 3600000); // Cache for 1 hour
   * console.log('Game cached successfully');
   * ```
   */
  set<K = T>(key: string, value: K, ttl?: number): Promise<void>;

  /**
   * Remove a value from the cache
   *
   * @param key - The cache key to remove
   * @returns Promise that resolves when the key is removed
   * @throws {Error} When cache operation fails
   *
   * @example
   * ```typescript
   * await cache.delete('game:123');
   * console.log('Game removed from cache');
   * ```
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a key exists in the cache
   *
   * @param key - The cache key to check
   * @returns Promise resolving to true if key exists, false otherwise
   * @throws {Error} When cache operation fails
   *
   * @example
   * ```typescript
   * const exists = await cache.has('game:123');
   * if (exists) {
   *   console.log('Game is cached');
   * }
   * ```
   */
  has(key: string): Promise<boolean>;

  /**
   * Invalidate cache entries matching a pattern
   *
   * @param pattern - Pattern to match keys (supports wildcards like 'game:*')
   * @returns Promise resolving to the number of keys invalidated
   * @throws {Error} When cache operation fails
   *
   * @example
   * ```typescript
   * const invalidated = await cache.invalidate('game:*');
   * console.log(`Invalidated ${invalidated} game cache entries`);
   * ```
   */
  invalidate(pattern: string): Promise<number>;

  /**
   * Clear all cache entries
   *
   * @returns Promise that resolves when cache is cleared
   * @throws {Error} When cache operation fails
   *
   * @example
   * ```typescript
   * await cache.clear();
   * console.log('Cache cleared');
   * ```
   */
  clear(): Promise<void>;

  /**
   * Get cache statistics
   *
   * @returns Promise resolving to cache statistics
   * @throws {Error} When statistics retrieval fails
   *
   * @example
   * ```typescript
   * const stats = await cache.getStats();
   * console.log(`Cache hit rate: ${stats.hitRate}%`);
   * console.log(`Total entries: ${stats.size}`);
   * ```
   */
  getStats(): Promise<CacheStats>;

  /**
   * Get multiple values from the cache
   *
   * @param keys - Array of cache keys
   * @returns Promise resolving to object with key-value pairs
   * @throws {Error} When cache operation fails
   *
   * @example
   * ```typescript
   * const games = await cache.getMany(['game:123', 'game:456']);
   * console.log(`Retrieved ${Object.keys(games).length} games`);
   * ```
   */
  getMany<K = T>(keys: string[]): Promise<Record<string, K>>;

  /**
   * Set multiple values in the cache
   *
   * @param entries - Object with key-value pairs to cache
   * @param ttl - Time-to-live in milliseconds (applied to all entries)
   * @returns Promise that resolves when all values are stored
   * @throws {Error} When cache operation fails
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
  setMany<K = T>(entries: Record<string, K>, ttl?: number): Promise<void>;

  /**
   * Get cache entry with metadata
   *
   * @param key - The cache key
   * @returns Promise resolving to cache entry with metadata or null
   * @throws {Error} When cache operation fails
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
  getWithMetadata<K = T>(
    key: string
  ): Promise<{
    value: K;
    expiresAt: Date;
    createdAt: Date;
    hitCount: number;
  } | null>;

  /**
   * Extend the TTL of an existing cache entry
   *
   * @param key - The cache key
   * @param ttl - New time-to-live in milliseconds
   * @returns Promise resolving to true if key exists and was extended, false otherwise
   * @throws {Error} When cache operation fails
   *
   * @example
   * ```typescript
   * const extended = await cache.extendTtl('game:123', 7200000); // Extend by 2 hours
   * if (extended) {
   *   console.log('Cache entry TTL extended');
   * }
   * ```
   */
  extendTtl(key: string, ttl: number): Promise<boolean>;
}

/**
 * Memory-specific cache repository interface
 * Extends the base interface with memory-specific operations
 */
export interface IMemoryCacheRepository<T = any> extends ICacheRepository<T> {
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
  getMemoryInfo(): Promise<{
    used: number;
    total: number;
    percentage: number;
    entries: number;
  }>;

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
  forceGC(): Promise<void>;

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
  getEntriesWithMetadata<K = T>(
    pattern: string
  ): Promise<
    Array<{
      key: string;
      value: K;
      expiresAt: Date;
      createdAt: Date;
      hitCount: number;
      size: number;
    }>
  >;
}
