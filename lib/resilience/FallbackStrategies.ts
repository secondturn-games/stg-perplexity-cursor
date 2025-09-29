/**
 * Fallback Strategies for BGG API
 * Provides fallback responses when BGG API is unavailable
 */

import {
  BGGSearchResponse,
  BGGGameDetails,
  BGGCollectionResponse,
  BGGError,
} from '@/types/bgg.types';
import { eventBus } from '../events/EventBus';
import { BGGEventFactory } from '../events/BGGEvents';

export interface FallbackSearchOptions {
  query: string;
  filters?: any;
  maxResults?: number;
  includePartialData?: boolean;
}

export interface FallbackGameDetailsOptions {
  gameId: string;
  includePartialData?: boolean;
}

export interface FallbackCollectionOptions {
  username: string;
  includePartialData?: boolean;
}

export class FallbackStrategies {
  /**
   * Get fallback search results from cache or partial data
   */
  static async getFallbackSearchResults(
    options: FallbackSearchOptions
  ): Promise<BGGSearchResponse> {
    const {
      query,
      filters = {},
      maxResults = 10,
      includePartialData = true,
    } = options;

    try {
      // Emit fallback event
      await eventBus.emit('bgg.fallback.search', {
        eventType: 'bgg.fallback.search',
        timestamp: new Date().toISOString(),
        eventId: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'bgg-fallback',
        data: {
          query,
          filters,
          reason: 'circuit_breaker_open',
        },
      });

      // Try to get cached results first
      const cachedResults = await this.getCachedSearchResults(query, filters);
      if (cachedResults && cachedResults.items.length > 0) {
        return {
          ...cachedResults,
          items: cachedResults.items.slice(0, maxResults),
          searchStrategy: 'fallback',
          performance: {
            queryTime: 0,
            cacheHit: true,
            apiCalls: 0,
          },
        };
      }

      // Return partial data if available
      if (includePartialData) {
        return this.getPartialSearchResults(query, filters, maxResults);
      }

      // Return empty results with helpful message
      return this.getEmptySearchResults(query, filters);
    } catch (error) {
      console.error('Error in fallback search strategy:', error);
      return this.getEmptySearchResults(query, filters);
    }
  }

  /**
   * Get fallback game details from cache or partial data
   */
  static async getFallbackGameDetails(
    options: FallbackGameDetailsOptions
  ): Promise<BGGGameDetails | null> {
    const { gameId, includePartialData = true } = options;

    try {
      // Emit fallback event
      await eventBus.emit('bgg.fallback.game_details', {
        eventType: 'bgg.fallback.game_details',
        timestamp: new Date().toISOString(),
        eventId: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'bgg-fallback',
        data: {
          gameId,
          reason: 'circuit_breaker_open',
        },
      });

      // Try to get cached game details first
      const cachedDetails = await this.getCachedGameDetails(gameId);
      if (cachedDetails) {
        return {
          ...cachedDetails,
          last_bgg_sync: new Date().toISOString(),
        };
      }

      // Return partial data if available
      if (includePartialData) {
        return this.getPartialGameDetails(gameId);
      }

      return null;
    } catch (error) {
      console.error('Error in fallback game details strategy:', error);
      return null;
    }
  }

  /**
   * Get fallback collection data from cache or partial data
   */
  static async getFallbackCollection(
    options: FallbackCollectionOptions
  ): Promise<BGGCollectionResponse> {
    const { username, includePartialData = true } = options;

    try {
      // Emit fallback event
      await eventBus.emit('bgg.fallback.collection', {
        eventType: 'bgg.fallback.collection',
        timestamp: new Date().toISOString(),
        eventId: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'bgg-fallback',
        data: {
          username,
          reason: 'circuit_breaker_open',
        },
      });

      // Try to get cached collection first
      const cachedCollection = await this.getCachedCollection(username);
      if (cachedCollection && cachedCollection.items.length > 0) {
        return {
          ...cachedCollection,
        };
      }

      // Return partial data if available
      if (includePartialData) {
        return this.getPartialCollection(username);
      }

      // Return empty collection with helpful message
      return this.getEmptyCollection(username);
    } catch (error) {
      console.error('Error in fallback collection strategy:', error);
      return this.getEmptyCollection(username);
    }
  }

  /**
   * Get cached search results (placeholder - would integrate with actual cache)
   */
  private static async getCachedSearchResults(
    query: string,
    filters: any
  ): Promise<BGGSearchResponse | null> {
    // This would integrate with your actual cache implementation
    // For now, return null to indicate no cached data
    return null;
  }

  /**
   * Get cached game details (placeholder - would integrate with actual cache)
   */
  private static async getCachedGameDetails(
    gameId: string
  ): Promise<BGGGameDetails | null> {
    // This would integrate with your actual cache implementation
    // For now, return null to indicate no cached data
    return null;
  }

  /**
   * Get cached collection (placeholder - would integrate with actual cache)
   */
  private static async getCachedCollection(
    username: string
  ): Promise<BGGCollectionResponse | null> {
    // This would integrate with your actual cache implementation
    // For now, return null to indicate no cached data
    return null;
  }

