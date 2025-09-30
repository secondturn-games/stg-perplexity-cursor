/**
 * BoardGameGeek API Types
 * TypeScript interfaces for BGG API responses
 */

export interface BGGSearchItem {
  id: string;
  name: string;
  yearpublished?: string;
  type: 'boardgame' | 'boardgameexpansion' | 'boardgameaccessory';
}

export interface BGGSearchResponse {
  items: BGGSearchItem[];
  total: number;
  searchStrategy: 'exact' | 'fuzzy' | 'fallback';
  performance: {
    queryTime: number;
    cacheHit: boolean;
    apiCalls: number;
  };
}

export interface BGGSearchItem {
  id: string;
  name: string;
  yearpublished?: string;
  type: 'boardgame' | 'boardgameexpansion' | 'boardgameaccessory';
  thumbnail?: string;
  searchScore: number;
  isExactMatch: boolean;
  isExpansion: boolean;
  hasInboundExpansionLink: boolean;
  correctedType?: 'base-game' | 'expansion' | 'accessory';
  relevanceFactors: {
    nameMatch: number;
    yearMatch: number;
    typeMatch: number;
    popularity: number;
  };
  // Computed fields
  readonly bggLink: string;
  readonly displayYear: string;
  readonly typeDisplay: string;
  readonly isHighQuality: boolean;
  readonly ageInYears: number;
}

export interface BGGSearchItemComputed extends BGGSearchItem {
  // Additional computed properties
  readonly searchRelevance: 'exact' | 'high' | 'medium' | 'low';
  readonly qualityScore: number;
  readonly isRecent: boolean;
  readonly isClassic: boolean;
}

export interface SearchFilters {
  gameType?: 'base-game' | 'expansion' | 'accessory' | 'all';
  minPlayers?: number;
  maxPlayers?: number;
  minRating?: number;
  maxRating?: number;
  mechanics?: string[];
  categories?: string[];
  exactMatch?: boolean;
}

export interface BGGAlternateName {
  type: 'primary' | 'alternate';
  sortindex: number;
  value: string;
}

export interface BGGEdition {
  id: string;
  name: string;
  type: 'expansion' | 'implementation' | 'compilation' | 'accessory';
  yearpublished?: number;
  image?: string;
  thumbnail?: string;
  description?: string;
  minplayers?: number;
  maxplayers?: number;
  playingtime?: number;
  minage?: number;
  bgg_rating?: number;
  bgg_rank?: number;
  weight_rating?: number;
  languages?: string[];
  publishers?: string[];
  designers?: string[];
  artists?: string[];
  mechanics?: string[];
  categories?: string[];
  bggLink: string;
  // Version-specific fields
  productCode?: string;
  dimensions?: {
    width: number;
    length: number;
    depth: number;
    weight: number;
  };
}

export interface BGGLanguageDependence {
  description: string;
  percentage: number;
}

export interface BGGGameDetails {
  id: string;
  name: string;
  description: string;
  yearpublished: number;
  minplayers: number;
  maxplayers: number;
  playingtime: number;
  minplaytime: number;
  maxplaytime: number;
  minage: number;
  image: string;
  thumbnail: string;
  categories: string[];
  mechanics: string[];
  designers: string[];
  artists: string[];
  publishers: string[];
  languages: string[];
  bgg_rating: number;
  bgg_rank: number;
  weight_rating: number;
  age_rating: number;
  last_bgg_sync: string;
  // Enhanced fields
  alternateNames: BGGAlternateName[];
  editions: BGGEdition[];
  languageDependence: BGGLanguageDependence;
  // Computed fields
  readonly bggLink: string;
  readonly playerCount: string;
  readonly playTimeDisplay: string;
  readonly ageDisplay: string;
  readonly ratingDisplay: string;
  readonly weightDisplay: string;
  readonly rankDisplay: string;
  readonly isHighRated: boolean;
  readonly isHeavy: boolean;
  readonly isLight: boolean;
  readonly isPopular: boolean;
  readonly isRecent: boolean;
  readonly isClassic: boolean;
  readonly complexityLevel: 'light' | 'medium' | 'heavy';
  readonly playerCountRange: {
    min: number;
    max: number;
    optimal: number;
  };
  readonly playTimeRange: {
    min: number;
    max: number;
    average: number;
  };
}

