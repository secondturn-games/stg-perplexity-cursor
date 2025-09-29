/**
 * Optimized BGG Service
 * Enhanced version of BGGService with performance optimizations
 */

import { BGGService } from './BGGService';
import { BGGCacheOptimizer } from './optimizations/BGGCacheOptimizer';
import {
  BGGDatabaseOptimizer,
  type OptimizedGameQuery,
} from './optimizations/BGGDatabaseOptimizer';
import { BGGAPIOptimizer } from './optimizations/BGGAPIOptimizer';
import { CacheManager } from './CacheManager';
import { BGGAPIClient } from './BGGAPIClient';
import { SupabaseGameRepository } from '../repositories/SupabaseGameRepository';
import {
  BGGSearchResponse,
  BGGSearchItem,
  BGGGameDetails,
  BGGCollectionResponse,
  BGGError,
  SearchFilters,
} from '@/types/bgg.types';
import { Game } from '@/types/database.types';
import { getBGGConfig } from './config';

export class BGGServiceOptimized extends BGGService {
  private cacheOptimizer: BGGCacheOptimizer;
  private databaseOptimizer: BGGDatabaseOptimizer;
  private apiOptimizer: BGGAPIOptimizer;

  constructor() {
    super();

    // Initialize optimizers
    this.cacheOptimizer = new BGGCacheOptimizer(this.cacheManager);
    this.databaseOptimizer = new BGGDatabaseOptimizer();

    this.apiOptimizer = new BGGAPIOptimizer(this.apiClient, {
      adaptiveRateLimit: true,
      predictiveCaching: true,
      batchOptimization: true,
      fallbackStrategy: 'cache',
    });

    // Start background optimizations
    this.startBackgroundOptimizations();
  }

  /**
   * Optimized search with database-first approach
   */
  async searchGamesOptimized(
    query: string,
    filters: SearchFilters = {}
  ): Promise<BGGSearchResponse> {
    const startTime = Date.now();

    // Validate query
    if (!query || query.trim().length < 2) {
      throw new BGGError(
        'VALIDATION_ERROR',
        'Query must be at least 2 characters long',
        { query },
        undefined,
        'Please enter at least 2 characters to search'
      );
    }

    const normalizedQuery = query.trim();

    // Check cache first
    const cached = this.cacheOptimizer.getCachedData<BGGSearchResponse>(
      'search',
      normalizedQuery,
      filters
    );
    if (cached) {
      return {
        items: cached.items || [],
        total: cached.total || 0,
        searchStrategy: cached.searchStrategy || 'exact',
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: true,
          apiCalls: 0,
        },
      };
    }

