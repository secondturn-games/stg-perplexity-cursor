/**
 * BGG Database Optimizer
 * Optimized database queries and operations for BGG data
 */

import { createServerComponentClient } from '@/lib/supabase';
import { Game } from '@/types/database.types';

export interface OptimizedGameQuery {
  searchTerm?: string;
  categories?: string[];
  mechanics?: string[];
  minPlayers?: number;
  maxPlayers?: number;
  minRating?: number;
  yearFrom?: number;
  yearTo?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'rating' | 'year' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface StaleGameQuery {
  maxAge?: number; // hours
  limit?: number;
  priority?: 'high' | 'normal' | 'low';
}

export class BGGDatabaseOptimizer {
  private supabase = createServerComponentClient();

  /**
   * Optimized game search with database-first approach
   */
  async searchGamesInDatabase(query: OptimizedGameQuery): Promise<Game[]> {
    const {
      searchTerm,
      categories,
      mechanics,
      minPlayers,
      maxPlayers,
      minRating,
      yearFrom,
      yearTo,
      limit = 50,
      offset = 0,
      sortBy = 'relevance',
      sortOrder = 'desc',
    } = query;

    let dbQuery = this.supabase
      .from('games')
      .select('*')
      .not('last_bgg_sync', 'is', null); // Only cached games

    // Text search using trigram index
    if (searchTerm && searchTerm.length >= 2) {
      dbQuery = dbQuery.textSearch('title', searchTerm, {
        type: 'websearch',
        config: 'english',
      });
    }

    // Category filter using GIN index
    if (categories && categories.length > 0) {
      dbQuery = dbQuery.overlaps('categories', categories);
    }

    // Mechanics filter using GIN index (handle both mechanics and mechanisms columns)
    if (mechanics && mechanics.length > 0) {
      // Check if mechanics column exists, otherwise use mechanisms
      const mechanicsColumn = await this.getMechanicsColumnName();
      dbQuery = dbQuery.overlaps(mechanicsColumn, mechanics);
    }

    // Player count filters
    if (minPlayers) {
      dbQuery = dbQuery.gte('max_players', minPlayers);
    }
    if (maxPlayers) {
      dbQuery = dbQuery.lte('min_players', maxPlayers);
    }

    // Rating filter
    if (minRating) {
      dbQuery = dbQuery.gte('bgg_rating', minRating);
    }

    // Year range filter
    if (yearFrom) {
      dbQuery = dbQuery.gte('year_published', yearFrom);
    }
    if (yearTo) {
      dbQuery = dbQuery.lte('year_published', yearTo);
    }

    // Sorting optimization
    switch (sortBy) {
      case 'rating':
        dbQuery = dbQuery.order('bgg_rating', {
          ascending: sortOrder === 'asc',
        });
        break;
      case 'year':
        dbQuery = dbQuery.order('year_published', {
          ascending: sortOrder === 'asc',
        });
        break;
      case 'title':
        dbQuery = dbQuery.order('title', { ascending: sortOrder === 'asc' });
        break;
      case 'relevance':
      default:
        // For relevance, use a combination of rating and recency
        dbQuery = dbQuery.order('bgg_rating', { ascending: false });
        break;
    }

    // Pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Database search error:', error);
      throw new Error(`Database search failed: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get games that need BGG synchronization (optimized)
   */
  async getStaleGames(query: StaleGameQuery = {}): Promise<Game[]> {
    const {
      maxAge = 24, // 24 hours default
      limit = 100,
      priority = 'normal',
    } = query;

    // Calculate cutoff time
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAge);

    let dbQuery = this.supabase
      .from('games')
      .select('*')
      .or(`last_bgg_sync.is.null,last_bgg_sync.lt.${cutoffTime.toISOString()}`);

    // Priority-based ordering
    switch (priority) {
      case 'high':
        // High priority: popular games (high rating, low rank)
        dbQuery = dbQuery
          .order('bgg_rating', { ascending: false })
          .order('bgg_rank', { ascending: true });
        break;
      case 'low':
        // Low priority: less popular games
        dbQuery = dbQuery
          .order('bgg_rating', { ascending: true })
          .order('bgg_rank', { ascending: false });
        break;
      case 'normal':
      default:
        // Normal priority: oldest sync first
        dbQuery = dbQuery
          .order('last_bgg_sync', { ascending: true, nullsFirst: true })
          .order('updated_at', { ascending: true });
        break;
    }

    dbQuery = dbQuery.limit(limit);

    const { data, error } = await dbQuery;

    if (error) {
      console.error('Get stale games error:', error);
      throw new Error(`Failed to get stale games: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Bulk upsert games with conflict resolution
   */
  async bulkUpsertGames(games: Partial<Game>[]): Promise<Game[]> {
    if (games.length === 0) {
      return [];
    }

    // Process in batches to avoid query size limits
    const batchSize = 100;
    const results: Game[] = [];

    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);

      const { data, error } = await this.supabase
        .from('games')
        .upsert(batch as any[], {
          onConflict: 'bgg_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error(`Bulk upsert batch ${i / batchSize + 1} error:`, error);
        throw new Error(`Bulk upsert failed: ${error.message}`);
      }

      results.push(...(data || []));
    }

    console.log(`✅ Bulk upserted ${results.length} games`);
    return results;
  }

  /**
   * Get game by BGG ID with optimized query
   */
  async getGameByBggId(bggId: number): Promise<Game | null> {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .eq('bgg_id', bggId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get game by BGG ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Update last sync timestamp efficiently
   */
  async updateLastSync(gameIds: string[]): Promise<void> {
    if (gameIds.length === 0) {
      return;
    }

    const { error } = await this.supabase
      .from('games')
      .update({
        last_bgg_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', gameIds);

    if (error) {
      throw new Error(`Failed to update last sync: ${error.message}`);
    }
  }

  /**
   * Get cache statistics from database
   */
  async getDatabaseCacheStats(): Promise<{
    totalGames: number;
    recentlySynced: number;
    staleGames: number;
    averageSyncAge: number;
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get total games count
    const { count: totalGames } = await this.supabase
      .from('games')
      .select('*', { count: 'exact', head: true });

    // Get recently synced games (last 24 hours)
    const { count: recentlySynced } = await this.supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .gte('last_bgg_sync', oneDayAgo.toISOString());

    // Get stale games (older than 1 week or never synced)
    const { count: staleGames } = await this.supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .or(`last_bgg_sync.is.null,last_bgg_sync.lt.${oneWeekAgo.toISOString()}`);

    // Calculate average sync age
    const { data: syncData } = await this.supabase
      .from('games')
      .select('last_bgg_sync')
      .not('last_bgg_sync', 'is', null);

    const averageSyncAge = syncData?.length
      ? syncData.reduce((sum, game) => {
          const syncTime = new Date(game.last_bgg_sync!).getTime();
          const ageHours = (now.getTime() - syncTime) / (1000 * 60 * 60);
          return sum + ageHours;
        }, 0) / syncData.length
      : 0;

    return {
      totalGames: totalGames || 0,
      recentlySynced: recentlySynced || 0,
      staleGames: staleGames || 0,
      averageSyncAge: Math.round(averageSyncAge * 10) / 10,
    };
  }

  /**
   * Get popular games for cache warming
   */
  async getPopularGames(limit: number = 100): Promise<Game[]> {
    const { data, error } = await this.supabase
      .from('games')
      .select('*')
      .not('bgg_rank', 'is', null)
      .not('bgg_rating', 'is', null)
      .order('bgg_rank', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Get popular games error:', error);
      throw new Error(`Failed to get popular games: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Optimized search suggestions based on database content
   */
  async getSearchSuggestions(
    query: string,
    limit: number = 10
  ): Promise<string[]> {
    if (query.length < 2) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('games')
      .select('title')
      .ilike('title', `%${query}%`)
      .order('bgg_rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get search suggestions error:', error);
      return [];
    }

    return data?.map(game => game.title) || [];
  }

  /**
   * Get mechanics column name (handles both mechanics and mechanisms)
   */
  private async getMechanicsColumnName(): Promise<string> {
    // For now, return 'mechanics' as the default since we're using the fresh schema
    // This method can be enhanced later if needed to dynamically detect column names
    return 'mechanics';
  }
}