export interface BGGGameDetailsComputed extends BGGGameDetails {
  // Additional computed properties
  readonly primaryMechanic: string;
  readonly primaryCategory: string;
  readonly difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  readonly recommendedFor: string[];
  readonly notRecommendedFor: string[];
  readonly bestPlayerCount: number;
  readonly worstPlayerCount: number;
}

export interface BGGCollectionItem {
  id: string;
  name: string;
  yearpublished: number;
  image: string;
  thumbnail: string;
  owned: boolean;
  prevowned: boolean;
  fortrade: boolean;
  want: boolean;
  wanttoplay: boolean;
  wanttobuy: boolean;
  wishlist: boolean;
  preordered: boolean;
  lastmodified: string;
  numplays: number;
  comment: string;
  condition: string;
  wishlistpriority: number;
  wishlistcomment: string;
  acqdate: string;
  privatecomment: string;
  tags: string;
  location: string;
  collid: number;
  status: {
    own: boolean;
    prevowned: boolean;
    fortrade: boolean;
    want: boolean;
    wanttoplay: boolean;
    wanttobuy: boolean;
    wishlist: boolean;
    preordered: boolean;
    lastmodified: string;
  };
}

export interface BGGCollectionResponse {
  items: BGGCollectionItem[];
  total: number;
}

export type BGGErrorCode =
  | 'RATE_LIMIT'
  | 'API_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'INVALID_RESPONSE'
  | 'BGG_ERROR'
  | 'API_ERROR'
  | 'CACHE_ERROR'
  | 'VALIDATION_ERROR'
  | 'TIMEOUT_ERROR';

export class BGGError extends Error {
  public readonly code: BGGErrorCode;
  public readonly details?: any;
  public readonly retryAfter?: number;
  public readonly userMessage?: string;

  constructor(
    code: BGGErrorCode,
    message: string,
    details?: any,
    retryAfter?: number,
    userMessage?: string
  ) {
    super(message);
    this.name = 'BGGError';
    this.code = code;
    this.details = details;
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
    if (userMessage !== undefined) {
      this.userMessage = userMessage;
    }
  }
}

/**
 * Utility functions for computing BGG data fields
 */
export class BGGDataUtils {
  /**
   * Compute search item fields
   */
  static computeSearchItemFields(
    item: Omit<
      BGGSearchItem,
      'bggLink' | 'displayYear' | 'typeDisplay' | 'isHighQuality' | 'ageInYears'
    >
  ): BGGSearchItem {
    const currentYear = new Date().getFullYear();
    const year = item.yearpublished ? parseInt(item.yearpublished) : 0;

    return {
      ...item,
      bggLink: `https://boardgamegeek.com/boardgame/${item.id}`,
      displayYear: year > 0 ? year.toString() : 'Unknown',
      typeDisplay: this.getTypeDisplay(item.type),
      isHighQuality: item.searchScore >= 70,
      ageInYears: year > 0 ? currentYear - year : 0,
    };
  }