    try {
      // Try database search first for better performance
      const dbResults = await this.searchDatabaseFirst(
        normalizedQuery,
        filters
      );

      if (dbResults.length > 0) {
        // Create search response from database results
        const searchResponse: BGGSearchResponse = {
          items: dbResults,
          total: dbResults.length,
          searchStrategy: 'exact' as const,
          performance: {
            queryTime: Date.now() - startTime,
            cacheHit: false,
            apiCalls: 0,
          },
        };

        // Cache the database results
        this.cacheOptimizer.cacheData(
          'search',
          normalizedQuery,
          searchResponse,
          filters
        );

        return searchResponse;
      }

      // Fall back to BGG API if no database results
      console.log(
        `🔍 No database results for "${normalizedQuery}", falling back to BGG API`
      );
      const apiResults = await super.searchGames(normalizedQuery, filters);

      // Cache API results
      this.cacheOptimizer.cacheData(
        'search',
        normalizedQuery,
        apiResults,
        filters
      );

      return apiResults;
    } catch (error) {
      console.error(`❌ Search failed for "${normalizedQuery}":`, error);
      throw error;
    }
  }

  /**
   * Optimized game details with intelligent caching
   */
  async getGameDetailsOptimized(gameId: string): Promise<BGGGameDetails> {
    const startTime = Date.now();

    // Check cache first
    const cached = this.cacheOptimizer.getCachedData<BGGGameDetails>(
      'game-details',
      gameId
    );
    if (cached) {
      return cached;
    }

    // Check database first
    try {
      const dbGame = await this.databaseOptimizer.getGameByBggId(
        parseInt(gameId)
      );
      if (dbGame && this.isGameDataFresh(dbGame)) {
        console.log(`✅ Database cache hit for game ${gameId}`);

        const gameDetails = this.convertDbGameToBGGDetails(dbGame);

        // Cache in memory
        this.cacheOptimizer.cacheData('game-details', gameId, gameDetails);

        return gameDetails;
      }
    } catch (error) {
      console.warn(`Database lookup failed for game ${gameId}:`, error);
    }

    // Fall back to BGG API with optimization
    try {
      const gameDetails = await this.apiOptimizer.adaptiveRequest(
        () => super.getGameDetails(gameId),
        `game-details-${gameId}`
      );

      // Cache the result
      this.cacheOptimizer.cacheData('game-details', gameId, gameDetails);

      return gameDetails;
    } catch (error) {
      console.error(`❌ Failed to get game details for ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Optimized bulk sync with intelligent batching
   */
  async syncStaleGamesOptimized(limit: number = 10): Promise<void> {
    try {
      console.log(`🔄 Starting optimized sync of stale games...`);

      // Get stale games with priority ordering
      const staleGames = await this.databaseOptimizer.getStaleGames({
        maxAge: 24,
        limit,
        priority: 'high', // Prioritize popular games
      });

      if (staleGames.length === 0) {
        console.log('✅ No stale games found');
        return;
      }

      console.log(`🔄 Found ${staleGames.length} stale games to sync`);

      // Process in optimized batches
      const gameIds = staleGames.map(game => game.bgg_id!.toString());
      const batchResults = await this.apiOptimizer.batchGameDetails(gameIds);

      // Bulk update database
      const gamesToUpdate = Array.from(batchResults.values()).map(details =>
        this.convertBGGDetailsToDbGame(details)
      );

      if (gamesToUpdate.length > 0) {
        await this.databaseOptimizer.bulkUpsertGames(gamesToUpdate);
        console.log(
          `✅ Bulk updated ${gamesToUpdate.length} games in database`
        );
      }

      // Update sync timestamps
      const updatedGameIds = staleGames
        .filter(game => batchResults.has(game.bgg_id!.toString()))
        .map(game => game.id);

      await this.databaseOptimizer.updateLastSync(updatedGameIds);

      console.log(
        `✅ Completed optimized sync of ${staleGames.length} stale games`
      );
    } catch (error) {
      console.error('❌ Optimized sync failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getOptimizationMetrics() {
    const [apiMetrics, dbStats, cacheStats] = await Promise.all([
      this.apiOptimizer.getMetrics(),
      this.databaseOptimizer.getDatabaseCacheStats(),
      this.cacheManager.getCacheStats(),
    ]);

    return {
      api: apiMetrics,
      database: dbStats,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Start background optimization tasks
   */
  private startBackgroundOptimizations(): void {
    // Cache warming for popular searches
    setTimeout(() => {
      this.warmCacheForPopularSearches();
    }, 30000); // Start after 30 seconds

    // Predictive cache warming during low-traffic hours
    const schedulePredictiveWarming = () => {
      const now = new Date();
      const nextLowTraffic = new Date(now);
      nextLowTraffic.setHours(2, 0, 0, 0); // 2 AM
      if (nextLowTraffic <= now) {
        nextLowTraffic.setDate(nextLowTraffic.getDate() + 1);
      }

      const delay = nextLowTraffic.getTime() - now.getTime();
      setTimeout(() => {
        this.startPredictiveWarming();
        schedulePredictiveWarming(); // Schedule next day
      }, delay);
    };

    schedulePredictiveWarming();
  }

  /**
   * Warm cache for popular searches
   */
  private async warmCacheForPopularSearches(): Promise<void> {
    try {
      await this.cacheOptimizer.warmCacheForPopularSearches();
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  }

  /**
   * Start predictive cache warming
   */
  private async startPredictiveWarming(): Promise<void> {
    try {
      const popularGames = await this.databaseOptimizer.getPopularGames(50);
      const popularTerms = popularGames.map(game => game.title);

      await this.apiOptimizer.predictiveCacheWarming(popularTerms);
    } catch (error) {
      console.warn('Predictive warming failed:', error);
    }
  }

  /**
   * Search database first before hitting BGG API
   */
  private async searchDatabaseFirst(
    query: string,
    filters: SearchFilters
  ): Promise<BGGSearchItem[]> {
    try {
      const dbQuery: OptimizedGameQuery = {
        searchTerm: query,
        categories: filters.categories || [],
        mechanics: filters.mechanics || [],
        minPlayers: filters.minPlayers || 1,
        maxPlayers: filters.maxPlayers || 10,
        minRating: filters.minRating || 0,
        limit: 20, // Limit database results
        sortBy: 'relevance' as const,
      };

      const games = await this.databaseOptimizer.searchGamesInDatabase(dbQuery);

      // Convert Game[] to BGGSearchItem[]
      return games.map(game => ({
        id: game.bgg_id?.toString() || game.id,
        name: game.title,
        yearpublished: game.year_published?.toString() || '0',
        type: 'boardgame' as const,
        thumbnail: game.thumbnail_url || '',
        searchScore: 0.8, // Default score for database results
        isExactMatch: false,
        isExpansion: false,
        hasInboundExpansionLink: false,
        correctedType: 'base-game' as const,
        relevanceFactors: {
          nameMatch: 0.8,
          yearMatch: 0.5,
          typeMatch: 1.0,
          popularity: 0.6,
        },
        bggLink: `https://boardgamegeek.com/boardgame/${game.bgg_id || game.id}`,
        displayYear: game.year_published?.toString() || 'Unknown',
        typeDisplay: 'Board Game',
        isHighQuality: true,
        ageInYears: game.year_published
          ? new Date().getFullYear() - game.year_published
          : 0,
      }));
    } catch (error) {
      console.warn('Database search failed:', error);
      return [];
    }
  }

  /**
   * Check if game data is fresh enough
   */
  private isGameDataFresh(game: Game): boolean {
    if (!game.last_bgg_sync) {
      return false;
    }

    const syncTime = new Date(game.last_bgg_sync);
    const now = new Date();
    const hoursSinceSync =
      (now.getTime() - syncTime.getTime()) / (1000 * 60 * 60);

    return hoursSinceSync < 24; // Consider fresh if synced within 24 hours
  }

  /**
   * Calculate search score for database results
   */
  private calculateSearchScore(game: Game, query: string): number {
    let score = 0;

    // Name match score
    const nameMatch = this.calculateNameMatch(game.title, query);
    score += nameMatch * 100;

    // Rating score (popularity)
    if (game.bgg_rating) {
      score += game.bgg_rating * 10;
    }

    // Rank score (lower rank = higher score)
    if (game.bgg_rank && game.bgg_rank > 0) {
      score += Math.max(0, 1000 - game.bgg_rank) / 10;
    }

    return Math.round(score);
  }

  /**
   * Calculate name match score
   */
  private calculateNameMatch(title: string, query: string): number {
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();

    if (titleLower === queryLower) {
      return 1.0;
    }

    if (titleLower.startsWith(queryLower)) {
      return 0.9;
    }

    if (titleLower.includes(queryLower)) {
      return 0.7;
    }

    // Simple fuzzy matching
    const words = queryLower.split(' ');
    let matchCount = 0;
    for (const word of words) {
      if (titleLower.includes(word)) {
        matchCount++;
      }
    }

    return matchCount / words.length;
  }

  /**
   * Convert BGGGameDetails to database Game format
   */
  private convertBGGDetailsToDbGame(details: BGGGameDetails): Partial<Game> {
    return {
      bgg_id: parseInt(details.id),
      title: details.name,
      description: details.description,
      year_published: details.yearpublished,
      min_players: details.minplayers,
      max_players: details.maxplayers,
      playing_time: details.playingtime,
      complexity_rating: details.weight_rating,
      image_url: details.image,
      thumbnail_url: details.thumbnail,
      categories: details.categories || [],
      mechanics: details.mechanics || [],
      designers: details.designers || [],
      artists: details.artists || [],
      publishers: details.publishers || [],
      languages: details.languages || [],
      age_rating: details.age_rating,
      bgg_rating: details.bgg_rating,
      bgg_rank: details.bgg_rank,
      weight_rating: details.weight_rating,
      last_bgg_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