  /**
   * Get partial search results with limited data
   */
  private static getPartialSearchResults(
    query: string,
    filters: any,
    maxResults: number
  ): BGGSearchResponse {
    // Create a partial response with basic information
    const partialItems = Array.from(
      { length: Math.min(maxResults, 3) },
      (_, index) => ({
        id: `partial_${index + 1}`,
        name: `Partial result for "${query}" (${index + 1})`,
        yearpublished: 'Unknown',
        type: 'boardgame' as const,
        thumbnail: '',
        searchScore: 50 - index * 10,
        isExactMatch: false,
        isExpansion: false,
        hasInboundExpansionLink: false,
        correctedType: 'base-game' as const,
        relevanceFactors: {
          nameMatch: 50,
          yearMatch: 0,
          typeMatch: 100,
          popularity: 30,
        },
        bggLink: '',
        displayYear: 'Unknown',
        typeDisplay: 'Base Game',
        isHighQuality: false,
        ageInYears: 0,
      })
    );

    return {
      items: partialItems,
      total: partialItems.length,
      searchStrategy: 'fallback',
      performance: {
        queryTime: 0,
        cacheHit: false,
        apiCalls: 0,
      },
    };
  }

  /**
   * Get partial game details with limited data
   */
  private static getPartialGameDetails(gameId: string): BGGGameDetails {
    return {
      id: gameId,
      name: 'Game details temporarily unavailable',
      description:
        "This game's details are temporarily unavailable due to BGG API issues. Please try again later.",
      yearpublished: 0,
      minplayers: 0,
      maxplayers: 0,
      playingtime: 0,
      minplaytime: 0,
      maxplaytime: 0,
      minage: 0,
      image: '',
      thumbnail: '',
      categories: [],
      mechanics: [],
      designers: [],
      artists: [],
      publishers: [],
      languages: [],
      bgg_rating: 0,
      bgg_rank: 0,
      weight_rating: 0,
      age_rating: 0,
      last_bgg_sync: new Date().toISOString(),
      bggLink: `https://boardgamegeek.com/boardgame/${gameId}`,
      playerCount: 'Unknown',
      playTimeDisplay: 'Unknown',
      ageDisplay: 'Unknown',
      ratingDisplay: 'N/A',
      weightDisplay: 'N/A',
      rankDisplay: 'N/A',
      isHighRated: false,
      isHeavy: false,
      isLight: false,
      isPopular: false,
      isRecent: false,
      isClassic: false,
      complexityLevel: 'medium' as const,
      playerCountRange: { min: 0, max: 0, optimal: 0 },
      playTimeRange: { min: 0, max: 0, average: 0 },
    };
  }

  /**
   * Get partial collection with limited data
   */
  private static getPartialCollection(username: string): BGGCollectionResponse {
    return {
      items: [],
      total: 0,
    };
  }

  /**
   * Get empty search results with helpful message
   */
  private static getEmptySearchResults(
    query: string,
    filters: any
  ): BGGSearchResponse {
    return {
      items: [],
      total: 0,
      searchStrategy: 'fallback',
      performance: {
        queryTime: 0,
        cacheHit: false,
        apiCalls: 0,
      },
    };
  }

  /**
   * Get empty collection with helpful message
   */
  private static getEmptyCollection(username: string): BGGCollectionResponse {
    return {
      items: [],
      total: 0,
    };
  }

  /**
   * Create a BGG error for fallback scenarios
   */
  static createFallbackError(
    operation: string,
    originalError?: Error,
    context?: any
  ): BGGError {
    const message = `BGG ${operation} temporarily unavailable. Using fallback data.`;
    const userMessage = `The BGG service is temporarily unavailable. We're showing limited data. Please try again later for complete information.`;

    return new BGGError(
      'API_UNAVAILABLE',
      message,
      {
        operation,
        fallbackUsed: true,
        originalError: originalError?.message,
        ...context,
      },
      60, // Retry after 1 minute
      userMessage
    );
  }

  /**
   * Check if fallback should be used based on error type
   */
  static shouldUseFallback(error: Error): boolean {
    if (!(error instanceof BGGError)) {
      return false;
    }

    // Use fallback for these error types
    const fallbackErrorTypes = [
      'RATE_LIMIT',
      'API_UNAVAILABLE',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
    ];

    return fallbackErrorTypes.includes(error.code);
  }

  /**
   * Get fallback recommendations based on current state
   */
  static getFallbackRecommendations(
    circuitState: string,
    errorRate: number,
    lastErrorTime?: string
  ): string[] {
    const recommendations: string[] = [];

    if (circuitState === 'OPEN') {
      recommendations.push('BGG API is currently unavailable');
      recommendations.push('Using cached or partial data where available');
      recommendations.push('Consider retrying in a few minutes');
    } else if (circuitState === 'HALF_OPEN') {
      recommendations.push('BGG API is recovering from issues');
      recommendations.push('Some operations may still use fallback data');
      recommendations.push('Monitor for continued improvements');
    }

    if (errorRate > 0.5) {
      recommendations.push(
        'High error rate detected - investigate BGG API health'
      );
    }

    if (lastErrorTime) {
      const lastError = new Date(lastErrorTime);
      const timeSinceError = Date.now() - lastError.getTime();
      const minutesSinceError = Math.floor(timeSinceError / 60000);

      if (minutesSinceError < 5) {
        recommendations.push(
          'Recent errors detected - BGG API may be experiencing issues'
        );
      }
    }

    return recommendations;
  }
}
