/**
 * Game Repository Interface
 * Defines the contract for game data management operations
 * 
 * This interface abstracts the data access layer for game entities,
 * providing a clean separation between business logic and data persistence.
 * It supports both database operations and caching strategies.
 */

import type { BGGGameDetails } from '@/types/bgg.types';
import type { Game, GameSearchFilters } from '@/types/database.types';

/**
 * Interface for game repository operations
 * 
 * @template T - The game entity type (typically Game from database types)
 */
export interface IGameRepository<T = Game> {
  /**
   * Find a game by its unique identifier
   * 
   * @param id - The game's unique identifier (UUID)
   * @returns Promise resolving to the game entity or null if not found
   * @throws {Error} When database operation fails
   * 
   * @example
   * ```typescript
   * const game = await gameRepository.findById('123e4567-e89b-12d3-a456-426614174000');
   * if (game) {
   *   console.log(`Found game: ${game.title}`);
   * }
   * ```
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find a game by its BoardGameGeek ID
   * 
   * @param bggId - The BGG numeric identifier
   * @returns Promise resolving to the game entity or null if not found
   * @throws {Error} When database operation fails
   * 
   * @example
   * ```typescript
   * const game = await gameRepository.findByBggId(12345);
   * if (game) {
   *   console.log(`Found BGG game: ${game.title}`);
   * }
   * ```
   */
  findByBggId(bggId: number): Promise<T | null>;

  /**
   * Search for games using various filters
   * 
   * @param filters - Search criteria including categories, mechanics, player counts, etc.
   * @returns Promise resolving to an array of matching games
   * @throws {Error} When database operation fails
   * 
   * @example
   * ```typescript
   * const results = await gameRepository.search({
   *   categories: ['Strategy'],
   *   min_players: 2,
   *   max_players: 4,
   *   min_rating: 7.0
   * });
   * console.log(`Found ${results.length} games`);
   * ```
   */
  search(filters: GameSearchFilters): Promise<T[]>;

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
   * const game = await gameRepository.upsert(bggGame);
   * console.log(`Upserted game: ${game.title}`);
   * ```
   */
  upsert(game: BGGGameDetails): Promise<T>;

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
   * const games = await gameRepository.bulkUpsert(bggGames);
   * console.log(`Upserted ${games.length} games`);
   * ```
   */
  bulkUpsert(games: BGGGameDetails[]): Promise<T[]>;

  /**
   * Mark games as stale (requiring BGG sync)
   * 
   * @param gameIds - Array of game IDs to mark as stale
   * @returns Promise that resolves when operation completes
   * @throws {Error} When database operation fails
   * 
   * @example
   * ```typescript
   * await gameRepository.markStale(['123e4567-e89b-12d3-a456-426614174000']);
   * console.log('Game marked as stale for BGG sync');
   * ```
   */
  markStale(gameIds: string[]): Promise<void>;
}

/**
 * Extended game repository interface with additional utility methods
 * 
 * @template T - The game entity type
 */
export interface IExtendedGameRepository<T = Game> extends IGameRepository<T> {
  /**
   * Get games that require BGG synchronization
   * 
   * @param limit - Maximum number of games to return
   * @returns Promise resolving to array of games needing sync
   * 
   * @example
   * ```typescript
   * const staleGames = await gameRepository.getStaleGames(10);
   * for (const game of staleGames) {
   *   await syncGameFromBGG(game);
   * }
   * ```
   */
  getStaleGames(limit?: number): Promise<T[]>;

  /**
   * Update game's last BGG sync timestamp
   * 
   * @param gameId - The game's unique identifier
   * @returns Promise that resolves when operation completes
   * 
   * @example
   * ```typescript
   * await gameRepository.updateLastSync('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
  updateLastSync(gameId: string): Promise<void>;

  /**
   * Get game statistics
   * 
   * @returns Promise resolving to game statistics object
   * 
   * @example
   * ```typescript
   * const stats = await gameRepository.getStats();
   * console.log(`Total games: ${stats.totalGames}`);
   * console.log(`Games needing sync: ${stats.gamesNeedingSync}`);
   * ```
   */
  getStats(): Promise<{
    totalGames: number;
    gamesNeedingSync: number;
    averageRating: number;
    mostPopularCategories: Array<{ category: string; count: number }>;
  }>;
}