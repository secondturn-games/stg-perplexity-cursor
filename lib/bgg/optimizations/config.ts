/**
 * BGG Optimization Configuration
 * Centralized configuration for all optimization features
 */

export interface OptimizationConfig {
  cache: {
    enabled: boolean;
    strategies: {
      search: CacheStrategy;
      gameDetails: CacheStrategy;
      collection: CacheStrategy;
      stats: CacheStrategy;
    };
    warming: {
      enabled: boolean;
      popularSearches: string[];
      schedule: {
        enabled: boolean;
        time: string; // HH:MM format
        interval: 'daily' | 'weekly';
      };
    };
  };
  database: {
    enabled: boolean;
    searchFirst: boolean;
    batchSize: number;
    staleGameThreshold: number; // hours
    popularGameThreshold: number; // rating
  };
  api: {
    adaptiveRateLimit: boolean;
    predictiveCaching: boolean;
    batchOptimization: boolean;
    fallbackStrategy: 'cache' | 'skip' | 'retry';
    maxConcurrentRequests: number;
    requestDelay: number; // ms
  };
  performance: {
    monitoring: boolean;
    metricsRetention: number; // days
    alertThresholds: {
      responseTime: number; // ms
      errorRate: number; // percentage
      cacheHitRate: number; // percentage
    };
  };
}

export interface CacheStrategy {
  ttl: number; // milliseconds
  maxSize: number;
  priority: 'low' | 'normal' | 'high';
  preload: boolean;
  invalidation: {
    enabled: boolean;
    pattern: string;
  };
}

export const defaultOptimizationConfig: OptimizationConfig = {
  cache: {
    enabled: true,
    strategies: {
      search: {
        ttl: 30 * 60 * 1000, // 30 minutes
        maxSize: 1000,
        priority: 'high',
        preload: true,
        invalidation: {
          enabled: true,
          pattern: 'search:*',
        },
      },
      gameDetails: {
        ttl: 2 * 60 * 60 * 1000, // 2 hours
        maxSize: 5000,
        priority: 'high',
        preload: true,
        invalidation: {
          enabled: true,
          pattern: 'game-details:*',
        },
      },
      collection: {
        ttl: 15 * 60 * 1000, // 15 minutes
        maxSize: 500,
        priority: 'normal',
        preload: false,
        invalidation: {
          enabled: true,
          pattern: 'collection:*',
        },
      },
      stats: {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100,
        priority: 'low',
        preload: false,
        invalidation: {
          enabled: false,
          pattern: 'stats:*',
        },
      },
    },
    warming: {
      enabled: true,
      popularSearches: [
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
        'Settlers of Catan',
        '7 Wonders',
        'Dominion',
        'Puerto Rico',
        'Agricola',
        'Power Grid',
        'Race for the Galaxy',
        'Through the Ages',
        'Twilight Struggle',
        'The Castles of Burgundy',
      ],
      schedule: {
        enabled: true,
        time: '02:00', // 2 AM
        interval: 'daily',
      },
    },
  },
  database: {
    enabled: true,
    searchFirst: true,
    batchSize: 100,
    staleGameThreshold: 24, // hours
    popularGameThreshold: 7.0, // rating
  },
  api: {
    adaptiveRateLimit: true,
    predictiveCaching: true,
    batchOptimization: true,
    fallbackStrategy: 'cache',
    maxConcurrentRequests: 3,
    requestDelay: 1000, // 1 second
  },
  performance: {
    monitoring: true,
    metricsRetention: 30, // days
    alertThresholds: {
      responseTime: 5000, // 5 seconds
      errorRate: 10, // 10%
      cacheHitRate: 70, // 70%
    },
  },
};

/**
 * Get optimization config with environment overrides
 */
export function getOptimizationConfig(): OptimizationConfig {
  const config = { ...defaultOptimizationConfig };

  // Override with environment variables if available
  if (process.env['BGG_CACHE_ENABLED'] !== undefined) {
    config.cache.enabled = process.env['BGG_CACHE_ENABLED'] === 'true';
  }

  if (process.env['BGG_DATABASE_SEARCH_FIRST'] !== undefined) {
    config.database.searchFirst =
      process.env['BGG_DATABASE_SEARCH_FIRST'] === 'true';
  }

  if (process.env['BGG_ADAPTIVE_RATE_LIMIT'] !== undefined) {
    config.api.adaptiveRateLimit =
      process.env['BGG_ADAPTIVE_RATE_LIMIT'] === 'true';
  }

  if (process.env['BGG_MAX_CONCURRENT_REQUESTS']) {
    config.api.maxConcurrentRequests = parseInt(
      process.env['BGG_MAX_CONCURRENT_REQUESTS'],
      10
    );
  }

  if (process.env['BGG_REQUEST_DELAY']) {
    config.api.requestDelay = parseInt(process.env['BGG_REQUEST_DELAY'], 10);
  }

  return config;
}

/**
 * Validate optimization configuration
 */
export function validateOptimizationConfig(
  config: OptimizationConfig
): string[] {
  const errors: string[] = [];

  // Validate cache configuration
  if (config.cache.enabled) {
    Object.entries(config.cache.strategies).forEach(([key, strategy]) => {
      if (strategy.ttl <= 0) {
        errors.push(`Cache strategy ${key}: TTL must be positive`);
      }
      if (strategy.maxSize <= 0) {
        errors.push(`Cache strategy ${key}: maxSize must be positive`);
      }
    });
  }

  // Validate database configuration
  if (config.database.batchSize <= 0) {
    errors.push('Database batchSize must be positive');
  }
  if (config.database.staleGameThreshold <= 0) {
    errors.push('Database staleGameThreshold must be positive');
  }

  // Validate API configuration
  if (config.api.maxConcurrentRequests <= 0) {
    errors.push('API maxConcurrentRequests must be positive');
  }
  if (config.api.requestDelay < 0) {
    errors.push('API requestDelay must be non-negative');
  }

  // Validate performance configuration
  if (config.performance.metricsRetention <= 0) {
    errors.push('Performance metricsRetention must be positive');
  }
  if (config.performance.alertThresholds.responseTime <= 0) {
    errors.push('Performance alertThresholds.responseTime must be positive');
  }
  if (
    config.performance.alertThresholds.errorRate < 0 ||
    config.performance.alertThresholds.errorRate > 100
  ) {
    errors.push(
      'Performance alertThresholds.errorRate must be between 0 and 100'
    );
  }
  if (
    config.performance.alertThresholds.cacheHitRate < 0 ||
    config.performance.alertThresholds.cacheHitRate > 100
  ) {
    errors.push(
      'Performance alertThresholds.cacheHitRate must be between 0 and 100'
    );
  }

  return errors;
}

/**
 * Get cache strategy for operation type
 */
export function getCacheStrategy(
  operation: string,
  config: OptimizationConfig
): CacheStrategy | null {
  const strategies = config.cache.strategies as Record<string, CacheStrategy>;
  return strategies[operation] || null;
}

/**
 * Check if optimization feature is enabled
 */
export function isOptimizationEnabled(
  feature: keyof OptimizationConfig,
  config: OptimizationConfig
): boolean {
  const featureConfig = config[feature];
  return 'enabled' in featureConfig ? featureConfig.enabled : false;
}
