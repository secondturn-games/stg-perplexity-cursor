/**
 * Cache Warmup Job Processor
 * Handles cache warming for popular games and search queries
 */

import {
  Job,
  JobType,
  JobProcessor,
  CacheWarmupJobPayload,
  CacheWarmupJobResult,
} from '@/types/jobs.types';
import { BGGService } from '@/lib/bgg/BGGService';
import { createServerComponentClient } from '@/lib/supabase';

export class CacheWarmupProcessor implements JobProcessor {
  private bggService: BGGService;
  private supabase = createServerComponentClient();

  // Popular game IDs for cache warming
  private readonly POPULAR_GAME_IDS = [
    '13', // Catan
    '9209', // Ticket to Ride
    '266192', // Wingspan
    '174430', // Gloomhaven
    '161936', // Pandemic Legacy: Season 1
    '224517', // Azul
    '167791', // Terraforming Mars
    '30549', // Power Grid
    '266810', // Wingspan: European Expansion
    '230802', // Azul: Summer Pavilion
    '266192', // Wingspan
    '266192', // Wingspan
    '266192', // Wingspan
  ];

  // Common search queries for cache warming
  private readonly COMMON_SEARCH_QUERIES = [
    'catan',
    'ticket to ride',
    'wingspan',
    'pandemic',
    'azul',
    'gloomhaven',
    'terraforming mars',
    'power grid',
    'splendor',
    'dominion',
  ];

  constructor() {
    this.bggService = new BGGService();
  }

  canHandle(jobType: JobType): boolean {
    return jobType === 'cache_warmup';
  }

  async process(job: Job): Promise<CacheWarmupJobResult> {
    const payload = job.payload as CacheWarmupJobPayload;
    const { gameIds, searchQueries, popularGames = true, limit = 20 } = payload;

    console.log(`🔄 Starting cache warmup process`);

    let warmedItems = 0;
    let totalApiCalls = 0;
    let cacheHitRate = 0;
    const results: any[] = [];

    try {
      // Warm up game details cache
      if (popularGames || gameIds) {
        const gamesToWarm = gameIds || this.POPULAR_GAME_IDS.slice(0, limit);
        console.log(`🔄 Warming cache for ${gamesToWarm.length} games`);

        for (const gameId of gamesToWarm) {
          try {
            const startTime = Date.now();
            const gameDetails = await this.bggService.getGameDetails(gameId);
            const queryTime = Date.now() - startTime;

            results.push({
              type: 'game_details',
              gameId,
              gameName: gameDetails.name,
              queryTime,
              cached: queryTime < 100, // Assume cached if very fast
            });

            warmedItems++;
            totalApiCalls++;

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.warn(`⚠️ Failed to warm cache for game ${gameId}:`, error);
            results.push({
              type: 'game_details',
              gameId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      // Warm up search cache
      if (searchQueries || popularGames) {
        const queriesToWarm =
          searchQueries || this.COMMON_SEARCH_QUERIES.slice(0, limit);
        console.log(
          `🔄 Warming search cache for ${queriesToWarm.length} queries`
        );

        for (const query of queriesToWarm) {
          try {
            const startTime = Date.now();
            const searchResults = await this.bggService.searchGames(query, {
              gameType: 'all',
              exactMatch: false,
            });
            const queryTime = Date.now() - startTime;

            results.push({
              type: 'search',
              query,
              resultCount: searchResults.items.length,
              queryTime,
              cached: queryTime < 100, // Assume cached if very fast
            });

            warmedItems++;
            totalApiCalls++;

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.warn(
              `⚠️ Failed to warm search cache for query "${query}":`,
              error
            );
            results.push({
              type: 'search',
              query,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      // Calculate cache hit rate
      const cachedResults = results.filter(r => r.cached === true);
      cacheHitRate =
        results.length > 0 ? (cachedResults.length / results.length) * 100 : 0;

      console.log(
        `✅ Cache warmup completed: ${warmedItems} items warmed, ${cacheHitRate.toFixed(1)}% cache hit rate`
      );

      return {
        success: true,
        warmedItems,
        cacheHitRate: Math.round(cacheHitRate * 10) / 10,
        totalApiCalls,
        metadata: {
          gameDetailsWarmed: results.filter(r => r.type === 'game_details')
            .length,
          searchQueriesWarmed: results.filter(r => r.type === 'search').length,
          results,
        },
      };
    } catch (error) {
      console.error(`❌ Cache warmup failed:`, error);

      return {
        success: false,
        warmedItems,
        cacheHitRate: Math.round(cacheHitRate * 10) / 10,
        totalApiCalls,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          results,
          errorType:
            error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  /**
   * Get popular games from database for cache warming
   */
  private async getPopularGamesFromDatabase(limit: number): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .select('bgg_id')
        .not('bgg_rating', 'is', null)
        .order('bgg_rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Failed to get popular games from database:', error);
        return this.POPULAR_GAME_IDS.slice(0, limit);
      }

      return data
        .filter(game => game.bgg_id !== null)
        .map(game => game.bgg_id!.toString());
    } catch (error) {
      console.warn('Error getting popular games from database:', error);
      return this.POPULAR_GAME_IDS.slice(0, limit);
    }
  }

  /**
   * Get common search queries from database analytics
   */
  private async getCommonSearchQueriesFromDatabase(
    limit: number
  ): Promise<string[]> {
    // This would typically query analytics data
    // For now, return the hardcoded common queries
    return this.COMMON_SEARCH_QUERIES.slice(0, limit);
  }
}
