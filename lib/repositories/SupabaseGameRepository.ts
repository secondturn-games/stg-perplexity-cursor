/**
 * Supabase Game Repository Implementation
 * Concrete implementation of IGameRepository using Supabase as the data store
 *
 * This repository handles all game-related database operations including
 * CRUD operations, search functionality, and BGG data synchronization.
 */

import { createServerComponentClient } from '@/lib/supabase';
import type { IExtendedGameRepository } from './interfaces/IGameRepository';
import type { BGGGameDetails } from '@/types/bgg.types';
import type {
  Game,
  GameInsert,
  GameUpdate,
  GameSearchFilters,
  Database,
} from '@/types/database.types';

/**
 * Supabase implementation of the game repository
 *
 * @example
 * ```typescript
 * const gameRepo = new SupabaseGameRepository();
 * const game = await gameRepo.findById('123e4567-e89b-12d3-a456-426614174000');
 * ```
 */
export class SupabaseGameRepository implements IExtendedGameRepository<Game> {
  private readonly supabase = createServerComponentClient();

  /**
   * Find a game by its unique identifier
   *
   * @param id - The game's unique identifier (UUID)
   * @returns Promise resolving to the game entity or null if not found
   * @throws {Error} When database operation fails
   *
   * @example
   * ```typescript
   * const game = await gameRepo.findById('123e4567-e89b-12d3-a456-426614174000');
   * if (game) {
   *   console.log(`Found game: ${game.title}`);
   * }
   * ```
   */
  async findById(id: string): Promise<Game | null> {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw new Error(`Failed to find game by ID ${id}: ${error.message}`);
      }

