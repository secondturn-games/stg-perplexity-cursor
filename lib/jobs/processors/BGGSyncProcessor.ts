/**
 * BGG Sync Job Processor
 * Handles individual game synchronization jobs
 */

import {
  Job,
  JobType,
  JobProcessor,
  BGGSyncJobPayload,
  BGGSyncJobResult,
} from '@/types/jobs.types';
import { BGGService } from '@/lib/bgg/BGGService';
import { createServerComponentClient } from '@/lib/supabase';

export class BGGSyncProcessor implements JobProcessor {
  private bggService: BGGService;
  private supabase = createServerComponentClient();

  constructor() {
    this.bggService = new BGGService();
  }

  canHandle(jobType: JobType): boolean {
    return jobType === 'bgg_sync';
  }

  async process(job: Job): Promise<BGGSyncJobResult> {
    const payload = job.payload as BGGSyncJobPayload;
    const { gameId, forceUpdate = false, includeDetails = true } = payload;

    if (!gameId) {
      throw new Error('Game ID is required for BGG sync job');
    }

    try {
      console.log(`🔄 Processing BGG sync for game ID: ${gameId}`);

      // Check if game already exists in database
      const existingGame = await this.getExistingGame(gameId);

      if (existingGame && !forceUpdate) {
        // Check if data is recent enough (less than 24 hours old)
        const lastSync = new Date(existingGame.last_bgg_sync || 0);
        const now = new Date();
        const hoursSinceSync =
          (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

        if (hoursSinceSync < 24) {
          console.log(
            `✅ Game ${gameId} is already up to date (synced ${hoursSinceSync.toFixed(1)} hours ago)`
          );
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

      console.log(`✅ Successfully synced game ${gameId}: ${gameDetails.name}`);

      return {
        success: true,
        gameId,
        gameData: gameDetails,
        cached: false,
        apiCalls: 1,
        metadata: {
          gameName: gameDetails.name,
          yearPublished: gameDetails.yearpublished,
          bggRating: gameDetails.bgg_rating,
          bggRank: gameDetails.bgg_rank,
        },
      };
    } catch (error) {
      console.error(`❌ Failed to sync game ${gameId}:`, error);

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
