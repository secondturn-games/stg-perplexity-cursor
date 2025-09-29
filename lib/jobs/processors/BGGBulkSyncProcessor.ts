/**
 * BGG Bulk Sync Job Processor
 * Handles batch game synchronization jobs
 */

import {
  Job,
  JobType,
  JobProcessor,
  BGGBulkSyncJobPayload,
  BGGBulkSyncJobResult,
  BGGSyncJobResult,
} from '@/types/jobs.types';
import { BGGService } from '@/lib/bgg/BGGService';
import { createServerComponentClient } from '@/lib/supabase';

export class BGGBulkSyncProcessor implements JobProcessor {
  private bggService: BGGService;
  private supabase = createServerComponentClient();

  constructor() {
    this.bggService = new BGGService();
  }

  canHandle(jobType: JobType): boolean {
    return jobType === 'bgg_bulk_sync';
  }

  async process(job: Job): Promise<BGGBulkSyncJobResult> {
    const payload = job.payload as BGGBulkSyncJobPayload;
    const { gameIds, batchSize = 5, delayBetweenBatches = 2000 } = payload;

    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      throw new Error('Game IDs array is required for bulk sync job');
    }

    console.log(`🔄 Processing bulk BGG sync for ${gameIds.length} games`);

    const results: BGGSyncJobResult[] = [];
    let successful = 0;
    let failed = 0;
    let totalApiCalls = 0;

    try {
      // Process games in batches to respect rate limits
      for (let i = 0; i < gameIds.length; i += batchSize) {
        const batch = gameIds.slice(i, i + batchSize);
        console.log(
          `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(gameIds.length / batchSize)} (${batch.length} games)`
        );

        // Process batch concurrently
        const batchPromises = batch.map(gameId => this.syncSingleGame(gameId));
        const batchResults = await Promise.allSettled(batchPromises);

        // Process results
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          const gameId = batch[j];

          if (!gameId) {
            // Handle undefined gameId
            results.push({
              success: false,
              gameId: 'unknown',
              error: 'Unknown error: gameId is undefined',
              cached: false,
              apiCalls: 0,
            });
            failed++;
            continue;
          }

          if (result && result.status === 'fulfilled') {
            results.push(result.value);
            if (result.value.success) {
              successful++;
            } else {
              failed++;
            }
            totalApiCalls += result.value.apiCalls;
          } else if (result && result.status === 'rejected') {
            // Handle rejected promise
            results.push({
              success: false,
              gameId,
              error:
                result.reason instanceof Error
                  ? result.reason.message
                  : String(result.reason),
              cached: false,
              apiCalls: 0,
            });
            failed++;
          } else {
            // Handle undefined result
            results.push({
              success: false,
              gameId,
              error: 'Unknown error: result is undefined',
              cached: false,
              apiCalls: 0,
            });
            failed++;
          }
        }

        // Delay between batches to respect rate limits
        if (i + batchSize < gameIds.length) {
          console.log(
            `⏳ Waiting ${delayBetweenBatches}ms before next batch...`
          );
          await new Promise(resolve =>
            setTimeout(resolve, delayBetweenBatches)
          );
        }
      }

      console.log(
        `✅ Bulk sync completed: ${successful} successful, ${failed} failed`
      );

      return {
        success: failed === 0,
        totalProcessed: gameIds.length,
        successful,
        failed,
        gameIds,
        results,
        metadata: {
          batchSize,
          delayBetweenBatches,
          totalApiCalls,
          averageApiCallsPerGame: totalApiCalls / gameIds.length,
        },
      };
    } catch (error) {
      console.error(`❌ Bulk sync failed:`, error);

      return {
        success: false,
        totalProcessed: results.length,
        successful,
        failed: failed + (gameIds.length - results.length),
        gameIds,
        results,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          batchSize,
          delayBetweenBatches,
          totalApiCalls,
          errorType:
            error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  /**
   * Sync a single game
   */
  private async syncSingleGame(gameId: string): Promise<BGGSyncJobResult> {
    try {
      // Check if game already exists and is recent
      const existingGame = await this.getExistingGame(gameId);

      if (existingGame) {
        const lastSync = new Date(existingGame.last_bgg_sync || 0);
        const now = new Date();
        const hoursSinceSync =
          (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        if (hoursSinceSync < 24) {
          return {
            success: true,
            gameId,
            gameData: existingGame,
            cached: true,
            apiCalls: 0,
            metadata: {
              lastSync: existingGame.last_bgg_sync,
              hoursSinceSync: Math.round(hoursSinceSync * 10) / 10,
            },
          };
        }
      }

      // Fetch fresh data from BGG
      const gameDetails = await this.bggService.getGameDetails(gameId);

      // Store in database
      await this.storeGameInDatabase(gameDetails);

      return {
        success: true,
        gameId,
        gameData: gameDetails,
        cached: false,
        apiCalls: 1,
        metadata: {
          gameName: gameDetails.name,
          yearPublished: gameDetails.yearpublished,
        },
      };
    } catch (error) {
      return {
        success: false,
        gameId,
        error: error instanceof Error ? error.message : String(error),
        cached: false,
        apiCalls: 0,
        metadata: {
          errorType:
            error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  /**
   * Get existing game from database
   */
  private async getExistingGame(gameId: string) {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .eq('bgg_id', parseInt(gameId))
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get existing game: ${error.message}`);
    }

    return data;
  }

  /**
   * Store game data in database
   */
  private async storeGameInDatabase(gameDetails: any): Promise<void> {
    const gameData = {
      bgg_id: parseInt(gameDetails.id),
      title: gameDetails.name,
      description: gameDetails.description,
      year_published: gameDetails.yearpublished,
      min_players: gameDetails.minplayers,
      max_players: gameDetails.maxplayers,
      playing_time: gameDetails.playingtime,
      complexity_rating: gameDetails.weight_rating,
      image_url: gameDetails.image,
      thumbnail_url: gameDetails.thumbnail,
      categories: gameDetails.categories || [],
      mechanics: gameDetails.mechanics || [],
      designers: gameDetails.designers || [],
      artists: gameDetails.artists || [],
      publishers: gameDetails.publishers || [],
      languages: gameDetails.languages || [],
      age_rating: gameDetails.age_rating,
      bgg_rating: gameDetails.bgg_rating,
      bgg_rank: gameDetails.bgg_rank,
      weight_rating: gameDetails.weight_rating,
      last_bgg_sync: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.supabase.from('games').upsert(gameData, {
      onConflict: 'bgg_id',
      ignoreDuplicates: false,
    });

    if (error) {
      throw new Error(`Failed to store game in database: ${error.message}`);
    }
  }
}