  /**
   * Compute game details fields
   */
  static computeGameDetailsFields(
    game: Omit<
      BGGGameDetails,
      | 'bggLink'
      | 'playerCount'
      | 'playTimeDisplay'
      | 'ageDisplay'
      | 'ratingDisplay'
      | 'weightDisplay'
      | 'rankDisplay'
      | 'isHighRated'
      | 'isHeavy'
      | 'isLight'
      | 'isPopular'
      | 'isRecent'
      | 'isClassic'
      | 'complexityLevel'
      | 'playerCountRange'
      | 'playTimeRange'
    >
  ): BGGGameDetails {
    const currentYear = new Date().getFullYear();
    const age = currentYear - game.yearpublished;

    return {
      ...game,
      bggLink: `https://boardgamegeek.com/boardgame/${game.id}`,
      playerCount:
        game.minplayers === game.maxplayers
          ? `${game.minplayers}`
          : `${game.minplayers}-${game.maxplayers}`,
      playTimeDisplay:
        game.minplaytime === game.maxplaytime
          ? `${game.minplaytime} min`
          : `${game.minplaytime}-${game.maxplaytime} min`,
      ageDisplay: `${game.minage}+`,
      ratingDisplay: game.bgg_rating.toFixed(1),
      weightDisplay: game.weight_rating.toFixed(1),
      rankDisplay: game.bgg_rank > 0 ? `#${game.bgg_rank}` : 'Unranked',
      isHighRated: game.bgg_rating >= 7.0,
      isHeavy: game.weight_rating >= 3.5,
      isLight: game.weight_rating <= 2.0,
      isPopular: game.bgg_rank > 0 && game.bgg_rank <= 1000,
      isRecent: age <= 5,
      isClassic: age >= 20,
      complexityLevel: this.getComplexityLevel(game.weight_rating),
      playerCountRange: {
        min: game.minplayers,
        max: game.maxplayers,
        optimal: Math.round((game.minplayers + game.maxplayers) / 2),
      },
      playTimeRange: {
        min: game.minplaytime,
        max: game.maxplaytime,
        average: Math.round((game.minplaytime + game.maxplaytime) / 2),
      },
    };
  }

  /**
   * Get type display name
   */
  private static getTypeDisplay(type: string): string {
    switch (type) {
      case 'boardgame':
        return 'Base Game';
      case 'boardgameexpansion':
        return 'Expansion';
      case 'boardgameaccessory':
        return 'Accessory';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get complexity level
   */
  private static getComplexityLevel(
    weight: number
  ): 'light' | 'medium' | 'heavy' {
    if (weight <= 2.0) return 'light';
    if (weight <= 3.5) return 'medium';
    return 'heavy';
  }

  /**
   * Compute search relevance
   */
  static getSearchRelevance(
    searchScore: number
  ): 'exact' | 'high' | 'medium' | 'low' {
    if (searchScore >= 90) return 'exact';
    if (searchScore >= 70) return 'high';
    if (searchScore >= 50) return 'medium';
    return 'low';
  }

  /**
   * Compute quality score
   */
  static getQualityScore(item: BGGSearchItem): number {
    let score = item.searchScore;

    // Bonus for exact matches
    if (item.isExactMatch) score += 10;

    // Bonus for high search scores
    if (item.searchScore >= 80) score += 5;

    // Penalty for very old games (unless they're classics)
    if (item.ageInYears > 30 && item.ageInYears < 50) score -= 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Check if game is recent
   */
  static isRecent(yearpublished: number): boolean {
    const currentYear = new Date().getFullYear();
    return currentYear - yearpublished <= 5;
  }

  /**
   * Check if game is classic
   */
  static isClassic(yearpublished: number): boolean {
    const currentYear = new Date().getFullYear();
    return currentYear - yearpublished >= 20;
  }

  static fromError(error: any, operation: string): BGGError {
    if (error instanceof BGGError) {
      return error;
    }

    // Handle null/undefined errors
    if (!error) {
      return new BGGError(
        'BGG_ERROR',
        `Unknown error during ${operation}`,
        { operation },
        undefined,
        'An unexpected error occurred. Please try again.'
      );
    }

    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new BGGError(
        'NETWORK_ERROR',
        `Network error during ${operation}: ${error.message}`,
        { originalError: error, operation },
        undefined,
        'Unable to connect to BoardGameGeek. Please check your internet connection.'
      );
    }

    // Timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return new BGGError(
        'TIMEOUT_ERROR',
        `Request timeout during ${operation}: ${error.message}`,
        { originalError: error, operation },
        30, // retry after 30 seconds
        'Request timed out. Please try again in a moment.'
      );
    }

    // Rate limiting
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return new BGGError(
        'RATE_LIMIT',
        `Rate limit exceeded during ${operation}`,
        { originalError: error, operation },
        60, // retry after 1 minute
        'Too many requests. Please wait a moment before trying again.'
      );
    }

