/**
 * Repository Pattern Exports
 * Central export point for all repository interfaces and implementations
 * 
 * This module provides a clean interface for accessing repository implementations
 * throughout the application, following the Repository pattern for data access.
 */

// Repository Interfaces
export type { IGameRepository, IExtendedGameRepository } from './interfaces/IGameRepository';
export type { 
  ICacheRepository, 
  IMemoryCacheRepository, 
  CacheStats, 
  CacheOptions 
} from './interfaces/ICacheRepository';

// Repository Implementations
export { SupabaseGameRepository } from './SupabaseGameRepository';
export { MemoryCacheRepository } from './MemoryCacheRepository';

// BGG Service with Repository Pattern
export { 
  BGGServiceWithRepositories,
  type BGGServiceConfig 
} from '../bgg/BGGServiceWithRepositories';

/**
 * Repository Factory Functions
 * Utility functions for creating repository instances with proper configuration
 */

/**
 * Create a game repository instance
 * 
 * @param options - Configuration options for the repository
 * @returns Configured game repository instance
 * 
 * @example
 * ```typescript
 * const gameRepo = createGameRepository();
 * const game = await gameRepo.findById('123');
 * ```
 */
export function createGameRepository(): IGameRepository {
  return new SupabaseGameRepository();
}

/**
 * Create a cache repository instance
 * 
 * @param options - Configuration options for the cache
 * @returns Configured cache repository instance
 * 
 * @example
 * ```typescript
 * const cacheRepo = createCacheRepository({
 *   defaultTtl: 3600000,
 *   maxSize: 1000
 * });
 * await cacheRepo.set('key', value);
 * ```
 */
export function createCacheRepository(options?: CacheOptions): ICacheRepository {
  return new MemoryCacheRepository(options);
}

/**
 * Create a BGG service with repository dependencies
 * 
 * @param options - Configuration options for the service
 * @returns Configured BGG service instance
 * 
 * @example
 * ```typescript
 * const bggService = createBGGServiceWithRepositories();
 * const results = await bggService.searchGames('Catan');
 * ```
 */
export function createBGGServiceWithRepositories(options?: Partial<BGGServiceConfig>): BGGServiceWithRepositories {
  const gameRepository = options?.gameRepository || createGameRepository();
  const cacheRepository = options?.cacheRepository || createCacheRepository();
  
  return new BGGServiceWithRepositories({
    gameRepository,
    cacheRepository,
    ...options,
  });
}

/**
 * Default repository configuration
 */
export const DEFAULT_REPOSITORY_CONFIG = {
  cache: {
    defaultTtl: 3600000, // 1 hour
    maxSize: 1000,
    cleanupInterval: 300000, // 5 minutes
    enableStats: true,
  },
  game: {
    staleThreshold: 24 * 60 * 60 * 1000, // 24 hours
  },
} as const;

/**
 * Repository health check utilities
 */
export class RepositoryHealthChecker {
  /**
   * Check the health of a game repository
   * 
   * @param repository - Game repository instance to check
   * @returns Promise resolving to health status
   */
  static async checkGameRepository(repository: IGameRepository): Promise<{
    healthy: boolean;
    error?: string;
    stats?: any;
  }> {
    try {
      const stats = await (repository as any).getStats?.();
      return {
        healthy: true,
        stats,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check the health of a cache repository
   * 
   * @param repository - Cache repository instance to check
   * @returns Promise resolving to health status
   */
  static async checkCacheRepository(repository: ICacheRepository): Promise<{
    healthy: boolean;
    error?: string;
    stats?: CacheStats;
  }> {
    try {
      const stats = await repository.getStats();
      return {
        healthy: true,
        stats,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check the health of all repositories
   * 
   * @param gameRepository - Game repository instance
   * @param cacheRepository - Cache repository instance
   * @returns Promise resolving to combined health status
   */
  static async checkAllRepositories(
    gameRepository: IGameRepository,
    cacheRepository: ICacheRepository
  ): Promise<{
    overall: boolean;
    gameRepository: any;
    cacheRepository: any;
  }> {
    const [gameHealth, cacheHealth] = await Promise.all([
      this.checkGameRepository(gameRepository),
      this.checkCacheRepository(cacheRepository),
    ]);

    return {
      overall: gameHealth.healthy && cacheHealth.healthy,
      gameRepository: gameHealth,
      cacheRepository: cacheHealth,
    };
  }
}

/**
 * Repository error types
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly repository: string,
    public readonly operation: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

/**
 * Repository validation utilities
 */
export class RepositoryValidator {
  /**
   * Validate game repository interface compliance
   * 
   * @param repository - Repository instance to validate
   * @returns True if repository implements all required methods
   */
  static validateGameRepository(repository: any): repository is IGameRepository {
    const requiredMethods = [
      'findById',
      'findByBggId',
      'search',
      'upsert',
      'bulkUpsert',
      'markStale',
    ];

    return requiredMethods.every(method => typeof repository[method] === 'function');
  }

  /**
   * Validate cache repository interface compliance
   * 
   * @param repository - Repository instance to validate
   * @returns True if repository implements all required methods
   */
  static validateCacheRepository(repository: any): repository is ICacheRepository {
    const requiredMethods = [
      'get',
      'set',
      'delete',
      'has',
      'invalidate',
      'clear',
      'getStats',
    ];

    return requiredMethods.every(method => typeof repository[method] === 'function');
  }
}