/**
 * Game Analytics Handler
 * Tracks search patterns, usage analytics, and user behavior
 */

import { EventHandler } from '../EventBus';
import {
  BGGEvent,
  SearchAnalyticsEvent,
  GameViewAnalyticsEvent,
  PerformanceMetricsEvent,
  GameSearchedEvent,
  GameDetailsFetchedEvent,
} from '../BGGEvents';

export class GameAnalyticsHandler {
  private searchHistory: Map<string, number> = new Map();
  private gameViews: Map<string, number> = new Map();
  private performanceMetrics: Array<{
    operation: string;
    responseTime: number;
    timestamp: string;
  }> = [];
  private sessionData: Map<string, any> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Search analytics
    this.handleSearchAnalytics = this.handleSearchAnalytics.bind(this);
    this.handleGameSearched = this.handleGameSearched.bind(this);

    // Game view analytics
    this.handleGameViewAnalytics = this.handleGameViewAnalytics.bind(this);
    this.handleGameDetailsFetched = this.handleGameDetailsFetched.bind(this);

    // Performance metrics
    this.handlePerformanceMetrics = this.handlePerformanceMetrics.bind(this);
  }

  /**
   * Handle search analytics events
   */
  handleSearchAnalytics: EventHandler<SearchAnalyticsEvent> = async event => {
    try {
      const {
        query,
        resultCount,
        searchStrategy,
        queryTime,
        cacheHit,
        userAgent,
        sessionId,
      } = event.data;

      // Track search patterns
      this.trackSearchPattern(query, resultCount, searchStrategy);

      // Track performance metrics
      this.trackSearchPerformance(queryTime, cacheHit);

      // Track user session data
      if (sessionId) {
        this.trackSessionData(sessionId, {
          lastSearch: query,
          searchCount: (this.sessionData.get(sessionId)?.searchCount || 0) + 1,
          lastActivity: new Date().toISOString(),
        });
      }

      // Log analytics data (in production, this would go to analytics service)
      this.logAnalytics('search', {
        query: this.sanitizeQuery(query),
        resultCount,
        searchStrategy,
        queryTime,
        cacheHit,
        userAgent: this.sanitizeUserAgent(userAgent),
        sessionId,
        timestamp: event.timestamp,
      });
    } catch (error) {
      console.error(
        'GameAnalyticsHandler: Error handling search analytics:',
        error
      );
    }
  };

  /**
   * Handle game searched events
   */
  handleGameSearched: EventHandler<GameSearchedEvent> = async event => {
    try {
      const { query, results, performance } = event.data;

      // Create search analytics event
      const searchAnalyticsEvent: SearchAnalyticsEvent = {
        eventType: 'analytics.search',
        timestamp: new Date().toISOString(),
        eventId: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'bgg-analytics',
        data: {
          query,
          resultCount: results.itemsCount,
          searchStrategy: results.searchStrategy,
          queryTime: performance.queryTime,
          cacheHit: performance.cacheHit,
        },
      };

      await this.handleSearchAnalytics(searchAnalyticsEvent);
    } catch (error) {
      console.error(
        'GameAnalyticsHandler: Error handling game searched event:',
        error
      );
    }
  };

  /**
   * Handle game view analytics events
   */
  handleGameViewAnalytics: EventHandler<GameViewAnalyticsEvent> =
    async event => {
      try {
        const { gameId, gameName, source, viewTime, userAgent, sessionId } =
          event.data;

        // Track game views
        this.trackGameView(gameId, gameName, source);

        // Track session data
        if (sessionId) {
          this.trackSessionData(sessionId, {
            lastGameView: gameId,
            gameViewCount:
              (this.sessionData.get(sessionId)?.gameViewCount || 0) + 1,
            lastActivity: new Date().toISOString(),
          });
        }

        // Log analytics data
        this.logAnalytics('game_view', {
          gameId,
          gameName: this.sanitizeGameName(gameName),
          source,
          viewTime,
          userAgent: this.sanitizeUserAgent(userAgent),
          sessionId,
          timestamp: event.timestamp,
        });
      } catch (error) {
        console.error(
          'GameAnalyticsHandler: Error handling game view analytics:',
          error
        );
      }
    };

  /**
   * Handle game details fetched events
   */
  handleGameDetailsFetched: EventHandler<GameDetailsFetchedEvent> =
    async event => {
      try {
        const { gameId, gameName, gameType, performance } = event.data;

        // Create game view analytics event
        const gameViewEvent: GameViewAnalyticsEvent = {
          eventType: 'analytics.game.view',
          timestamp: new Date().toISOString(),
          eventId: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'bgg-analytics',
          data: {
            gameId,
            gameName,
            source: 'search', // Default source, could be enhanced
          },
        };

        await this.handleGameViewAnalytics(gameViewEvent);
      } catch (error) {
        console.error(
          'GameAnalyticsHandler: Error handling game details fetched event:',
          error
        );
      }
    };

  /**
   * Handle performance metrics events
   */
  handlePerformanceMetrics: EventHandler<PerformanceMetricsEvent> =
    async event => {
      try {
        const { operation, metrics, timestamp } = event.data;

        // Track performance metrics
        this.trackPerformanceMetrics(operation, metrics);

        // Log performance data
        this.logAnalytics('performance', {
          operation,
          metrics,
          timestamp,
        });
      } catch (error) {
        console.error(
          'GameAnalyticsHandler: Error handling performance metrics:',
          error
        );
      }
    };

  /**
   * Track search patterns
   */
  private trackSearchPattern(
    query: string,
    resultCount: number,
    searchStrategy: string
  ): void {
    const normalizedQuery = query.toLowerCase().trim();

    // Track query frequency
    this.searchHistory.set(
      normalizedQuery,
      (this.searchHistory.get(normalizedQuery) || 0) + 1
    );

    // Track search strategy effectiveness
    const strategyKey = `${searchStrategy}_${resultCount > 0 ? 'success' : 'empty'}`;
    this.searchHistory.set(
      strategyKey,
      (this.searchHistory.get(strategyKey) || 0) + 1
    );
  }

  /**
   * Track search performance
   */
  private trackSearchPerformance(queryTime: number, cacheHit: boolean): void {
    this.performanceMetrics.push({
      operation: 'search',
      responseTime: queryTime,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 1000 performance entries
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  /**
   * Track game views
   */
  private trackGameView(
    gameId: string,
    gameName: string,
    source: string
  ): void {
    const viewKey = `${gameId}_${source}`;
    this.gameViews.set(viewKey, (this.gameViews.get(viewKey) || 0) + 1);
  }

  /**
   * Track performance metrics
   */
  private trackPerformanceMetrics(operation: string, metrics: any): void {
    this.performanceMetrics.push({
      operation,
      responseTime: metrics.responseTime,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track session data
   */
  private trackSessionData(sessionId: string, data: any): void {
    const existingData = this.sessionData.get(sessionId) || {};
    this.sessionData.set(sessionId, { ...existingData, ...data });
  }

  /**
   * Log analytics data (placeholder for actual analytics service)
   */
  private logAnalytics(type: string, data: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${type}:`, data);
    }

    // In production, this would send to analytics service (PostHog, Mixpanel, etc.)
    // Example: analytics.track(type, data);
  }

  /**
   * Sanitize query for logging
   */
  private sanitizeQuery(query: string): string {
    // Remove potentially sensitive information
    return query.replace(/[<>\"']/g, '').substring(0, 100);
  }

  /**
   * Sanitize game name for logging
   */
  private sanitizeGameName(name: string): string {
    return name.replace(/[<>\"']/g, '').substring(0, 100);
  }

  /**
   * Sanitize user agent for logging
   */
  private sanitizeUserAgent(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;
    return userAgent.substring(0, 200);
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    searchHistory: Array<{ query: string; count: number }>;
    gameViews: Array<{ gameId: string; source: string; count: number }>;
    performanceMetrics: {
      averageResponseTime: number;
      totalOperations: number;
    };
    sessionCount: number;
  } {
    const searchHistory = Array.from(this.searchHistory.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 queries

    const gameViews = Array.from(this.gameViews.entries())
      .map(([key, count]) => {
        const [gameId, source] = key.split('_');
        return { gameId, source, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 game views

    const averageResponseTime =
      this.performanceMetrics.length > 0
        ? this.performanceMetrics.reduce(
            (sum, metric) => sum + metric.responseTime,
            0
          ) / this.performanceMetrics.length
        : 0;

    return {
      searchHistory,
      gameViews,
      performanceMetrics: {
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        totalOperations: this.performanceMetrics.length,
      },
      sessionCount: this.sessionData.size,
    };
  }

  /**
   * Clear analytics data
   */
  clearAnalytics(): void {
    this.searchHistory.clear();
    this.gameViews.clear();
    this.performanceMetrics = [];
    this.sessionData.clear();
  }
}

// Export singleton instance
export const gameAnalyticsHandler = new GameAnalyticsHandler();
