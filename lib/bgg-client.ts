/**
 * BoardGameGeek API Client
 * Simplified wrapper around BGGService for backward compatibility
 */

import { BGGService } from './bgg/BGGService';
import type {
  BGGSearchResponse,
  BGGGameDetails,
  BGGCollectionResponse,
  SearchFilters,
} from '@/types/bgg.types';

class BGGClient {
  private service: BGGService;

  constructor() {
    this.service = new BGGService();
  }

  /**
   * Search for games on BGG
   */
  async searchGames(
    query: string,
    filters: SearchFilters = {}
  ): Promise<BGGSearchResponse> {
    return this.service.searchGames(query, filters);
  }

  /**
   * Get detailed information about a specific game
   */
  async getGameDetails(gameId: string): Promise<BGGGameDetails> {
    return this.service.getGameDetails(gameId);
  }

  /**
   * Get user's game collection
   */
  async getUserCollection(username: string): Promise<BGGCollectionResponse> {
    return this.service.getUserCollection(username);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.service.getCacheStats();
  }

  /**
   * Get adaptive cache statistics
   */
  getAdaptiveCacheStats() {
    return this.service.getAdaptiveCacheStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.service.clearCache();
  }

  /**
   * Clear cache for specific pattern
   */
  clearCachePattern(pattern: string): void {
    this.service.clearCachePattern(pattern);
  }
}

// Export singleton instance
export const bggClient = new BGGClient();
export default bggClient;
