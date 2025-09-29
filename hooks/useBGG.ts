/**
 * BGG API React Hook
 * Provides easy access to BGG API functions in React components
 */

import { useState, useCallback, useRef } from 'react';
import type {
  BGGSearchResponse,
  BGGGameDetails,
  BGGCollectionResponse,
  BGGBatchUpdate,
  SearchFilters,
} from '@/types/bgg.types';
import { BGGError } from '@/types/bgg.types';

interface UseBGGState {
  loading: boolean;
  error: BGGError | null;
  data: any;
}

interface UseBGGReturn {
  // Search
  searchGames: (
    query: string,
    filters?: SearchFilters
  ) => Promise<BGGSearchResponse>;
  searchState: UseBGGState;

  // Game Details
  getGameDetails: (
    gameId: string,
    processImages?: boolean
  ) => Promise<BGGGameDetails>;
  gameState: UseBGGState;

  // Collection
  getUserCollection: (username: string) => Promise<BGGCollectionResponse>;
  collectionState: UseBGGState;

  // Batch Operations
  batchUpdateGames: (gameIds: string[]) => Promise<BGGBatchUpdate>;
  batchState: UseBGGState;

  // Utility
  clearError: () => void;
  clearData: () => void;
}

export function useBGG(): UseBGGReturn {
  // State for different operations
  const [searchState, setSearchState] = useState<UseBGGState>({
    loading: false,
    error: null,
    data: null,
  });

  const [gameState, setGameState] = useState<UseBGGState>({
    loading: false,
    error: null,
    data: null,
  });

  const [collectionState, setCollectionState] = useState<UseBGGState>({
    loading: false,
    error: null,
    data: null,
  });

  const [batchState, setBatchState] = useState<UseBGGState>({
    loading: false,
    error: null,
    data: null,
  });

  // Abort controller for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generic API call function
  const makeApiCall = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {},
      setState: (state: UseBGGState) => void
    ) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setState({ loading: true, error: null, data: null });

      try {
        const response = await fetch(endpoint, {
          ...options,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);

          // Handle BGG-specific error format
          if (errorData.error && typeof errorData.error === 'object') {
            const bggError = new BGGError(
              errorData.error.code || 'BGG_ERROR',
              errorData.error.message || 'Unknown BGG error',
              errorData.error.details,
              errorData.error.retryAfter,
              errorData.error.userMessage
            );
            throw bggError;
          }

          // Handle simple error format
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setState({ loading: false, error: null, data });
        return data;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, don't update state
          return;
        }

        let bggError: BGGError;

        if (error instanceof BGGError) {
          bggError = error;
        } else if (error instanceof Error) {
          console.error('Error instance caught in useBGG:', error);
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          bggError = new BGGError(
            'BGG_ERROR',
            error.message || 'Unknown error',
            error
          );
        } else {
          // Handle non-Error objects (like plain objects or strings)
          console.error('Non-Error object caught in useBGG:', error);
          console.error('Error type:', typeof error);
          console.error('Error constructor:', error?.constructor?.name);

          let errorMessage = 'Unknown error';
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object') {
            // Try to extract meaningful error information
            if ('message' in error && typeof error.message === 'string') {
              errorMessage = error.message;
            } else if ('error' in error && typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (
              'details' in error &&
              typeof error.details === 'string'
            ) {
              errorMessage = error.details;
            } else {
              errorMessage = JSON.stringify(error, null, 2);
            }
          }

          const errorObj = new Error(errorMessage);
          bggError = new BGGError('BGG_ERROR', errorMessage, errorObj);
        }

        setState({ loading: false, error: bggError, data: null });
        throw bggError;
      }
    },
    []
  );

  // Search games
  const searchGames = useCallback(
    async (query: string, filters: SearchFilters = {}) => {
      const params = new URLSearchParams({
        q: query,
        ...(filters.gameType &&
          filters.gameType !== 'all' && { gameType: filters.gameType }),
        ...(filters.exactMatch && { exactMatch: 'true' }),
      });

      return makeApiCall(
        `/api/bgg/search?${params}`,
        { method: 'GET' },
        setSearchState
      );
    },
    [makeApiCall]
  );

  // Get game details
  const getGameDetails = useCallback(
    async (gameId: string, processImages: boolean = false) => {
      const params = new URLSearchParams({
        ...(processImages && { process_images: 'true' }),
      });

      const queryString = params.toString();
      const endpoint = `/api/bgg/game/${gameId}${queryString ? `?${queryString}` : ''}`;

      return makeApiCall(endpoint, { method: 'GET' }, setGameState);
    },
    [makeApiCall]
  );

  // Get user collection
  const getUserCollection = useCallback(
    async (username: string) => {
      const params = new URLSearchParams({ username });

      return makeApiCall(
        `/api/bgg/collection?${params}`,
        { method: 'GET' },
        setCollectionState
      );
    },
    [makeApiCall]
  );

  // Batch update games
  const batchUpdateGames = useCallback(
    async (gameIds: string[]) => {
      return makeApiCall(
        '/api/bgg/batch',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameIds }),
        },
        setBatchState
      );
    },
    [makeApiCall]
  );

  // Clear error
  const clearError = useCallback(() => {
    setSearchState(prev => ({ ...prev, error: null }));
    setGameState(prev => ({ ...prev, error: null }));
    setCollectionState(prev => ({ ...prev, error: null }));
    setBatchState(prev => ({ ...prev, error: null }));
  }, []);

  // Clear data
  const clearData = useCallback(() => {
    setSearchState(prev => ({ ...prev, data: null }));
    setGameState(prev => ({ ...prev, data: null }));
    setCollectionState(prev => ({ ...prev, data: null }));
    setBatchState(prev => ({ ...prev, data: null }));
  }, []);

  return {
    searchGames,
    searchState,
    getGameDetails,
    gameState,
    getUserCollection,
    collectionState,
    batchUpdateGames,
    batchState,
    clearError,
    clearData,
  };
}

// Specialized hooks for specific operations
export function useBGGSearch() {
  const { searchGames, searchState, clearError, clearData } = useBGG();

  return {
    searchGames,
    loading: searchState.loading,
    error: searchState.error,
    data: searchState.data,
    clearError,
    clearData,
  };
}

export function useBGGGameDetails() {
  const { getGameDetails, gameState, clearError, clearData } = useBGG();

  return {
    getGameDetails,
    loading: gameState.loading,
    error: gameState.error,
    data: gameState.data,
    clearError,
    clearData,
  };
}

export function useBGGCollection() {
  const { getUserCollection, collectionState, clearError, clearData } =
    useBGG();

  return {
    getUserCollection,
    loading: collectionState.loading,
    error: collectionState.error,
    data: collectionState.data,
    clearError,
    clearData,
  };
}

export function useBGGBatch() {
  const { batchUpdateGames, batchState, clearError, clearData } = useBGG();

  return {
    batchUpdateGames,
    loading: batchState.loading,
    error: batchState.error,
    data: batchState.data,
    clearError,
    clearData,
  };
}
