/**
 * BGG API Integration Exports
 * Central export point for all BGG-related utilities
 */

// BGG API functions with loading state integration
export {
  searchGamesWithLoading,
  getGameDetailsWithLoading,
  getUserCollectionWithLoading,
  batchUpdateGamesWithLoading,
  checkBGGHealthWithLoading,
  getTrendingGamesWithLoading,
  getHotGamesWithLoading,
  type BGGLoadingOptions,
} from './api-with-loading';

// Core BGG services (legacy)
export { BGGAPIClient } from './BGGAPIClient';
export { BGGService } from './BGGService';
export * as BGGServiceFactory from './BGGServiceFactory';
export { BGGServiceOptimized } from './BGGServiceOptimized';
export { BGGServiceWithRepositories } from './BGGServiceWithRepositories';

// Cache management
export { CacheManager } from './CacheManager';

// Search engine
export { SearchEngine } from './SearchEngine';

// Configuration
export * from './config';

// Optimizations
export * from './optimizations/index';
