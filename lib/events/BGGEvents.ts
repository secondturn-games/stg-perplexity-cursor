/**
 * BGG Event Definitions
 * Type-safe event definitions for BoardGameGeek integration
 */

import { BGGSearchResponse, BGGGameDetails, BGGError } from '@/types/bgg.types';

// Base event interface
export interface BaseEvent {
  timestamp: string;
  eventId: string;
  source: 'bgg-service' | 'bgg-api' | 'bgg-cache' | 'bgg-analytics';
}

// Search Events
export interface GameSearchedEvent extends BaseEvent {
  eventType: 'game.searched';
  data: {
    query: string;
    filters: {
      gameType?: string;
      exactMatch?: boolean;
      [key: string]: any;
    };
    results: {
      total: number;
      itemsCount: number;
      searchStrategy: string;
    };
    performance: {
      queryTime: number;
      cacheHit: boolean;
      apiCalls: number;
    };
  };
}

export interface GameSearchFailedEvent extends BaseEvent {
  eventType: 'game.search.failed';
  data: {
    query: string;
    filters: Record<string, any>;
    error: {
      code: string;
      message: string;
      userMessage?: string;
    };
    retryable: boolean;
  };
}

// Game Details Events
export interface GameDetailsFetchedEvent extends BaseEvent {
  eventType: 'game.details.fetched';
  data: {
    gameId: string;
    gameName: string;
    gameType: 'boardgame' | 'boardgameexpansion' | 'boardgameaccessory';
    performance: {
      queryTime: number;
      cacheHit: boolean;
      apiCalls: number;
    };
    metadata: {
      yearPublished: number;
      bggRating: number;
      bggRank: number;
      weightRating: number;
    };
  };
}

export interface GameDetailsFailedEvent extends BaseEvent {
  eventType: 'game.details.failed';
  data: {
    gameId: string;
    error: {
      code: string;
      message: string;
      userMessage?: string;
    };
    retryable: boolean;
    attempt: number;
    maxAttempts: number;
  };
}

// Cache Events
export interface GameCachedEvent extends BaseEvent {
  eventType: 'game.cached';
  data: {
    cacheKey: string;
    dataType: 'search' | 'game-details' | 'collection';
    gameId?: string;
    query?: string;
    ttl: number;
    size: number;
  };
}

export interface CacheHitEvent extends BaseEvent {
  eventType: 'cache.hit';
  data: {
    cacheKey: string;
    dataType: 'search' | 'game-details' | 'collection';
    gameId?: string;
    query?: string;
    age: number; // Age of cached data in milliseconds
  };
}

export interface CacheMissEvent extends BaseEvent {
  eventType: 'cache.miss';
  data: {
    cacheKey: string;
    dataType: 'search' | 'game-details' | 'collection';
    gameId?: string;
    query?: string;
  };
}

export interface CacheEvictedEvent extends BaseEvent {
  eventType: 'cache.evicted';
  data: {
    cacheKey: string;
    dataType: 'search' | 'game-details' | 'collection';
    reason: 'ttl-expired' | 'size-limit' | 'manual-clear' | 'pattern-clear';
    age: number;
    size: number;
  };
}

// API Events
export interface BGGApiErrorEvent extends BaseEvent {
  eventType: 'bgg.api.error';
  data: {
    operation: string;
    error: {
      code: string;
      message: string;
      userMessage?: string;
      retryAfter?: number;
    };
    request: {
      url?: string;
      method?: string;
      params?: Record<string, any>;
    };
    response?: {
      status?: number;
      statusText?: string;
    };
    retryable: boolean;
  };
}

export interface BGGApiRateLimitedEvent extends BaseEvent {
  eventType: 'bgg.api.rate_limited';
  data: {
    operation: string;
    retryAfter: number;
    requestCount: number;
    windowStart: string;
    windowEnd: string;
  };
}

export interface BGGApiSuccessEvent extends BaseEvent {
  eventType: 'bgg.api.success';
  data: {
    operation: string;
    responseTime: number;
    dataSize: number;
    cacheStrategy: 'none' | 'memory' | 'database';
  };
}

