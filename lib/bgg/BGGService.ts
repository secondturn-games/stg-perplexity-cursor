/**
 * BGG Service
 * Main service that orchestrates all BGG operations
 */

import { BGGAPIClient } from './BGGAPIClient';
import { CacheManager } from './CacheManager';
import { SearchEngine } from './SearchEngine';
import {
  BGGSearchResponse,
  BGGGameDetails,
  BGGCollectionResponse,
  BGGError,
  SearchFilters,
  BGGDataUtils,
  BGGAlternateName,
  BGGEdition,
  BGGLanguageDependence,
} from '@/types/bgg.types';
import { getBGGConfig } from './config';
import { eventBus } from '../events/EventBus';
import { BGGEventFactory } from '../events/BGGEvents';
import { FallbackStrategies } from '../resilience/FallbackStrategies';
import * as xml2js from 'xml2js';

export class BGGService {
  private apiClient: BGGAPIClient;
  private cacheManager: CacheManager;
  private searchEngine: SearchEngine;
  private config: any;

  constructor() {
    this.config = getBGGConfig();
    this.apiClient = new BGGAPIClient(this.config);
    this.cacheManager = new CacheManager(this.config);
    this.searchEngine = new SearchEngine();
  }

  /**
   * Search for games
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
      const error = new BGGError(
        'VALIDATION_ERROR',
        'Query must be at least 2 characters long',
        { query },
        undefined,
        'Please enter at least 2 characters to search'
      );

      // Emit search failed event
      await eventBus.emit(
        'game.search.failed',
        BGGEventFactory.createGameSearchFailedEvent(query, filters, error)
      );

      throw error;
    }

    const normalizedQuery = query.trim();
    // Create a more efficient cache key to reduce string size
    const filterKey =
      Object.keys(filters).length > 0
        ? Object.entries(filters)
            .map(([k, v]) => `${k}:${v}`)
            .join(',')
        : 'default';
    const cacheKey = `search:${normalizedQuery}:${filterKey}`;

    // Check cache first
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      cacheHit = true;
      const queryTime = Date.now() - startTime;

      // Emit cache hit event
      await eventBus.emit(
        'cache.hit',
        BGGEventFactory.createCacheHitEvent(
          cacheKey,
          'search',
          Date.now() - (cached as any).timestamp || 0,
          undefined,
          normalizedQuery
        )
      );

      return {
        ...cached,
        performance: {
          queryTime,
          cacheHit: true,
          apiCalls: 0,
        },
      };
    }

    // Emit cache miss event
    await eventBus.emit(
      'cache.miss',
      BGGEventFactory.createCacheMissEvent(
        cacheKey,
        'search',
        undefined,
        normalizedQuery
      )
    );

    try {
      let results: BGGSearchResponse | null = null;
      const searchStrategy: 'exact' | 'fuzzy' | 'fallback' = 'fuzzy';

      // Implement two-step approach for accurate type classification
      if (filters.gameType === 'all') {
        // Step 1: Search for base games
        console.log(`🔍 Searching base games for "${normalizedQuery}"`);
        const baseGameResults = await this.performTypedSearch(
          normalizedQuery,
          'boardgame',
          filters.exactMatch !== false,
          apiCalls
        );
        apiCalls = baseGameResults.apiCalls;

        // Step 2: Search for expansions
        console.log(`🔍 Searching expansions for "${normalizedQuery}"`);
        const expansionResults = await this.performTypedSearch(
          normalizedQuery,
          'boardgameexpansion',
          filters.exactMatch !== false,
          apiCalls
        );
        apiCalls = expansionResults.apiCalls;

        // Combine results and deduplicate by ID
        const combinedItems = [
          ...baseGameResults.results.items,
          ...expansionResults.results.items,
        ];

        // Deduplicate by ID, preferring expansion over base game when both exist
        const deduplicatedItems = this.deduplicateSearchResults(combinedItems);

        results = {
          items: deduplicatedItems,
          total: deduplicatedItems.length,
          searchStrategy: 'exact', // Combined exact searches
          performance: {
            queryTime: 0, // Will be set later
            cacheHit: false,
            apiCalls: apiCalls,
          },
        };

        console.log(
          `✅ Combined search found ${results.items.length} results (${baseGameResults.results.items.length} base games, ${expansionResults.results.items.length} expansions)`
        );
      } else {
        // Single type search for specific game types
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

      // Enhance top results with additional metadata (optional, for better UX)
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

      // Record performance metrics
      this.cacheManager.recordPerformance(queryTime);

      // Store in database cache
      await this.cacheSearchInDatabase(normalizedQuery, results);

      // Cache the result
      this.cacheManager.set(cacheKey, results);

      // Emit game cached event
      await eventBus.emit(
        'game.cached',
        BGGEventFactory.createGameCachedEvent(
          cacheKey,
          'search',
          this.config.cache.ttl,
          JSON.stringify(results).length,
          undefined,
          normalizedQuery
        )
      );

      // Emit game searched event
      await eventBus.emit(
        'game.searched',
        BGGEventFactory.createGameSearchedEvent(
          normalizedQuery,
          filters,
          results,
          {
            queryTime,
            cacheHit: false,
            apiCalls,
          }
        )
      );

      console.log(
        `✅ Search completed in ${queryTime}ms, found ${results.items.length} results using ${searchStrategy} strategy`
      );
      return results;
    } catch (error) {
      const bggError = this.handleError('searchGames', error);

      // Check if we should use fallback strategies
      if (FallbackStrategies.shouldUseFallback(bggError)) {
        console.log(
          '🔄 Using fallback strategy for search due to error:',
          bggError.code
        );

        try {
          const fallbackResults =
            await FallbackStrategies.getFallbackSearchResults({
              query: normalizedQuery,
              filters,
              maxResults: 10,
              includePartialData: true,
            });

          const queryTime = Date.now() - startTime;

          // Emit fallback search event
          await eventBus.emit(
            'game.searched',
            BGGEventFactory.createGameSearchedEvent(
              normalizedQuery,
              filters,
              fallbackResults,
              {
                queryTime,
                cacheHit: false,
                apiCalls: 0,
              }
            )
          );

          console.log(
            `✅ Fallback search completed in ${queryTime}ms, found ${fallbackResults.items.length} results`
          );
          return fallbackResults;
        } catch (fallbackError) {
          console.error('Fallback strategy also failed:', fallbackError);
        }
      }

      // Emit search failed event
      await eventBus.emit(
        'game.search.failed',
        BGGEventFactory.createGameSearchFailedEvent(
          normalizedQuery,
          filters,
          bggError
        )
      );

      throw bggError;
    }
  }

  /**
   * Get game details with retry logic
   */
  async getGameDetails(gameId: string): Promise<BGGGameDetails> {
    const startTime = Date.now();
    const cacheKey = `game:${gameId}`;
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for game ${gameId}`);

      // Emit cache hit event
      await eventBus.emit(
        'cache.hit',
        BGGEventFactory.createCacheHitEvent(
          cacheKey,
          'game-details',
          Date.now() - (cached as any).timestamp || 0,
          gameId
        )
      );

      return cached;
    }

    // Emit cache miss event
    await eventBus.emit(
      'cache.miss',
      BGGEventFactory.createCacheMissEvent(cacheKey, 'game-details', gameId)
    );

    let lastError: any;

    for (let attempt = 1; attempt <= this.config.retry.maxAttempts; attempt++) {
      try {
        console.log(
          `🔍 Getting game details for ID: ${gameId} (attempt ${attempt}/${this.config.retry.maxAttempts})`
        );

        const response = await this.apiClient.getGameDetails(gameId);
        console.log(
          '🔍 Raw game details response:',
          response.substring(0, 500) + '...'
        );
        const data = await this.parseXML(response, false);
        console.log(
          '🔍 Parsed game details data:',
          JSON.stringify(data, null, 2)
        );
        const result = this.transformGameDetails(data);
        console.log(
          '🔍 Transformed game details result:',
          JSON.stringify(result, null, 2)
        );

        // Enhance with inbound link analysis for accurate type classification
        const enhancedResult = await this.enhanceGameDetailsWithInboundAnalysis(
          result,
          data
        );

        // Store in database cache
        await this.cacheGameInDatabase(enhancedResult);

        this.cacheManager.set(cacheKey, enhancedResult);

        // Emit game cached event
        await eventBus.emit(
          'game.cached',
          BGGEventFactory.createGameCachedEvent(
            cacheKey,
            'game-details',
            this.config.cache.ttl,
            JSON.stringify(enhancedResult).length,
            gameId
          )
        );

        // Emit game details fetched event
        await eventBus.emit(
          'game.details.fetched',
          BGGEventFactory.createGameDetailsFetchedEvent(
            gameId,
            enhancedResult.name,
            'boardgame', // Default type since BGGGameDetails doesn't have a type property
            {
              queryTime: Date.now() - startTime,
              cacheHit: false,
              apiCalls: 1,
            },
            {
              yearPublished: enhancedResult.yearpublished,
              bggRating: enhancedResult.bgg_rating,
              bggRank: enhancedResult.bgg_rank,
              weightRating: enhancedResult.weight_rating,
            }
          )
        );

        console.log(`✅ Successfully got game details for ID: ${gameId}`);
        return enhancedResult;
      } catch (error) {
        lastError = error;
        console.error(
          `❌ Attempt ${attempt} failed for game ${gameId}:`,
          error
        );

        // If it's a rate limit error and we have retries left, wait and retry
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

        // If it's not a rate limit error or we're out of retries, break
        break;
      }
    }

    const bggError = this.handleError('getGameDetails', lastError);

    // Check if we should use fallback strategies
    if (FallbackStrategies.shouldUseFallback(bggError)) {
      console.log(
        '🔄 Using fallback strategy for game details due to error:',
        bggError.code
      );

      try {
        const fallbackDetails = await FallbackStrategies.getFallbackGameDetails(
          {
            gameId,
            includePartialData: true,
          }
        );

        if (fallbackDetails) {
          const queryTime = Date.now() - startTime;

          // Emit fallback game details event
          await eventBus.emit(
            'game.details.fetched',
            BGGEventFactory.createGameDetailsFetchedEvent(
              gameId,
              fallbackDetails.name,
              'boardgame',
              {
                queryTime,
                cacheHit: false,
                apiCalls: 0,
              },
              {
                yearPublished: fallbackDetails.yearpublished,
                bggRating: fallbackDetails.bgg_rating,
                bggRank: fallbackDetails.bgg_rank,
                weightRating: fallbackDetails.weight_rating,
              }
            )
          );

          console.log(
            `✅ Fallback game details completed in ${queryTime}ms for game ${gameId}`
          );
          return fallbackDetails;
        }
      } catch (fallbackError) {
        console.error(
          'Fallback strategy also failed for game details:',
          fallbackError
        );
      }
    }

    // Emit game details failed event
    await eventBus.emit('game.details.failed', {
      eventType: 'game.details.failed',
      timestamp: new Date().toISOString(),
      eventId: `bgg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'bgg-service',
      data: {
        gameId,
        error: {
          code: bggError.code,
          message: bggError.message,
          userMessage: bggError.userMessage,
        },
        retryable:
          bggError.code === 'RATE_LIMIT' || bggError.code === 'API_UNAVAILABLE',
        attempt: this.config.retry.maxAttempts,
        maxAttempts: this.config.retry.maxAttempts,
      },
    });

    throw bggError;
  }

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
   * Deduplicate search results by ID, preferring expansion over base game
   */
  private deduplicateSearchResults(items: any[]): any[] {
    const itemMap = new Map<string, any>();

    for (const item of items) {
      const existingItem = itemMap.get(item.id);

      if (!existingItem) {
        // First occurrence of this ID
        itemMap.set(item.id, item);
      } else {
        // Duplicate ID found - prefer expansion over base game
        const currentIsExpansion = item.type === 'boardgameexpansion';
        const existingIsExpansion = existingItem.type === 'boardgameexpansion';

        if (currentIsExpansion && !existingIsExpansion) {
          // Current item is expansion, existing is base game - replace
          console.log(
            `🔍 Replacing base game with expansion for ID ${item.id}: "${item.name}"`
          );
          itemMap.set(item.id, item);
        } else if (!currentIsExpansion && existingIsExpansion) {
          // Current item is base game, existing is expansion - keep existing
          console.log(
            `🔍 Keeping expansion over base game for ID ${item.id}: "${existingItem.name}"`
          );
        } else {
          // Both same type - keep the one with higher search score
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
   * Enhance top search results with additional metadata for better UX
   */
  private async enhanceTopSearchResults(
    results: BGGSearchResponse,
    query: string
  ): Promise<BGGSearchResponse> {
    try {
      // Only enhance top 3 results to avoid too many API calls
      const topResults = results.items.slice(0, 3);
      const enhancedItems = [...results.items];

      console.log(
        `🔍 Enhancing top ${topResults.length} search results with additional metadata`
      );

      for (let i = 0; i < topResults.length; i++) {
        const item = topResults[i];

        try {
          // Get detailed metadata for this item
          if (!item?.id) {
            console.warn(`⚠️ Skipping enhancement for item without ID:`, item);
            continue;
          }
          const gameDetails = await this.getGameDetails(item.id);

          // Update the search result with enhanced information
          enhancedItems[i] = {
            ...item,
            // Add enhanced fields from game details
            description: gameDetails.description,
            minPlayers: gameDetails.minplayers,
            maxPlayers: gameDetails.maxplayers,
            playTime: gameDetails.playingtime,
            rating: gameDetails.bgg_rating,
            // Update type classification based on detailed analysis
            hasInboundExpansionLink:
              (gameDetails as any).hasInboundExpansionLink || false,
            correctedType: (gameDetails as any).correctedType || 'base-game',
            isExpansion: (gameDetails as any).correctedType === 'expansion',
            // Add enhanced relevance factors
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
          // Keep original item if enhancement fails
        }
      }

      return {
        ...results,
        items: enhancedItems,
      };
    } catch (error) {
      console.warn(`⚠️ Failed to enhance top search results:`, error);
      return results; // Return original results if enhancement fails
    }
  }

  /**
   * Enhance game details with inbound link analysis for accurate type classification
   */
  private async enhanceGameDetailsWithInboundAnalysis(
    gameDetails: BGGGameDetails,
    rawData: any
  ): Promise<BGGGameDetails> {
    try {
      // Use the SearchEngine to analyze inbound links
      const hasInboundExpansionLink =
        this.searchEngine.analyzeInboundLinks(rawData);

      // Update the game details with enhanced type information
      const enhancedDetails = {
        ...gameDetails,
        hasInboundExpansionLink,
        // Recalculate corrected type based on inbound analysis
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
      return gameDetails; // Return original if enhancement fails
    }
  }

  /**
   * Get user collection
   */
  async getUserCollection(username: string): Promise<BGGCollectionResponse> {
    const cacheKey = `collection:${username}`;
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.apiClient.getUserCollection(username);
      const data = await this.parseXML(response, false);
      const result = this.transformCollectionResponse(data);

      this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      const bggError = this.handleError('getUserCollection', error);
      throw bggError;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheManager.getCacheStats();
  }

  /**
   * Get adaptive cache statistics
   */
  getAdaptiveCacheStats() {
    return this.cacheManager.getAdaptiveCacheStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * Clear cache for specific pattern
   */
  clearCachePattern(pattern: string): void {
    this.cacheManager.clearPattern(pattern);
  }

  // Private helper methods (simplified versions of the original methods)

  /**
   * Decode HTML entities in text
   */
  private decodeHtmlEntities(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    const htmlEntities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
    };

    try {
      return text.replace(/&[a-zA-Z0-9#]+;/g, entity => {
        return htmlEntities[entity] || entity;
      });
    } catch (error) {
      console.warn('⚠️ Error decoding HTML entities:', error);
      return text; // Return original text if decoding fails
    }
  }

  private async parseXML(
    xml: string,
    isSearchResponse: boolean = false
  ): Promise<any> {
    console.log('Parsing XML response:', xml.substring(0, 200) + '...');

    try {
      // Check if this is a search response or game details response
      if (xml.includes('<items')) {
        if (isSearchResponse) {
          console.log('Detected items response - treating as search');
          return await this.parseSearchResponse(xml);
        } else {
          console.log('Detected items response - treating as game details');
          return await this.parseGameDetailsResponse(xml);
        }
      } else if (xml.includes('<item')) {
        console.log('Detected single item without items wrapper');
        return await this.parseGameDetailsResponse(xml);
      } else {
        console.log('Unknown XML structure');
        console.log('XML preview:', xml.substring(0, 200));
        return { items: { $: { total: '0' }, item: [] } };
      }
    } catch (error) {
      console.error('XML parsing error:', error);
      return { items: { $: { total: '0' }, item: [] } };
    }
  }

  /**
   * Parse search response XML
   */
  private async parseSearchResponse(xml: string): Promise<any> {
    try {
      // Use xml2js to parse the XML properly
      const parser = new xml2js.Parser({
        explicitArray: true,
        mergeAttrs: false,
        explicitCharkey: false,
        trim: true,
        normalize: true,
        normalizeTags: false,
        attrkey: '$',
        charkey: '_',
        explicitRoot: false,
        emptyTag: '',
        ignoreAttrs: false,
        explicitChildren: false,
        childkey: '$$',
        includeWhiteChars: false,
        async: false,
        strict: true,
      });

      const result = await parser.parseStringPromise(xml);
      console.log('Parsed search XML result:', JSON.stringify(result, null, 2));

      // Extract items from the parsed result
      if (result.item && Array.isArray(result.item)) {
        const total = result.$?.total || '0';
        const items = result.item;

        // Debug logging for each item
        items.forEach((item: any) => {
          console.log(
            `Item: ${item.name?.[0]?.$.value || 'Unknown'}, Type: ${item.$.type || 'boardgame'}, ID: ${item.$.id}`
          );
        });

        return {
          items: {
            $: { total },
            item: items,
          },
        };
      }

      console.log('No items found in XML');
      return { items: { $: { total: '0' }, item: [] } };
    } catch (error) {
      console.error('XML parsing error:', error);
      return { items: { $: { total: '0' }, item: [] } };
    }
  }

  /**
   * Parse game details response XML
   */
  private async parseGameDetailsResponse(xml: string): Promise<any> {
    try {
      console.log('Parsing game details XML response');

      // Use xml2js to parse the XML properly
      const parser = new xml2js.Parser({
        explicitArray: true,
        mergeAttrs: false,
        explicitCharkey: false,
        trim: true,
        normalize: true,
        normalizeTags: false,
        attrkey: '$',
        charkey: '_',
        explicitRoot: false,
        emptyTag: '',
        ignoreAttrs: false,
        explicitChildren: false,
        childkey: '$$',
        includeWhiteChars: false,
        async: false,
        strict: true,
      });

      const result = await parser.parseStringPromise(xml);
      console.log('Parsed XML result:', JSON.stringify(result, null, 2));

      // Find the main item content
      let mainItem = null;

      if (result.item && Array.isArray(result.item)) {
        const items = result.item;

        // Look for boardgame type first
        for (const item of items) {
          if (item.$ && item.$.type === 'boardgame') {
            mainItem = item;
            console.log('Found boardgame type item');
            break;
          }
        }

        // If no boardgame type found, use the first item
        if (!mainItem && items.length > 0) {
          mainItem = items[0];
          console.log('No boardgame type found, using first item');
        }
      }

      if (!mainItem) {
        console.error('❌ No valid item content found in game details XML');
        throw new Error(
          'No valid item content found in game details XML response'
        );
      }

      console.log(
        'Parsed game details item:',
        JSON.stringify(mainItem, null, 2)
      );
      console.log('Item structure check:');
      console.log('- item.$.id:', mainItem.$?.id);
      console.log('- item.name:', mainItem.name);
      console.log('- item.description:', mainItem.description);

      // Return in the expected format for game details
      return { item: mainItem };
    } catch (error) {
      console.error('Game details XML parsing error:', error);
      return { item: null };
    }
  }

  private transformSearchResponse(data: any): BGGSearchResponse {
    // First, deduplicate items by ID to prevent duplicates
    const allItems = data.items?.item || [];
    const uniqueItems = allItems.filter(
      (item: any, index: number, self: any[]) =>
        self.findIndex(i => i.$.id === item.$.id) === index
    );

    if (allItems.length !== uniqueItems.length) {
      console.log(
        `🔍 Removed ${allItems.length - uniqueItems.length} duplicate items`
      );
    }

    const items =
      uniqueItems.map((item: any) => {
        const itemType = item.$.type as
          | 'boardgame'
          | 'boardgameexpansion'
          | 'boardgameaccessory';

        // Debug logging for type classification
        console.log(
          `🔍 Item: "${item.name?.[0]?.$.value || 'Unknown'}" | BGG Type: ${itemType} | ID: ${item.$.id}`
        );

        const baseItem = {
          id: item.$.id,
          name: this.decodeHtmlEntities(item.name?.[0]?.$.value || ''),
          yearpublished: item.yearpublished?.[0]?.$.value,
          type: itemType,
          thumbnail: item.thumbnail?.[0] || undefined,
          searchScore: 0,
          isExactMatch: false,
          isExpansion: itemType === 'boardgameexpansion',
          hasInboundExpansionLink: false,
          correctedType:
            itemType === 'boardgameexpansion'
              ? ('expansion' as const)
              : ('base-game' as const),
          relevanceFactors: {
            nameMatch: 0,
            yearMatch: 0,
            typeMatch: 0,
            popularity: 0,
          },
        };

        return BGGDataUtils.computeSearchItemFields(baseItem);
      }) || [];

    return {
      items,
      total: parseInt(data.items?.$.total || '0'),
      searchStrategy: 'fuzzy' as const,
      performance: {
        queryTime: 0,
        cacheHit: false,
        apiCalls: 0,
      },
    };
  }

  private transformGameDetails(data: any): BGGGameDetails {
    console.log(
      '🔍 Transforming game details, data structure:',
      JSON.stringify(data, null, 2)
    );
    const item = data.item;
    if (!item) {
      console.error('❌ No game data found in response:', data);
      throw new Error(
        'No game data found in response - item is null or undefined'
      );
    }

    const baseGame = {
      id: item.$.id,
      name: this.decodeHtmlEntities(item.name?.[0]?.$.value || ''),
      description: this.decodeHtmlEntities(item.description?.[0] || ''),
      yearpublished: parseInt(item.yearpublished?.[0]?.$.value || '0'),
      minplayers: parseInt(item.minplayers?.[0]?.$.value || '0'),
      maxplayers: parseInt(item.maxplayers?.[0]?.$.value || '0'),
      playingtime: parseInt(item.playingtime?.[0]?.$.value || '0'),
      minplaytime: parseInt(item.minplaytime?.[0]?.$.value || '0'),
      maxplaytime: parseInt(item.maxplaytime?.[0]?.$.value || '0'),
      minage: parseInt(item.minage?.[0]?.$.value || '0'),
      image: item.image?.[0] || '',
      thumbnail: item.thumbnail?.[0] || '',
      categories:
        item.link
          ?.filter((l: any) => l.$.type === 'boardgamecategory')
          .map((l: any) => this.decodeHtmlEntities(l.$.value)) || [],
      mechanics:
        item.link
          ?.filter((l: any) => l.$.type === 'boardgamemechanic')
          .map((l: any) => this.decodeHtmlEntities(l.$.value)) || [],
      designers:
        item.link
          ?.filter((l: any) => l.$.type === 'boardgamedesigner')
          .map((l: any) => this.decodeHtmlEntities(l.$.value)) || [],
      artists:
        item.link
          ?.filter((l: any) => l.$.type === 'boardgameartist')
          .map((l: any) => this.decodeHtmlEntities(l.$.value)) || [],
      publishers:
        item.link
          ?.filter((l: any) => l.$.type === 'boardgamepublisher')
          .map((l: any) => this.decodeHtmlEntities(l.$.value)) || [],
      languages:
        item.link
          ?.filter((l: any) => l.$.type === 'language')
          .map((l: any) => l.$.value) || [],
      bgg_rating: parseFloat(
        item.statistics?.[0]?.ratings?.[0]?.average?.[0]?.$.value || '0'
      ),
      bgg_rank: parseInt(
        item.statistics?.[0]?.ratings?.[0]?.ranks?.[0]?.rank?.[0]?.$.value ||
          '0'
      ),
      weight_rating: parseFloat(
        item.statistics?.[0]?.ratings?.[0]?.averageweight?.[0]?.$.value || '0'
      ),
      age_rating: parseInt(item.minage?.[0]?.$.value || '0'),
      last_bgg_sync: new Date().toISOString(),
      // Enhanced fields
      alternateNames: this.extractAlternateNames(item),
      editions: this.extractEditions(item),
      languageDependence: this.extractLanguageDependence(item),
    };

    return BGGDataUtils.computeGameDetailsFields(baseGame);
  }

  private extractAlternateNames(item: any): BGGAlternateName[] {
    if (!item.name || !Array.isArray(item.name)) {
      return [];
    }

    return item.name.map((name: any) => ({
      type: name.$.type as 'primary' | 'alternate',
      sortindex: parseInt(name.$.sortindex || '1'),
      value: this.decodeHtmlEntities(name.$.value || ''),
    }));
  }

  private extractEditions(item: any): BGGEdition[] {
    // First try to get real game versions if available
    if (item.versions && item.versions[0] && item.versions[0].item) {
      return this.extractGameVersions(item.versions[0].item);
    }

    // Fallback to the old method for implementations/compilations
    if (!item.link || !Array.isArray(item.link)) {
      return [];
    }

    const versionTypes = ['boardgameimplementation', 'boardgamecompilation'];

    return item.link
      .filter((link: any) => versionTypes.includes(link.$.type))
      .map((link: any) => ({
        id: link.$.id,
        name: this.decodeHtmlEntities(link.$.value || ''),
        type: this.mapEditionType(link.$.type),
        bggLink: `https://boardgamegeek.com/boardgame/${link.$.id}`,
      }));
  }

  private extractGameVersions(versions: any[]): BGGEdition[] {
    return versions.map((version: any) => {
      // Extract publisher from links
      const publisherLink = version.link?.find(
        (link: any) => link.$.type === 'boardgamepublisher'
      );
      const publisher = publisherLink?.$.value || 'Unknown';

      // Extract language from links
      const languageLink = version.link?.find(
        (link: any) => link.$.type === 'language'
      );
      const language = languageLink?.$.value || 'Unknown';

      return {
        id: version.$.id,
        name: this.decodeHtmlEntities(version.name?.[0]?.$.value || ''),
        type: 'implementation' as const, // All versions are implementations
        yearpublished: parseInt(version.yearpublished?.[0]?.$.value || '0'),
        image: version.image?.[0] || '',
        thumbnail: version.thumbnail?.[0] || '',
        publishers: publisher ? [publisher] : [],
        languages: language ? [language] : [],
        bggLink: `https://boardgamegeek.com/boardgameversion/${version.$.id}`,
        // Additional version-specific data
        productCode: version.productcode?.[0]?.$.value || '',
        dimensions: {
          width: parseFloat(version.width?.[0]?.$.value || '0'),
          length: parseFloat(version.length?.[0]?.$.value || '0'),
          depth: parseFloat(version.depth?.[0]?.$.value || '0'),
          weight: parseFloat(version.weight?.[0]?.$.value || '0'),
        },
      };
    });
  }

  private extractLanguageDependence(item: any): BGGLanguageDependence {
    if (!item.poll || !Array.isArray(item.poll)) {
      return {
        level: 0,
        description: 'Unknown',
        votes: 0,
        totalVotes: 0,
        percentage: 0,
      };
    }

    const languagePoll = item.poll.find(
      (poll: any) => poll.$.name === 'language_dependence'
    );
    if (
      !languagePoll ||
      !languagePoll.results ||
      !Array.isArray(languagePoll.results)
    ) {
      return {
        level: 0,
        description: 'Unknown',
        votes: 0,
        totalVotes: 0,
        percentage: 0,
      };
    }

    const totalVotes = parseInt(languagePoll.$.totalvotes || '0');
    const results = languagePoll.results[0]?.result || [];

    // Find the result with the most votes
    let maxVotes = 0;
    let selectedResult: any = null;

    results.forEach((result: any) => {
      const votes = parseInt(result.$.numvotes || '0');
      if (votes > maxVotes) {
        maxVotes = votes;
        selectedResult = result;
      }
    });

    if (!selectedResult) {
      return {
        level: 0,
        description: 'Unknown',
        votes: 0,
        totalVotes,
        percentage: 0,
      };
    }

    return {
      level: this.convertBGGLevelToUserLevel(selectedResult.$.level || '0'),
      description: selectedResult.$.value || 'Unknown',
      votes: maxVotes,
      totalVotes,
      percentage:
        totalVotes > 0 ? Math.round((maxVotes / totalVotes) * 100) : 0,
    };
  }

  private mapEditionType(
    bggType: string
  ): 'expansion' | 'implementation' | 'compilation' | 'accessory' {
    switch (bggType) {
      case 'boardgameimplementation':
        return 'implementation';
      case 'boardgamecompilation':
        return 'compilation';
      default:
        return 'implementation';
    }
  }

  private convertBGGLevelToUserLevel(bggLevel: number | string): number {
    // Convert BGG internal level codes (76-80) to user-friendly levels (1-5)
    const level = typeof bggLevel === 'string' ? parseInt(bggLevel) : bggLevel;

    switch (level) {
      case 76:
        return 1; // "No necessary in-game text"
      case 77:
        return 2; // "Some necessary text - easily memorized or small crib sheet"
      case 78:
        return 3; // "Moderate in-game text - needs crib sheet or paste ups"
      case 79:
        return 4; // "Extensive use of text - massive conversion needed to be playable"
      case 80:
        return 5; // "Unplayable in another language"
      default:
        return 0; // Unknown
    }
  }

  private transformCollectionResponse(data: any): BGGCollectionResponse {
    const items =
      data.items?.item?.map((item: any) => ({
        id: item.$.id,
        name: item.name?.[0]?.$.value || '',
        yearpublished: parseInt(item.yearpublished?.[0]?.$.value || '0'),
        image: item.image?.[0] || '',
        thumbnail: item.thumbnail?.[0] || '',
        owned: item.status?.[0]?.own?.[0] === '1',
        prevowned: item.status?.[0]?.prevowned?.[0] === '1',
        fortrade: item.status?.[0]?.fortrade?.[0] === '1',
        want: item.status?.[0]?.want?.[0] === '1',
        wanttoplay: item.status?.[0]?.wanttoplay?.[0] === '1',
        wanttobuy: item.status?.[0]?.wanttobuy?.[0] === '1',
        wishlist: item.status?.[0]?.wishlist?.[0] === '1',
        preordered: item.status?.[0]?.preordered?.[0] === '1',
        lastmodified: item.status?.[0]?.lastmodified?.[0] || '',
      })) || [];

    return {
      items,
      total: items.length,
    };
  }

  private handleError(operation: string, error: any): BGGError {
    console.error(`❌ Error in ${operation}:`, error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error instanceof Error:', error instanceof Error);
    console.error('Error instanceof BGGError:', error instanceof BGGError);

    if (error instanceof BGGError) {
      return error;
    }

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message || 'Unknown error';
    } else if (error && typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if ('error' in error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if ('details' in error && typeof error.details === 'string') {
        errorMessage = error.details;
      } else {
        errorMessage = JSON.stringify(error, null, 2);
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return new BGGError('BGG_ERROR', errorMessage, error);
  }

  private async cacheSearchInDatabase(
    query: string,
    results: BGGSearchResponse
  ): Promise<void> {
    // Database caching implementation would go here
  }

  private async cacheGameInDatabase(game: BGGGameDetails): Promise<void> {
    // Database caching implementation would go here
  }
}
