/**
 * API Utilities with Loading State Integration
 * Unified API layer for the Baltic Board Game Marketplace
 *
 * @module lib/api
 */

import type { UseLoadingReturn } from '@/hooks/useLoading';

/**
 * API request options
 */
export interface ApiRequestOptions extends RequestInit {
  /**
   * Whether to show loading animation for this request
   * @default true
   */
  showLoading?: boolean;

  /**
   * Custom timeout for this request (in milliseconds)
   * @default 30000
   */
  timeout?: number;

  /**
   * Delay before showing loading animation (in milliseconds)
   * Prevents flashing for quick requests
   * @default 300
   */
  loadingDelay?: number;

  /**
   * Custom error handler for this request
   */
  onError?: (error: Error) => void;

  /**
   * Whether to automatically retry on failure
   * @default false
   */
  retry?: boolean;

  /**
   * Number of retry attempts
   * @default 3
   */
  retryAttempts?: number;

  /**
   * Delay between retries (in milliseconds)
   * @default 1000
   */
  retryDelay?: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  status?: number | undefined;
}

/**
 * Configuration for API client
 */
export interface ApiClientConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  loadingDelay?: number;
}

/**
 * Create a fetch wrapper with loading state integration
 *
 * @param url - The URL to fetch
 * @param options - Request options including loading configuration
 * @param loadingHook - The useLoading hook instance
 * @returns Promise resolving to the response
 *
 * @example
 * ```tsx
 * const { isLoading, withLoading } = useLoading();
 *
 * const data = await apiRequest('/api/games', {
 *   method: 'GET',
 *   showLoading: true,
 *   loadingDelay: 300,
 * }, { withLoading });
 * ```
 */
export async function apiRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {},
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>
): Promise<ApiResponse<T>> {
  const {
    showLoading = true,
    timeout = 30000,
    loadingDelay = 300,
    onError,
    retry = false,
    retryAttempts = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  /**
   * Execute the request with optional loading state
   */
  const executeRequest = async (): Promise<ApiResponse<T>> => {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
        }));

        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Parse response
      const data = await response.json();

      return {
        data,
        error: null,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      // Call custom error handler if provided
      if (onError) {
        onError(errorObj);
      }

      return {
        data: null,
        error: errorObj,
        status: undefined,
      };
    }
  };

  /**
   * Execute request with retry logic if enabled
   */
  const executeWithRetry = async (): Promise<ApiResponse<T>> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < (retry ? retryAttempts : 1); attempt++) {
      const result = await executeRequest();

      if (result.error === null) {
        return result;
      }

      lastError = result.error;

      // Don't retry on last attempt
      if (attempt < retryAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return {
      data: null,
      error: lastError,
      status: undefined,
    };
  };

  /**
   * Execute request with loading state integration
   */
  if (showLoading && loadingHook?.withLoading) {
    // Delay showing loading for quick requests
    let showLoadingTimeout: NodeJS.Timeout | null = null;
    let shouldShowLoading = false;

    // Set up delayed loading
    const loadingPromise = new Promise<void>(resolve => {
      showLoadingTimeout = setTimeout(() => {
        shouldShowLoading = true;
        resolve();
      }, loadingDelay);
    });

    try {
      // Execute request
      const result = await executeWithRetry();

      // Clear loading delay timeout
      if (showLoadingTimeout) {
        clearTimeout(showLoadingTimeout);
      }

      // If request completed before delay, don't show loading
      if (!shouldShowLoading) {
        return result;
      }

      // Wrap result in loading state
      return await loadingHook.withLoading(async () => result, {
        timeout,
        ...(onError && { onError }),
      });
    } catch (error) {
      // Clear loading delay timeout
      if (showLoadingTimeout) {
        clearTimeout(showLoadingTimeout);
      }

      throw error;
    }
  }

  // Execute without loading state
  return executeWithRetry();
}

/**
 * Create an API client with default configuration
 *
 * @param config - Default configuration for the client
 * @returns Object with configured API methods
 *
 * @example
 * ```tsx
 * const api = createApiClient({
 *   baseUrl: '/api',
 *   headers: { 'Content-Type': 'application/json' },
 * });
 *
 * // Use with loading hook
 * const { withLoading } = useLoading();
 * const data = await api.get('/games', {}, { withLoading });
 * ```
 */
