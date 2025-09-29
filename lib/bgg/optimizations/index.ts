/**
 * BGG Optimizations
 * Centralized exports for all BGG optimization modules
 */

export { BGGCacheOptimizer } from './BGGCacheOptimizer';
export { BGGDatabaseOptimizer } from './BGGDatabaseOptimizer';
export { BGGAPIOptimizer } from './BGGAPIOptimizer';
export { BGGServiceOptimized } from '../BGGServiceOptimized';

export type { CacheStrategy, OptimizationConfig } from './config';

export {
  defaultOptimizationConfig,
  getOptimizationConfig,
  validateOptimizationConfig,
  getCacheStrategy,
  isOptimizationEnabled,
} from './config';

export type {
  OptimizedGameQuery,
  StaleGameQuery,
} from './BGGDatabaseOptimizer';

export type { APIOptimizationConfig, APIUsageMetrics } from './BGGAPIOptimizer';