      return data as Game;
    } catch (error) {
      throw new Error(
        `Database error in findById: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find a game by its BoardGameGeek ID
   *
   * @param bggId - The BGG numeric identifier
   * @returns Promise resolving to the game entity or null if not found
   * @throws {Error} When database operation fails
   *
   * @example
   * ```typescript
   * const game = await gameRepo.findByBggId(12345);
   * if (game) {
   *   console.log(`Found BGG game: ${game.title}`);
   * }
   * ```
   */
  async findByBggId(bggId: number): Promise<Game | null> {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .select('*')
        .eq('bgg_id', bggId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw new Error(
          `Failed to find game by BGG ID ${bggId}: ${error.message}`
        );
      }

      return data as Game;
    } catch (error) {
      throw new Error(
        `Database error in findByBggId: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search for games using various filters
   *
   * @param filters - Search criteria including categories, mechanics, player counts, etc.
   * @returns Promise resolving to an array of matching games
   * @throws {Error} When database operation fails
   *
   * @example
   * ```typescript
   * const results = await gameRepo.search({
   *   categories: ['Strategy'],
   *   min_players: 2,
   *   max_players: 4,
   *   min_rating: 7.0
   * });
   * console.log(`Found ${results.length} games`);
   * ```
   */
  async search(filters: GameSearchFilters): Promise<Game[]> {
    try {
      let query = this.supabase.from('games').select('*');

      // Apply filters
      if (filters.categories && filters.categories.length > 0) {
        query = query.overlaps('categories', filters.categories);
      }

      if (filters.mechanics && filters.mechanics.length > 0) {
        query = query.overlaps('mechanics', filters.mechanics);
      }

      if (filters.min_players !== undefined) {
        query = query.gte('min_players', filters.min_players);
      }

      if (filters.max_players !== undefined) {
        query = query.lte('max_players', filters.max_players);
      }

      if (filters.min_playing_time !== undefined) {
        query = query.gte('playing_time', filters.min_playing_time);
      }

      if (filters.max_playing_time !== undefined) {
        query = query.lte('playing_time', filters.max_playing_time);
      }

      if (filters.min_year !== undefined) {
        query = query.gte('year_published', filters.min_year);
      }

      if (filters.max_year !== undefined) {
        query = query.lte('year_published', filters.max_year);
      }

      if (filters.min_rating !== undefined) {
        query = query.gte('bgg_rating', filters.min_rating);
      }

      if (filters.designers && filters.designers.length > 0) {
        query = query.overlaps('designers', filters.designers);
      }

      if (filters.publishers && filters.publishers.length > 0) {
        query = query.overlaps('publishers', filters.publishers);
      }

      // Order by BGG rating (highest first) and then by title
      query = query
        .order('bgg_rating', { ascending: false })
        .order('title', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to search games: ${error.message}`);
      }

      return (data || []) as Game[];
    } catch (error) {
      throw new Error(
        `Database error in search: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Insert or update a game from BGG data
   *
   * @param game - BGG game details to upsert
   * @returns Promise resolving to the upserted game entity
   * @throws {Error} When database operation fails
   *
   * @example
   * ```typescript
   * const bggGame = await bggService.getGameDetails('12345');
   * const game = await gameRepo.upsert(bggGame);
   * console.log(`Upserted game: ${game.title}`);
   * ```
   */
  async upsert(game: BGGGameDetails): Promise<Game> {
    try {
      // First, try to find existing game by BGG ID
      const existingGame = await this.findByBggId(parseInt(game.id));

      const gameData: GameInsert = {
        bgg_id: parseInt(game.id),
        title: game.name,
        description: game.description || null,
        min_players: game.minplayers || null,
        max_players: game.maxplayers || null,
        age_rating: game.minage || null,
        playing_time: game.playingtime || null,
        year_published: game.yearpublished || null,
        designers: game.designers || [],
        artists: game.artists || [],
        publishers: game.publishers || [],
        categories: game.categories || [],
        mechanics: game.mechanics || [],
        languages: game.languages || [],
        image_url: game.image || null,
        thumbnail_url: game.thumbnail || null,
        bgg_rating: game.bgg_rating || null,
        bgg_rank: game.bgg_rank || null,
        weight_rating: game.weight_rating || null,
        complexity_rating: game.weight_rating || null, // Map weight to complexity
        last_bgg_sync: new Date().toISOString(),
        // Extended metadata fields
        alternate_names: (game.alternateNames || []) as never,
        editions: (game.editions || []) as never,
        language_dependence: (game.languageDependence || null) as never,
      };

      let result;

      if (existingGame) {
        // Update existing game - create update object with only allowed fields
        const updateData = {
          title: gameData.title,
          description: gameData.description ?? null,
          year_published: gameData.year_published ?? null,
          min_players: gameData.min_players ?? null,
          max_players: gameData.max_players ?? null,
          playing_time: gameData.playing_time ?? null,
          age_rating: gameData.age_rating ?? null,
          image_url: gameData.image_url ?? null,
          thumbnail_url: gameData.thumbnail_url ?? null,
          categories: gameData.categories ?? [],
          mechanics: gameData.mechanics ?? [],
          designers: gameData.designers ?? [],
          artists: gameData.artists ?? [],
          publishers: gameData.publishers ?? [],
          languages: gameData.languages ?? [],
          bgg_rating: gameData.bgg_rating ?? null,
          bgg_rank: gameData.bgg_rank ?? null,
          weight_rating: gameData.weight_rating ?? null,
          last_bgg_sync: gameData.last_bgg_sync ?? null,
          // Extended metadata fields
          alternate_names: (gameData.alternate_names ?? []) as never,
          editions: (gameData.editions ?? []) as never,
          language_dependence: (gameData.language_dependence ?? null) as never,
          updated_at: new Date().toISOString(),
        };

        // Use a type assertion to work around Supabase type inference issues
        const query = this.supabase
          .from('games')
          .update(updateData as never)
          .eq('id', existingGame.id);
        const { data, error } = await query.select().single();

        if (error) {
          throw new Error(`Failed to update game: ${error.message}`);
        }

        result = data;
      } else {
        // Insert new game
        const { data, error } = await this.supabase
          .from('games')
          .insert(gameData as never)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to insert game: ${error.message}`);
        }

        result = data;
      }

      return result as Game;
    } catch (error) {
      throw new Error(
        `Database error in upsert: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Bulk insert or update multiple games from BGG data
   *
   * @param games - Array of BGG game details to upsert
   * @returns Promise resolving to array of upserted game entities
   * @throws {Error} When database operation fails
   *
   * @example
   * ```typescript
   * const bggGames = await Promise.all([
   *   bggService.getGameDetails('12345'),
   *   bggService.getGameDetails('67890')
   * ]);
   * const games = await gameRepo.bulkUpsert(bggGames);
   * console.log(`Upserted ${games.length} games`);
   * ```
   */
  async bulkUpsert(games: BGGGameDetails[]): Promise<Game[]> {
    try {
      const results: Game[] = [];

      // Process games in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < games.length; i += batchSize) {
        const batch = games.slice(i, i + batchSize);
        const batchPromises = batch.map(game => this.upsert(game));

        try {
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
        } catch (error) {
          console.warn(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
          // Continue with next batch even if one fails
        }
      }

      return results;
    } catch (error) {
      throw new Error(
        `Database error in bulkUpsert: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Mark games as stale (requiring BGG sync)
   *
   * @param gameIds - Array of game IDs to mark as stale
   * @returns Promise that resolves when operation completes
   * @throws {Error} When database operation fails
   *
   * @example
   * ```typescript
   * await gameRepo.markStale(['123e4567-e89b-12d3-a456-426614174000']);
   * console.log('Game marked as stale for BGG sync');
   * ```
   */
  async markStale(gameIds: string[]): Promise<void> {
    try {
      // Set last_bgg_sync to null to indicate the game needs syncing
      const { error } = await this.supabase
        .from('games')
        .update({ last_bgg_sync: null } as never)
        .in('id', gameIds);

      if (error) {
        throw new Error(`Failed to mark games as stale: ${error.message}`);
      }
    } catch (error) {
      throw new Error(
        `Database error in markStale: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get games that require BGG synchronization
   *
   * @param limit - Maximum number of games to return
   * @returns Promise resolving to array of games needing sync
   *
   * @example
   * ```typescript
   * const staleGames = await gameRepo.getStaleGames(10);
   * for (const game of staleGames) {
   *   await syncGameFromBGG(game);
   * }
   * ```
   */
  async getStaleGames(limit: number = 50): Promise<Game[]> {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .select('*')
        .or(
          'last_bgg_sync.is.null,last_bgg_sync.lt.' +
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get stale games: ${error.message}`);
      }

      return (data || []) as Game[];
    } catch (error) {
      throw new Error(
        `Database error in getStaleGames: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update game's last BGG sync timestamp
   *
   * @param gameId - The game's unique identifier
   * @returns Promise that resolves when operation completes
   *
   * @example
   * ```typescript
   * await gameRepo.updateLastSync('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
  async updateLastSync(gameId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('games')
        .update({ last_bgg_sync: new Date().toISOString() } as never)
        .eq('id', gameId);

      if (error) {
        throw new Error(
          `Failed to update last sync for game ${gameId}: ${error.message}`
        );
      }
    } catch (error) {
      throw new Error(
        `Database error in updateLastSync: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get game statistics
   *
   * @returns Promise resolving to game statistics object
   *
   * @example
   * ```typescript
   * const stats = await gameRepo.getStats();
   * console.log(`Total games: ${stats.totalGames}`);
   * console.log(`Games needing sync: ${stats.gamesNeedingSync}`);
   * ```
   */
  async getStats(): Promise<{
    totalGames: number;
    gamesNeedingSync: number;
    averageRating: number;
    mostPopularCategories: Array<{ category: string; count: number }>;
  }> {
    try {
      // Get total games count
      const { count: totalGames, error: totalError } = await this.supabase
        .from('games')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        throw new Error(
          `Failed to get total games count: ${totalError.message}`
        );
      }

      // Get games needing sync count
      const { count: gamesNeedingSync, error: staleError } = await this.supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .or(
          'last_bgg_sync.is.null,last_bgg_sync.lt.' +
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        );

      if (staleError) {
        throw new Error(
          `Failed to get stale games count: ${staleError.message}`
        );
      }

      // Get average rating
      const { data: ratingData, error: ratingError } = (await this.supabase
        .from('games')
        .select('bgg_rating')
        .not('bgg_rating', 'is', null)) as any;

      if (ratingError) {
        throw new Error(`Failed to get rating data: ${ratingError.message}`);
      }

      const averageRating =
        ratingData && ratingData.length > 0
          ? ratingData.reduce(
              (sum: number, game: any) => sum + (game.bgg_rating || 0),
              0
            ) / ratingData.length
          : 0;

      // Get most popular categories
      const { data: categoryData, error: categoryError } = (await this.supabase
        .from('games')
        .select('categories')) as any;

      if (categoryError) {
        throw new Error(
          `Failed to get category data: ${categoryError.message}`
        );
      }

      const categoryCounts = new Map<string, number>();
      categoryData?.forEach((game: any) => {
        game.categories?.forEach((category: string) => {
          categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        });
      });

      const mostPopularCategories = Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalGames: totalGames || 0,
        gamesNeedingSync: gamesNeedingSync || 0,
        averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
        mostPopularCategories,
      };
    } catch (error) {
      throw new Error(
        `Database error in getStats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