export function createApiClient(config: ApiClientConfig = {}) {
  const {
    baseUrl = '',
    headers: defaultHeaders = {},
    timeout: defaultTimeout = 30000,
    loadingDelay: defaultLoadingDelay = 300,
  } = config;

  /**
   * Build full URL from base URL and path
   */
  const buildUrl = (path: string): string => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${baseUrl}${path}`;
  };

  /**
   * Merge headers with defaults
   */
  const mergeHeaders = (
    headers?: Record<string, string>
  ): Record<string, string> => {
    return {
      ...defaultHeaders,
      ...headers,
    };
  };

  return {
    /**
     * GET request
     */
    get: async <T = any>(
      path: string,
      options: ApiRequestOptions = {},
      loadingHook?: Pick<UseLoadingReturn, 'withLoading'>
    ): Promise<ApiResponse<T>> => {
      return apiRequest<T>(
        buildUrl(path),
        {
          ...options,
          method: 'GET',
          headers: mergeHeaders(options.headers as Record<string, string>),
          timeout: options.timeout || defaultTimeout,
          loadingDelay: options.loadingDelay || defaultLoadingDelay,
        },
        loadingHook
      );
    },

    /**
     * POST request
     */
    post: async <T = any>(
      path: string,
      body?: any,
      options: ApiRequestOptions = {},
      loadingHook?: Pick<UseLoadingReturn, 'withLoading'>
    ): Promise<ApiResponse<T>> => {
      return apiRequest<T>(
        buildUrl(path),
        {
          ...options,
          method: 'POST',
          headers: mergeHeaders(
            (options.headers as Record<string, string>) || {
              'Content-Type': 'application/json',
            }
          ),
          body: body ? JSON.stringify(body) : null,
          timeout: options.timeout || defaultTimeout,
          loadingDelay: options.loadingDelay || defaultLoadingDelay,
        },
        loadingHook
      );
    },

    /**
     * PUT request
     */
    put: async <T = any>(
      path: string,
      body?: any,
      options: ApiRequestOptions = {},
      loadingHook?: Pick<UseLoadingReturn, 'withLoading'>
    ): Promise<ApiResponse<T>> => {
      return apiRequest<T>(
        buildUrl(path),
        {
          ...options,
          method: 'PUT',
          headers: mergeHeaders(
            (options.headers as Record<string, string>) || {
              'Content-Type': 'application/json',
            }
          ),
          body: body ? JSON.stringify(body) : null,
          timeout: options.timeout || defaultTimeout,
          loadingDelay: options.loadingDelay || defaultLoadingDelay,
        },
        loadingHook
      );
    },

    /**
     * PATCH request
     */
    patch: async <T = any>(
      path: string,
      body?: any,
      options: ApiRequestOptions = {},
      loadingHook?: Pick<UseLoadingReturn, 'withLoading'>
    ): Promise<ApiResponse<T>> => {
      return apiRequest<T>(
        buildUrl(path),
        {
          ...options,
          method: 'PATCH',
          headers: mergeHeaders(
            (options.headers as Record<string, string>) || {
              'Content-Type': 'application/json',
            }
          ),
          body: body ? JSON.stringify(body) : null,
          timeout: options.timeout || defaultTimeout,
          loadingDelay: options.loadingDelay || defaultLoadingDelay,
        },
        loadingHook
      );
    },

    /**
     * DELETE request
     */
    delete: async <T = any>(
      path: string,
      options: ApiRequestOptions = {},
      loadingHook?: Pick<UseLoadingReturn, 'withLoading'>
    ): Promise<ApiResponse<T>> => {
      return apiRequest<T>(
        buildUrl(path),
        {
          ...options,
          method: 'DELETE',
          headers: mergeHeaders(options.headers as Record<string, string>),
          timeout: options.timeout || defaultTimeout,
          loadingDelay: options.loadingDelay || defaultLoadingDelay,
        },
        loadingHook
      );
    },
  };
}

/**
 * Default API client instance
 */
export const api = createApiClient({
  headers: {
    'Content-Type': 'application/json',
  },
});