// Analytics Events
export interface SearchAnalyticsEvent extends BaseEvent {
  eventType: 'analytics.search';
  data: {
    query: string;
    resultCount: number;
    searchStrategy: string;
    queryTime: number;
    cacheHit: boolean;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface GameViewAnalyticsEvent extends BaseEvent {
  eventType: 'analytics.game.view';
  data: {
    gameId: string;
    gameName: string;
    source: 'search' | 'direct' | 'collection' | 'recommendation';
    viewTime?: number;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface PerformanceMetricsEvent extends BaseEvent {
  eventType: 'analytics.performance';
  data: {
    operation: string;
    metrics: {
      responseTime: number;
      memoryUsage: number;
      cacheHitRate: number;
      errorRate: number;
    };
    timestamp: string;
  };
}

// Collection Events
export interface CollectionFetchedEvent extends BaseEvent {
  eventType: 'collection.fetched';
  data: {
    username: string;
    itemCount: number;
    performance: {
      queryTime: number;
      cacheHit: boolean;
      apiCalls: number;
    };
  };
}

export interface CollectionFailedEvent extends BaseEvent {
  eventType: 'collection.failed';
  data: {
    username: string;
    error: {
      code: string;
      message: string;
      userMessage?: string;
    };
    retryable: boolean;
  };
}

// Union type for all BGG events
export type BGGEvent =
  | GameSearchedEvent
  | GameSearchFailedEvent
  | GameDetailsFetchedEvent
  | GameDetailsFailedEvent
  | GameCachedEvent
  | CacheHitEvent
  | CacheMissEvent
  | CacheEvictedEvent
  | BGGApiErrorEvent
  | BGGApiRateLimitedEvent
  | BGGApiSuccessEvent
  | SearchAnalyticsEvent
  | GameViewAnalyticsEvent
  | PerformanceMetricsEvent
  | CollectionFetchedEvent
  | CollectionFailedEvent;

// Event type mapping for type safety
export type BGGEventType = BGGEvent['eventType'];

// Event data mapping for type safety
export type BGGEventData<T extends BGGEventType> = Extract<BGGEvent, { eventType: T }>['data'];

// Event factory functions
export class BGGEventFactory {
  private static generateEventId(): string {
    return `bgg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createGameSearchedEvent(
    query: string,
    filters: Record<string, any>,
    results: BGGSearchResponse,
    performance: { queryTime: number; cacheHit: boolean; apiCalls: number }
  ): GameSearchedEvent {
    return {
      eventType: 'game.searched',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-service',
      data: {
        query,
        filters,
        results: {
          total: results.total,
          itemsCount: results.items.length,
          searchStrategy: results.searchStrategy,
        },
        performance,
      },
    };
  }

  static createGameSearchFailedEvent(
    query: string,
    filters: Record<string, any>,
    error: BGGError
  ): GameSearchFailedEvent {
    return {
      eventType: 'game.search.failed',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-service',
      data: {
        query,
        filters,
        error: {
          code: error.code,
          message: error.message,
          userMessage: error.userMessage,
        },
        retryable: error.code === 'RATE_LIMIT' || error.code === 'API_UNAVAILABLE',
      },
    };
  }

  static createGameDetailsFetchedEvent(
    gameId: string,
    gameName: string,
    gameType: 'boardgame' | 'boardgameexpansion' | 'boardgameaccessory',
    performance: { queryTime: number; cacheHit: boolean; apiCalls: number },
    metadata: { yearPublished: number; bggRating: number; bggRank: number; weightRating: number }
  ): GameDetailsFetchedEvent {
    return {
      eventType: 'game.details.fetched',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-service',
      data: {
        gameId,
        gameName,
        gameType,
        performance,
        metadata,
      },
    };
  }

  static createGameCachedEvent(
    cacheKey: string,
    dataType: 'search' | 'game-details' | 'collection',
    ttl: number,
    size: number,
    gameId?: string,
    query?: string
  ): GameCachedEvent {
    return {
      eventType: 'game.cached',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-cache',
      data: {
        cacheKey,
        dataType,
        gameId,
        query,
        ttl,
        size,
      },
    };
  }

  static createBGGApiErrorEvent(
    operation: string,
    error: BGGError,
    request?: { url?: string; method?: string; params?: Record<string, any> },
    response?: { status?: number; statusText?: string }
  ): BGGApiErrorEvent {
    return {
      eventType: 'bgg.api.error',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-api',
      data: {
        operation,
        error: {
          code: error.code,
          message: error.message,
          userMessage: error.userMessage,
          retryAfter: error.retryAfter,
        },
        request,
        response,
        retryable: error.code === 'RATE_LIMIT' || error.code === 'API_UNAVAILABLE',
      },
    };
  }

  static createCacheHitEvent(
    cacheKey: string,
    dataType: 'search' | 'game-details' | 'collection',
    age: number,
    gameId?: string,
    query?: string
  ): CacheHitEvent {
    return {
      eventType: 'cache.hit',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-cache',
      data: {
        cacheKey,
        dataType,
        gameId,
        query,
        age,
      },
    };
  }

  static createCacheMissEvent(
    cacheKey: string,
    dataType: 'search' | 'game-details' | 'collection',
    gameId?: string,
    query?: string
  ): CacheMissEvent {
    return {
      eventType: 'cache.miss',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-cache',
      data: {
        cacheKey,
        dataType,
        gameId,
        query,
      },
    };
  }

  static createCacheEvictedEvent(
    cacheKey: string,
    dataType: 'search' | 'game-details' | 'collection',
    reason: 'ttl-expired' | 'size-limit' | 'manual-clear' | 'pattern-clear',
    age: number,
    size: number
  ): CacheEvictedEvent {
    return {
      eventType: 'cache.evicted',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-cache',
      data: {
        cacheKey,
        dataType,
        reason,
        age,
        size,
      },
    };
  }

  static createSearchAnalyticsEvent(
    query: string,
    resultCount: number,
    searchStrategy: string,
    queryTime: number,
    cacheHit: boolean,
    userAgent?: string,
    sessionId?: string
  ): SearchAnalyticsEvent {
    return {
      eventType: 'analytics.search',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-analytics',
      data: {
        query,
        resultCount,
        searchStrategy,
        queryTime,
        cacheHit,
        userAgent,
        sessionId,
      },
    };
  }

  static createGameViewAnalyticsEvent(
    gameId: string,
    gameName: string,
    source: 'search' | 'direct' | 'collection' | 'recommendation',
    viewTime?: number,
    userAgent?: string,
    sessionId?: string
  ): GameViewAnalyticsEvent {
    return {
      eventType: 'analytics.game.view',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-analytics',
      data: {
        gameId,
        gameName,
        source,
        viewTime,
        userAgent,
        sessionId,
      },
    };
  }

  static createPerformanceMetricsEvent(
    operation: string,
    metrics: {
      responseTime: number;
      memoryUsage: number;
      cacheHitRate: number;
      errorRate: number;
    }
  ): PerformanceMetricsEvent {
    return {
      eventType: 'analytics.performance',
      timestamp: new Date().toISOString(),
      eventId: this.generateEventId(),
      source: 'bgg-analytics',
      data: {
        operation,
        metrics,
        timestamp: new Date().toISOString(),
      },
    };
  }
}