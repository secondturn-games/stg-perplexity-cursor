/**
 * BGG Service with Repository Pattern
 * Updated BGG service that uses dependency injection for repositories
 *
 * This service orchestrates all BGG operations while using injected repositories
 * for data persistence and caching, following the Repository pattern for better
 * testability and maintainability.
 */

import { BGGAPIClient } from './BGGAPIClient';
import { SearchEngine } from './SearchEngine';
import type { IExtendedGameRepository } from '@/lib/repositories/interfaces/IGameRepository';
import type { ICacheRepository } from '@/lib/repositories/interfaces/ICacheRepository';
import {
  BGGSearchResponse,
  BGGGameDetails,
  BGGCollectionResponse,
  BGGError,
  SearchFilters,
  BGGDataUtils,
} from '@/types/bgg.types';
import type { Game } from '@/types/database.types';
import { getBGGConfig } from './config';

/**
 * Configuration interface for BGG service dependencies
 */
export interface BGGServiceConfig {
  gameRepository: IExtendedGameRepository<Game>;
  cacheRepository: ICacheRepository;
  apiClient?: BGGAPIClient;
  searchEngine?: SearchEngine;
  config?: any;
}

/**
 * BGG Service with Repository Pattern Implementation
 *
 * This service uses dependency injection to receive repository instances,
 * making it more testable and flexible than the original implementation.
 *
 * @example
 * ```typescript
 * const gameRepo = new SupabaseGameRepository();
 * const cacheRepo = new MemoryCacheRepository();
 * const bggService = new BGGServiceWithRepositories({
 *   gameRepository: gameRepo,
 *   cacheRepository: cacheRepo
 * });
 *
 * const results = await bggService.searchGames('Catan');
 * ```
 */
export class BGGServiceWithRepositories {
  private readonly gameRepository: IExtendedGameRepository<Game>;
  private readonly cacheRepository: ICacheRepository;
  private readonly apiClient: BGGAPIClient;
  private readonly searchEngine: SearchEngine;
  private readonly config: any;

  constructor(dependencies: BGGServiceConfig) {
    this.gameRepository = dependencies.gameRepository;
    this.cacheRepository = dependencies.cacheRepository;
    this.config = dependencies.config || getBGGConfig();

    // Initialize API client and search engine
    this.apiClient = dependencies.apiClient || new BGGAPIClient(this.config);
    this.searchEngine = dependencies.searchEngine || new SearchEngine();
  }

  /**
   * Search for games with caching and database integration
   *
   * @param query - Search query string
   * @param filters - Search filters
   * @returns Promise resolving to search results
   *
   * @example
   * ```typescript
   * const results = await bggService.searchGames('Catan', {
   *   gameType: 'base-game',
   *   minRating: 7.0
   * });
   * console.log(`Found ${results.items.length} games`);
   * ```
   */
  async searchGames(
    query: string,
    filters: SearchFilters = {}
  ): Promise<BGGSearchResponse> {
    const startTime = Date.now();
    let apiCalls = 0;
    let cacheHit = false;

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
    const filterKey =
      Object.keys(filters).length > 0
        ? Object.entries(filters)
            .map(([k, v]) => `${k}:${v}`)
            .join(',')
        : 'default';
    const cacheKey = `search:${normalizedQuery}:${filterKey}`;

    // Check cache first
    try {
      const cached =
        await this.cacheRepository.get<BGGSearchResponse>(cacheKey);
      if (cached) {
        cacheHit = true;
        return {
          ...cached,
          performance: {
            queryTime: Date.now() - startTime,
            cacheHit: true,
            apiCalls: 0,
          },
        };
      }
    } catch (error) {
      console.warn('Cache retrieval failed, proceeding with API call:', error);
    }

    try {
      let results: BGGSearchResponse | null = null;
      const searchStrategy: 'exact' | 'fuzzy' | 'fallback' = 'fuzzy';

      // Perform search based on game type filter
      if (filters.gameType === 'all') {
        // Search for both base games and expansions
        const baseGameResults = await this.performTypedSearch(
          normalizedQuery,
          'boardgame',
          filters.exactMatch !== false,
          apiCalls
        );
        apiCalls = baseGameResults.apiCalls;

        const expansionResults = await this.performTypedSearch(
          normalizedQuery,
          'boardgameexpansion',
          filters.exactMatch !== false,
          apiCalls
        );
        apiCalls = expansionResults.apiCalls;

        // Combine and deduplicate results
        const combinedItems = [
          ...baseGameResults.results.items,
          ...expansionResults.results.items,
        ];
        const deduplicatedItems = this.deduplicateSearchResults(combinedItems);

        results = {
          items: deduplicatedItems,
          total: deduplicatedItems.length,
          searchStrategy: 'exact',
          performance: {
            queryTime: 0,
            cacheHit: false,
            apiCalls: apiCalls,
          },
        };
      } else {
        // Single type search
        const gameType =
          filters.gameType === 'base-game'
            ? 'boardgame'
            : filters.gameType === 'expansion'
              ? 'boardgameexpansion'
              : filters.gameType === 'accessory'
                ? 'boardgameaccessory'
                : 'boardgame';

        const typedSearchResult = await this.performTypedSearch(
          normalizedQuery,
          gameType,
          filters.exactMatch !== false,
          apiCalls
        );
        apiCalls = typedSearchResult.apiCalls;
        results = typedSearchResult.results;
      }

      // Sort by search score
      results.items.sort((a, b) => b.searchScore - a.searchScore);

      // Enhance top results with additional metadata
      if (results.items.length > 0) {
        results = await this.enhanceTopSearchResults(results, normalizedQuery);
      }

      // Add performance metadata
      const queryTime = Date.now() - startTime;
      results.searchStrategy = searchStrategy;
      results.performance = {
        queryTime,
        cacheHit: false,
        apiCalls,
      };

      // Cache the result
      try {
        await this.cacheRepository.set(
          cacheKey,
          results,
          this.config.cache?.ttl
        );
      } catch (error) {
        console.warn('Failed to cache search results:', error);
      }

      console.log(
        `✅ Search completed in ${queryTime}ms, found ${results.items.length} results using ${searchStrategy} strategy`
      );
      return results;
    } catch (error) {
      const bggError = this.handleError('searchGames', error);
      throw bggError;
    }
  }

