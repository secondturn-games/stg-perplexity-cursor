/**
 * BGG API Operations with Loading State Integration
 * Wrapper functions for BGG API calls that integrate with useLoading hook
 *
 * @module lib/bgg/api-with-loading
 */

import type { UseLoadingReturn } from '@/hooks/useLoading';
import type {
  BGGSearchResponse,
  BGGGameDetails,
  BGGCollectionResponse,
  SearchFilters,
} from '@/types/bgg.types';
import { apiRequest, type ApiRequestOptions } from '@/lib/api';

/**
 * Options for BGG API operations with loading
 */
export interface BGGLoadingOptions extends ApiRequestOptions {
  /**
   * Whether to process images for this request
   * @default false
   */
  processImages?: boolean;
}

/**
 * Search for board games with loading state
 *
 * @param query - Search query
 * @param filters - Optional search filters
 * @param loadingHook - The useLoading hook instance
 * @param options - Loading configuration options
 * @returns Promise resolving to search results
 *
 * @example
 * ```tsx
 * const { isLoading, withLoading } = useLoading();
 *
 * const { data, error } = await searchGamesWithLoading(
 *   'Catan',
 *   { gameType: 'boardgame', exactMatch: false },
 *   { withLoading }
 * );
 * ```
 */
export async function searchGamesWithLoading(
  query: string,
  filters: SearchFilters = {},
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options: BGGLoadingOptions = {}
) {
  const params = new URLSearchParams({
    q: query,
    ...(filters.gameType &&
      filters.gameType !== 'all' && { gameType: filters.gameType }),
    ...(filters.exactMatch && { exactMatch: 'true' }),
  });

  return apiRequest<BGGSearchResponse>(
    `/api/bgg/search?${params}`,
    {
      method: 'GET',
      loadingDelay: 300,
      timeout: 30000,
      ...options,
    },
    loadingHook
  );
}

/**
 * Get board game details with loading state
 *
 * @param gameId - BGG game ID
 * @param loadingHook - The useLoading hook instance
 * @param options - Loading configuration options
 * @returns Promise resolving to game details
 *
 * @example
 * ```tsx
 * const { isLoading, withLoading } = useLoading();
 *
 * const { data, error } = await getGameDetailsWithLoading(
 *   '13',
 *   { withLoading },
 *   { processImages: true }
 * );
 * ```
 */
export async function getGameDetailsWithLoading(
  gameId: string,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options: BGGLoadingOptions = {}
) {
  const { processImages = false, ...apiOptions } = options;

  const params = new URLSearchParams({
    ...(processImages && { process_images: 'true' }),
  });

  const queryString = params.toString();
  const endpoint = `/api/bgg/game/${gameId}${queryString ? `?${queryString}` : ''}`;

  return apiRequest<BGGGameDetails>(
    endpoint,
    {
      method: 'GET',
      loadingDelay: 300,
      timeout: 30000,
      ...apiOptions,
    },
    loadingHook
  );
}

/**
 * Get user's BGG collection with loading state
 *
 * @param username - BGG username
 * @param loadingHook - The useLoading hook instance
 * @param options - Loading configuration options
 * @returns Promise resolving to collection data
 *
 * @example
 * ```tsx
 * const { isLoading, withLoading } = useLoading();
 *
 * const { data, error } = await getUserCollectionWithLoading(
 *   'boardgamer123',
 *   { withLoading }
 * );
 * ```
 */
export async function getUserCollectionWithLoading(
  username: string,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options: BGGLoadingOptions = {}
) {
  const params = new URLSearchParams({ username });

  return apiRequest<BGGCollectionResponse>(
    `/api/bgg/collection?${params}`,
    {
      method: 'GET',
      loadingDelay: 300,
      timeout: 60000, // Collections can be large
      ...options,
    },
    loadingHook
  );
}

/**
 * Batch update multiple games with loading state
 *
 * @param gameIds - Array of BGG game IDs
 * @param loadingHook - The useLoading hook instance
 * @param options - Loading configuration options
 * @returns Promise resolving to batch update result
 *
 * @example
 * ```tsx
 * const { isLoading, withLoading } = useLoading();
 *
 * const { data, error } = await batchUpdateGamesWithLoading(
 *   ['13', '174430', '822'],
 *   { withLoading }
 * );
 * ```
 */
export async function batchUpdateGamesWithLoading(
  gameIds: string[],
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options: BGGLoadingOptions = {}
) {
  return apiRequest(
    '/api/bgg/batch',
    {
      method: 'POST',
      body: JSON.stringify({ gameIds }),
      headers: {
        'Content-Type': 'application/json',
      },
      loadingDelay: 300,
      timeout: 120000, // Batch operations can take longer
      ...options,
    },
    loadingHook
  );
}

/**
 * Check BGG API health with loading state
 *
 * @param loadingHook - The useLoading hook instance
 * @param options - Loading configuration options
 * @returns Promise resolving to health check result
 */
export async function checkBGGHealthWithLoading(
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options: BGGLoadingOptions = {}
) {
  return apiRequest(
    '/api/bgg/health',
    {
      method: 'GET',
      loadingDelay: 100, // Health checks should be quick
      timeout: 10000,
      ...options,
    },
    loadingHook
  );
}

/**
 * Get trending games with loading state
 *
 * @param loadingHook - The useLoading hook instance
 * @param options - Loading configuration options
 * @returns Promise resolving to trending games
 */
export async function getTrendingGamesWithLoading(
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options: BGGLoadingOptions = {}
) {
  return apiRequest(
    '/api/bgg/trending',
    {
      method: 'GET',
      loadingDelay: 300,
      timeout: 30000,
      ...options,
    },
    loadingHook
  );
}

/**
 * Get hot games (BGG "hotness" list) with loading state
 *
 * @param loadingHook - The useLoading hook instance
 * @param options - Loading configuration options
 * @returns Promise resolving to hot games
 */
export async function getHotGamesWithLoading(
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options: BGGLoadingOptions = {}
) {
  return apiRequest(
    '/api/bgg/hot',
    {
      method: 'GET',
      loadingDelay: 300,
      timeout: 30000,
      ...options,
    },
    loadingHook
  );
}
