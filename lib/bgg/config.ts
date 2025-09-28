/**
 * BGG Configuration Management
 * Centralized configuration with environment-specific settings
 */

export interface BGGConfig {
  baseUrl: string;
  rateLimit: {
    requestsPerSecond: number;
    burstLimit: number;
    retryDelay: number;
  };
  cache: {
    ttl: number;
    maxSize: number;
    cleanupInterval: number;
  };
  search: {
    exactSearchThreshold: number;
    maxResults: number;
    timeout: number;
  };
  retry: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
  debug: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    logRequests: boolean;
    logResponses: boolean;
  };
}

export interface EnvironmentConfig {
  development: Partial<BGGConfig>;
  staging: Partial<BGGConfig>;
  production: Partial<BGGConfig>;
}

// Default configuration
const DEFAULT_CONFIG: BGGConfig = {
  baseUrl: 'https://boardgamegeek.com/xmlapi2',
  rateLimit: {
    requestsPerSecond: 2,
    burstLimit: 5,
    retryDelay: 1000,
  },
  cache: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 1000,
    cleanupInterval: 60 * 60 * 1000, // 1 hour
  },
  search: {
    exactSearchThreshold: 4,
    maxResults: 50,
    timeout: 15000,
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
  debug: {
    enabled: false,
    logLevel: 'error',
    logRequests: false,
    logResponses: false,
  },
};

// Environment-specific overrides
const ENVIRONMENT_CONFIG: EnvironmentConfig = {
  development: {
    debug: {
      enabled: true,
      logLevel: 'debug',
      logRequests: true,
      logResponses: true,
    },
    rateLimit: {
      requestsPerSecond: 0.5, // Very conservative in dev - 1 request every 2 seconds
      burstLimit: 2,
      retryDelay: 5000, // 5 second delay on retry
    },
    cache: {
      ttl: 5 * 60 * 1000, // 5 minutes in dev
      maxSize: 100,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
    },
    retry: {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    },
  },
  staging: {
    debug: {
      enabled: true,
      logLevel: 'info',
      logRequests: true,
      logResponses: false,
    },
    rateLimit: {
      requestsPerSecond: 1.5,
      burstLimit: 4,
      retryDelay: 1500,
    },
    cache: {
      ttl: 2 * 60 * 60 * 1000, // 2 hours in staging
      maxSize: 500,
      cleanupInterval: 30 * 60 * 1000, // 30 minutes
    },
  },
  production: {
    debug: {
      enabled: false,
      logLevel: 'error',
      logRequests: false,
      logResponses: false,
    },
    rateLimit: {
      requestsPerSecond: 2,
      burstLimit: 5,
      retryDelay: 1000,
    },
    cache: {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 1000,
      cleanupInterval: 60 * 60 * 1000, // 1 hour
    },
  },
};

/**
 * Get the current environment
 */
function getEnvironment(): keyof EnvironmentConfig {
  const env = process.env.NODE_ENV || 'development';
  return (env as keyof EnvironmentConfig) || 'development';
}

/**
 * Merge configuration objects deeply
 */
function mergeConfig<T>(base: T, override: Partial<T>): T {
  const result = { ...base };

  for (const key in override) {
    if (override[key] !== undefined) {
      if (
        typeof override[key] === 'object' &&
        override[key] !== null &&
        !Array.isArray(override[key])
      ) {
        result[key] = mergeConfig(result[key] as any, override[key] as any);
      } else {
        result[key] = override[key] as any;
      }
    }
  }

  return result;
}

/**
 * Get configuration for current environment
 */
export function getBGGConfig(): BGGConfig {
  const environment = getEnvironment();
  const envConfig = ENVIRONMENT_CONFIG[environment] || {};

  // Merge with environment variables
  const envOverrides: Partial<BGGConfig> = {};

  if (process.env['BGG_RATE_LIMIT']) {
    envOverrides.rateLimit = {
      ...DEFAULT_CONFIG.rateLimit,
      requestsPerSecond: parseFloat(process.env['BGG_RATE_LIMIT']),
    };
  }

  if (process.env['BGG_CACHE_TTL']) {
    envOverrides.cache = {
      ...DEFAULT_CONFIG.cache,
      ttl: parseInt(process.env['BGG_CACHE_TTL']),
    };
  }

  if (process.env['BGG_DEBUG'] === 'true') {
    envOverrides.debug = {
      ...DEFAULT_CONFIG.debug,
      enabled: true,
      logLevel: 'debug',
    };
  }

  if (process.env['BGG_TIMEOUT']) {
    envOverrides.search = {
      ...DEFAULT_CONFIG.search,
      timeout: parseInt(process.env['BGG_TIMEOUT']),
    };
  }

  // Merge all configurations
  const finalConfig = mergeConfig(DEFAULT_CONFIG, envConfig);
  return mergeConfig(finalConfig, envOverrides);
}

/**
 * Validate configuration
 */
export function validateConfig(config: BGGConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.rateLimit.requestsPerSecond <= 0) {
    errors.push('Rate limit requestsPerSecond must be greater than 0');
  }

  if (config.rateLimit.requestsPerSecond > 5) {
    errors.push(
      'Rate limit requestsPerSecond should not exceed 5 to respect BGG API limits'
    );
  }

  if (config.cache.ttl <= 0) {
    errors.push('Cache TTL must be greater than 0');
  }

  if (config.cache.maxSize <= 0) {
    errors.push('Cache maxSize must be greater than 0');
  }

  if (config.search.timeout <= 0) {
    errors.push('Search timeout must be greater than 0');
  }

  if (config.retry.maxAttempts < 0) {
    errors.push('Retry maxAttempts must be non-negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration summary for logging
 */
export function getConfigSummary(config: BGGConfig): string {
  return `BGG Config: ${getEnvironment()} | Rate: ${config.rateLimit.requestsPerSecond}/s | Cache: ${config.cache.maxSize} items | Debug: ${config.debug.enabled}`;
}

// Export the default config for reference
export { DEFAULT_CONFIG };