  /**
   * Get game details with database caching
   *
   * @param gameId - BGG game ID
   * @returns Promise resolving to game details
   *
   * @example
   * ```typescript
   * const gameDetails = await bggService.getGameDetails('12345');
   * console.log(`Game: ${gameDetails.name}`);
   * ```
   */
  async getGameDetails(gameId: string): Promise<BGGGameDetails> {
    const cacheKey = `game:${gameId}`;

    // Check cache first
    try {
      const cached = await this.cacheRepository.get<BGGGameDetails>(cacheKey);
      if (cached) {
        console.log(`✅ Cache hit for game ${gameId}`);
        return cached;
      }
    } catch (error) {
      console.warn('Cache retrieval failed, proceeding with API call:', error);
    }

    // Check database for existing game
    try {
      const existingGame = await this.gameRepository.findByBggId(
        parseInt(gameId)
      );
      if (existingGame && existingGame.last_bgg_sync) {
        // Game exists and was synced recently, use cached version
        const gameDetails = this.mapGameToBGGDetails(existingGame);
        try {
          await this.cacheRepository.set(
            cacheKey,
            gameDetails,
            this.config.cache?.ttl
          );
        } catch (error) {
          console.warn('Failed to cache game details:', error);
        }
        return gameDetails;
      }
    } catch (error) {
      console.warn('Database lookup failed, proceeding with API call:', error);
    }

    let lastError: any;

    // Fetch from BGG API with retry logic
    for (let attempt = 1; attempt <= this.config.retry.maxAttempts; attempt++) {
      try {
        console.log(
          `🔍 Getting game details for ID: ${gameId} (attempt ${attempt}/${this.config.retry.maxAttempts})`
        );

        const response = await this.apiClient.getGameDetails(gameId);
        const data = await this.parseXML(response, false);
        const result = this.transformGameDetails(data);

        // Enhance with inbound link analysis
        const enhancedResult = await this.enhanceGameDetailsWithInboundAnalysis(
          result,
          data
        );

        // Store in database
        try {
          await this.gameRepository.upsert(enhancedResult);
          console.log(`✅ Stored game details in database for ID: ${gameId}`);
        } catch (error) {
          console.warn('Failed to store game in database:', error);
        }

        // Cache the result
        try {
          await this.cacheRepository.set(
            cacheKey,
            enhancedResult,
            this.config.cache?.ttl
          );
        } catch (error) {
          console.warn('Failed to cache game details:', error);
        }

        console.log(`✅ Successfully got game details for ID: ${gameId}`);
        return enhancedResult;
      } catch (error) {
        lastError = error;
        console.error(
          `❌ Attempt ${attempt} failed for game ${gameId}:`,
          error
        );

        // Handle rate limiting
        if (
          error instanceof BGGError &&
          error.code === 'RATE_LIMIT' &&
          attempt < this.config.retry.maxAttempts
        ) {
          const retryDelay = Math.min(
            this.config.retry.baseDelay *
              Math.pow(this.config.retry.backoffMultiplier, attempt - 1),
            this.config.retry.maxDelay
          );
          console.log(
            `⏳ Rate limited, waiting ${retryDelay}ms before retry ${attempt + 1}`
          );
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        break;
      }
    }

    const bggError = this.handleError('getGameDetails', lastError);
    throw bggError;
  }

  /**
   * Get user collection with caching
   *
   * @param username - BGG username
   * @returns Promise resolving to collection response
   *
   * @example
   * ```typescript
   * const collection = await bggService.getUserCollection('username');
   * console.log(`Found ${collection.items.length} games in collection`);
   * ```
   */
  async getUserCollection(username: string): Promise<BGGCollectionResponse> {
    const cacheKey = `collection:${username}`;

    // Check cache first
    try {
      const cached =
        await this.cacheRepository.get<BGGCollectionResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.warn('Cache retrieval failed, proceeding with API call:', error);
    }

    try {
      const response = await this.apiClient.getUserCollection(username);
      const data = await this.parseXML(response, false);
      const result = this.transformCollectionResponse(data);

      // Cache the result
      try {
        await this.cacheRepository.set(
          cacheKey,
          result,
          this.config.cache?.ttl
        );
      } catch (error) {
        console.warn('Failed to cache collection:', error);
      }

      return result;
    } catch (error) {
      const bggError = this.handleError('getUserCollection', error);
      throw bggError;
    }
  }

  /**
   * Sync games from BGG to database
   *
   * @param gameIds - Array of BGG game IDs to sync
   * @returns Promise resolving to array of synced games
   *
   * @example
   * ```typescript
   * const syncedGames = await bggService.syncGamesToDatabase(['12345', '67890']);
   * console.log(`Synced ${syncedGames.length} games to database`);
   * ```
   */
  async syncGamesToDatabase(gameIds: string[]): Promise<Game[]> {
    try {
      console.log(`🔄 Starting sync of ${gameIds.length} games to database`);

      const bggGames: BGGGameDetails[] = [];

      // Fetch game details from BGG API
      for (const gameId of gameIds) {
        try {
          const gameDetails = await this.getGameDetails(gameId);
          bggGames.push(gameDetails);
        } catch (error) {
          console.warn(`Failed to fetch game ${gameId}:`, error);
        }
      }

      // Bulk upsert to database
      const syncedGames = await this.gameRepository.bulkUpsert(bggGames);

      console.log(
        `✅ Successfully synced ${syncedGames.length} games to database`
      );
      return syncedGames;
    } catch (error) {
      throw new Error(
        `Failed to sync games to database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get stale games that need BGG synchronization
   *
   * @param limit - Maximum number of games to return
   * @returns Promise resolving to array of stale games
   *
   * @example
   * ```typescript
   * const staleGames = await bggService.getStaleGames(10);
   * console.log(`Found ${staleGames.length} games needing sync`);
   * ```
   */
  async getStaleGames(limit: number = 50): Promise<Game[]> {
    try {
      return await this.gameRepository.getStaleGames(limit);
    } catch (error) {
      throw new Error(
        `Failed to get stale games: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get cache statistics
   *
   * @returns Promise resolving to cache statistics
   *
   * @example
   * ```typescript
   * const stats = await bggService.getCacheStats();
   * console.log(`Cache hit rate: ${stats.hitRate}%`);
   * ```
   */
  async getCacheStats() {
    try {
      return await this.cacheRepository.getStats();
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return {
        size: 0,
        hitRate: 0,
        totalQueries: 0,
        totalHits: 0,
        totalMisses: 0,
        memoryUsage: 0,
        averageQueryTime: 0,
        lastCleanup: new Date(),
        evictions: 0,
      };
    }
  }

  /**
   * Clear cache
   *
   * @example
   * ```typescript
   * await bggService.clearCache();
   * console.log('Cache cleared');
   * ```
   */
  async clearCache(): Promise<void> {
    try {
      await this.cacheRepository.clear();
      console.log('✅ Cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Clear cache for specific pattern
   *
   * @param pattern - Pattern to match keys
   * @example
   * ```typescript
   * await bggService.clearCachePattern('game:*');
   * console.log('Game cache cleared');
   * ```
   */
  async clearCachePattern(pattern: string): Promise<void> {
    try {
      const invalidated = await this.cacheRepository.invalidate(pattern);
      console.log(
        `✅ Invalidated ${invalidated} cache entries matching pattern: ${pattern}`
      );
    } catch (error) {
      console.warn('Failed to clear cache pattern:', error);
    }
  }

  // Private helper methods (simplified versions from original BGGService)

  /**
   * Perform search for a specific game type
   */
  private async performTypedSearch(
    query: string,
    type: string,
    tryExact: boolean,
    currentApiCalls: number
  ): Promise<{ results: BGGSearchResponse; apiCalls: number }> {
    let apiCalls = currentApiCalls;
    let results: BGGSearchResponse | null = null;

    // Try exact search first if requested and query is long enough
    if (tryExact && query.length >= this.config.search.exactSearchThreshold) {
      try {
        console.log(`🔍 Trying exact search for ${type}: "${query}"`);
        const exactResponse = await this.apiClient.searchGamesByType(
          query,
          type,
          true
        );
        const exactData = await this.parseXML(exactResponse, true);
        apiCalls++;

        const exactResults = this.transformSearchResponse(exactData);
        if (exactResults.items.length > 0) {
          results = this.searchEngine.enhanceSearchResults(
            exactResults,
            query,
            'exact'
          );
          console.log(
            `✅ Exact search found ${results.items.length} ${type} results`
          );
        }
      } catch (exactError) {
        console.log(`⚠️ Exact search failed for ${type}, trying fuzzy search`);
      }
    }

    // Fall back to fuzzy search if exact search failed or wasn't tried
    if (!results) {
      console.log(`🔍 Trying fuzzy search for ${type}: "${query}"`);
      const fuzzyResponse = await this.apiClient.searchGamesByType(
        query,
        type,
        false
      );
      const fuzzyData = await this.parseXML(fuzzyResponse, true);
      apiCalls++;

      const fuzzyResults = this.transformSearchResponse(fuzzyData);
      results = this.searchEngine.enhanceSearchResults(
        fuzzyResults,
        query,
        'fuzzy'
      );
      console.log(
        `✅ Fuzzy search found ${results.items.length} ${type} results`
      );
    }

    return { results, apiCalls };
  }

  /**
   * Deduplicate search results by ID
   */
  private deduplicateSearchResults(items: any[]): any[] {
    const itemMap = new Map<string, any>();

    for (const item of items) {
      const existingItem = itemMap.get(item.id);

      if (!existingItem) {
        itemMap.set(item.id, item);
      } else {
        const currentIsExpansion = item.type === 'boardgameexpansion';
        const existingIsExpansion = existingItem.type === 'boardgameexpansion';

        if (currentIsExpansion && !existingIsExpansion) {
          console.log(
            `🔍 Replacing base game with expansion for ID ${item.id}: "${item.name}"`
          );
          itemMap.set(item.id, item);
        } else if (!currentIsExpansion && existingIsExpansion) {
          console.log(
            `🔍 Keeping expansion over base game for ID ${item.id}: "${existingItem.name}"`
          );
        } else {
          if (item.searchScore > existingItem.searchScore) {
            itemMap.set(item.id, item);
          }
        }
      }
    }

    const deduplicatedItems = Array.from(itemMap.values());
    console.log(
      `🔍 Deduplicated ${items.length} items to ${deduplicatedItems.length} unique items`
    );

    return deduplicatedItems;
  }

  /**
   * Enhance top search results with additional metadata
   */
  private async enhanceTopSearchResults(
    results: BGGSearchResponse,
    query: string
  ): Promise<BGGSearchResponse> {
    try {
      const topResults = results.items.slice(0, 3);
      const enhancedItems = [...results.items];

      console.log(
        `🔍 Enhancing top ${topResults.length} search results with additional metadata`
      );

      for (let i = 0; i < topResults.length; i++) {
        const item = topResults[i];

        try {
          if (!item?.id) {
            console.warn(`⚠️ Skipping enhancement for item without ID:`, item);
            continue;
          }
          const gameDetails = await this.getGameDetails(item.id);

          enhancedItems[i] = {
            ...item,
            description: gameDetails.description,
            minPlayers: gameDetails.minplayers,
            maxPlayers: gameDetails.maxplayers,
            playTime: gameDetails.playingtime,
            rating: gameDetails.bgg_rating,
            hasInboundExpansionLink:
              (gameDetails as any).hasInboundExpansionLink || false,
            correctedType: (gameDetails as any).correctedType || 'base-game',
            isExpansion: (gameDetails as any).correctedType === 'expansion',
            relevanceFactors: {
              ...item.relevanceFactors,
              enhancedMetadata: true,
              detailedAnalysis: true,
            } as any,
          } as any;

          console.log(
            `✅ Enhanced result ${i + 1}: "${item.name}" with detailed metadata`
          );
        } catch (error) {
          console.warn(
            `⚠️ Failed to enhance result ${i + 1}: "${item?.name || 'Unknown'}"`,
            error
          );
        }
      }

      return {
        ...results,
        items: enhancedItems,
      };
    } catch (error) {
      console.warn(`⚠️ Failed to enhance top search results:`, error);
      return results;
    }
  }

  /**
   * Enhance game details with inbound link analysis
   */
  private async enhanceGameDetailsWithInboundAnalysis(
    gameDetails: BGGGameDetails,
    rawData: any
  ): Promise<BGGGameDetails> {
    try {
      const hasInboundExpansionLink =
        this.searchEngine.analyzeInboundLinks(rawData);

      const enhancedDetails = {
        ...gameDetails,
        hasInboundExpansionLink,
        correctedType: hasInboundExpansionLink
          ? 'expansion'
          : (gameDetails as any).correctedType || 'base-game',
      } as any;

      if (
        hasInboundExpansionLink &&
        (gameDetails as any).type !== 'boardgameexpansion'
      ) {
        console.log(
          `🔍 Corrected type for "${gameDetails.name}" from ${(gameDetails as any).type} to expansion based on inbound links`
        );
      }

      return enhancedDetails;
    } catch (error) {
      console.warn(
        `⚠️ Failed to enhance game details with inbound analysis:`,
        error
      );
      return gameDetails;
    }
  }

  /**
   * Map database Game to BGGGameDetails
   */
  private mapGameToBGGDetails(game: Game): BGGGameDetails {
    return BGGDataUtils.computeGameDetailsFields({
      id: game.bgg_id?.toString() || '',
      name: game.title,
      description: game.description || '',
      yearpublished: game.year_published || 0,
      minplayers: game.min_players || 0,
      maxplayers: game.max_players || 0,
      playingtime: game.playing_time || 0,
      minplaytime: game.playing_time || 0,
      maxplaytime: game.playing_time || 0,
      minage: game.age_rating || 0,
      image: game.image_url || '',
      thumbnail: game.thumbnail_url || '',
      categories: game.categories || [],
      mechanics: game.mechanics || [],
      designers: game.designers || [],
      artists: game.artists || [],
      publishers: game.publishers || [],
      bgg_rating: game.bgg_rating || 0,
      bgg_rank: game.bgg_rank || 0,
      weight_rating: game.weight_rating || 0,
      age_rating: game.age_rating || 0,
      last_bgg_sync: game.last_bgg_sync || new Date().toISOString(),
      // Enhanced fields
      alternateNames: [],
      editions: [],
      languageDependence: {
        description: 'Unknown',
        percentage: 0,
      },
    });
  }

  // Include the remaining private methods from the original BGGService
  // (parseXML, transformSearchResponse, transformGameDetails, etc.)
  // These would be copied from the original implementation

  private parseXML(xml: string, isSearchResponse: boolean = false): any {
    // Implementation from original BGGService
    console.log('Parsing XML response:', xml.substring(0, 200) + '...');
    // ... rest of implementation
    return {};
  }

  private transformSearchResponse(data: any): BGGSearchResponse {
    // Implementation from original BGGService
    return {
      items: [],
      total: 0,
      searchStrategy: 'fuzzy',
      performance: {
        queryTime: 0,
        cacheHit: false,
        apiCalls: 0,
      },
    };
  }

  private transformGameDetails(data: any): BGGGameDetails {
    // Implementation from original BGGService
    return {} as BGGGameDetails;
  }

  private transformCollectionResponse(data: any): BGGCollectionResponse {
    // Implementation from original BGGService
    return {
      items: [],
      total: 0,
    };
  }

  private handleError(operation: string, error: any): BGGError {
    // Implementation from original BGGService
    return BGGDataUtils.fromError(error, operation);
  }
}
