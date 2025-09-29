/**
 * BGG Service Factory
 * Factory for creating optimized BGG services
 */

import { BGGService } from './BGGService';
import { BGGServiceOptimized } from './BGGServiceOptimized';
import { getOptimizationConfig } from './optimizations/config';

export type BGGServiceType = 'standard' | 'optimized';

/**
 * Create BGG service instance based on configuration
 */
export function createBGGService(
  type: BGGServiceType = 'optimized'
): BGGService {
  const config = getOptimizationConfig();

  switch (type) {
    case 'optimized':
      if (
        config.cache.enabled ||
        config.database.enabled ||
        config.api.adaptiveRateLimit
      ) {
        console.log('🚀 Creating optimized BGG service');
        return new BGGServiceOptimized();
      } else {
        console.log(
          '⚠️ Optimizations disabled, falling back to standard service'
        );
        return new BGGService();
      }

    case 'standard':
    default:
      console.log('📋 Creating standard BGG service');
      return new BGGService();
  }
}

/**
 * Get the recommended BGG service for production use
 */
export function getProductionBGGService(): BGGService {
  return createBGGService('optimized');
}

/**
 * Get BGG service for development/testing
 */
export function getDevelopmentBGGService(): BGGService {
  return createBGGService('standard');
}