    // API unavailable
    if (error.status >= 500 || error.message?.includes('service unavailable')) {
      return new BGGError(
        'API_UNAVAILABLE',
        `BGG API unavailable during ${operation}: ${error.message}`,
        { originalError: error, operation },
        300, // retry after 5 minutes
        'BoardGameGeek is temporarily unavailable. Please try again later.'
      );
    }

    // Parse errors
    if (error.message?.includes('parse') || error.message?.includes('XML')) {
      return new BGGError(
        'PARSE_ERROR',
        `Failed to parse BGG response during ${operation}: ${error.message}`,
        { originalError: error, operation },
        undefined,
        'Received invalid data from BoardGameGeek. Please try again.'
      );
    }

    // Generic error
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    return new BGGError(
      'BGG_ERROR',
      `Error during ${operation}: ${errorMessage}`,
      { originalError: error, operation },
      undefined,
      'An unexpected error occurred. Please try again.'
    );
  }
}

export interface BGGRateLimit {
  requestsPerSecond: number;
  lastRequestTime: number;
  requestQueue: Array<() => Promise<any>>;
}

export interface BGGCacheStats {
  size: number;
  hitRate: number;
  totalQueries: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  averageQueryTime: number;
  lastCleanup: Date;
}

export interface BGGCacheEfficiency {
  memoryHitRate: number;
  totalMemorySize: number;
  averageResponseTime: number;
  cacheEffectiveness: number;
}

export interface BGGPerformanceMetrics {
  searchTimes: number[];
  apiCallCounts: number[];
  cacheHitRates: number[];
  errorRates: number[];
  averageResponseTime: number;
  peakMemoryUsage: number;
}

export interface BGGCacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface BGGImageProcessing {
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string;
  storagePath: string;
  mimeType: string;
  size: number;
}

export interface BGGBatchUpdate {
  gameIds: string[];
  operation: 'create' | 'update' | 'sync';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: Array<{
    gameId: string;
    status: 'success' | 'error';
    error?: string;
  }>;
  createdAt: string;
  completedAt?: string;
}

export interface BGGRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface BGGConfig {
  baseUrl: string;
  rateLimit: {
    requestsPerSecond: number;
    burstLimit: number;
    retryDelay: number;
  };
  cache: {
    ttl: number; // 24 hours in milliseconds
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
  imageProcessing?: {
    enabled: boolean;
    maxSize: number;
    allowedTypes: string[];
    quality: number;
  };
}

// XML Response Types (for parsing)
export interface BGGXMLItem {
  $: {
    id: string;
    type: string;
  };
  name: Array<{
    $: {
      type: string;
      value: string;
    };
  }>;
  yearpublished?: Array<{ $: { value: string } }>;
  image?: string[];
  thumbnail?: string[];
  description?: string[];
  minplayers?: Array<{ $: { value: string } }>;
  maxplayers?: Array<{ $: { value: string } }>;
  playingtime?: Array<{ $: { value: string } }>;
  minplaytime?: Array<{ $: { value: string } }>;
  maxplaytime?: Array<{ $: { value: string } }>;
  minage?: Array<{ $: { value: string } }>;
  statistics?: Array<{
    ratings?: Array<{
      average?: Array<{ $: { value: string } }>;
      ranks?: Array<{
        rank?: Array<{
          $: {
            type: string;
            id: string;
            value: string;
          };
        }>;
      }>;
    }>;
  }>;
  link?: Array<{
    $: {
      type: string;
      id: string;
      value: string;
    };
  }>;
}

export interface BGGXMLResponse {
  items?: {
    item?: BGGXMLItem[];
    $: {
      total: string;
    };
  };
  item?: BGGXMLItem;
}
