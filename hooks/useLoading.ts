/**
 * useLoading Hook
 * Custom React hook for managing loading states with DiceLoader integration
 *
 * @module hooks/useLoading
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Configuration options for the useLoading hook
 */
export interface UseLoadingOptions {
  /**
   * Default timeout in milliseconds to prevent infinite loading states
   * @default 30000 (30 seconds)
   */
  defaultTimeout?: number;

  /**
   * Callback fired when a timeout occurs
   */
  onTimeout?: () => void;

  /**
   * Callback fired when an error occurs in withLoading
   */
  onError?: (error: Error) => void;

  /**
   * Whether to automatically hide loading on error
   * @default true
   */
  hideOnError?: boolean;
}

/**
 * Return type for the useLoading hook
 */
export interface UseLoadingReturn {
  /**
   * Current loading state
   */
  isLoading: boolean;

  /**
   * Show the loading indicator
   */
  showLoading: () => void;

  /**
   * Hide the loading indicator
   */
  hideLoading: () => void;

  /**
   * Wrap an async function with automatic loading state management
   * @param fn - The async function to wrap
   * @param options - Optional configuration for this specific call
   * @returns Promise that resolves with the function result
   */
  withLoading: <T>(
    fn: () => Promise<T>,
    options?: {
      timeout?: number;
      onError?: (error: Error) => void;
      hideOnError?: boolean;
    }
  ) => Promise<T>;

  /**
   * Reset the loading state and clear any active timeouts
   */
  reset: () => void;
}

/**
 * Custom hook for managing loading states
 *
 * @param options - Configuration options for the hook
 * @returns Object containing loading state and control functions
 *
 * @example
 * ```tsx
 * const { isLoading, withLoading } = useLoading();
 *
 * const fetchData = async () => {
 *   await withLoading(async () => {
 *     const response = await fetch('/api/data');
 *     const data = await response.json();
 *     setData(data);
 *   });
 * };
 * ```
 *
 * @example
 * ```tsx
 * // With DiceLoader component
 * const { isLoading, showLoading, hideLoading } = useLoading({
 *   defaultTimeout: 10000,
 *   onTimeout: () => console.error('Request timed out'),
 * });
 *
 * return (
 *   <>
 *     <DiceLoader isVisible={isLoading} text="Loading..." />
 *     <button onClick={showLoading}>Start</button>
 *   </>
 * );
 * ```
 */
export function useLoading(options: UseLoadingOptions = {}): UseLoadingReturn {
  const {
    defaultTimeout = 30000,
    onTimeout,
    onError,
    hideOnError = true,
  } = options;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingCountRef = useRef<number>(0);

  /**
   * Clear any active timeout
   */
  const clearLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Set up a timeout for the loading state
   */
  const setupTimeout = useCallback(
    (timeout: number) => {
      clearLoadingTimeout();

      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          loadingCountRef.current = 0;

          if (onTimeout) {
            onTimeout();
          }
        }, timeout);
      }
    },
    [clearLoadingTimeout, onTimeout]
  );

  /**
   * Show the loading indicator
   */
  const showLoading = useCallback(() => {
    loadingCountRef.current += 1;
    setIsLoading(true);

    // Set up default timeout if configured
    if (defaultTimeout > 0) {
      setupTimeout(defaultTimeout);
    }
  }, [defaultTimeout, setupTimeout]);

  /**
   * Hide the loading indicator
   */
  const hideLoading = useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);

    if (loadingCountRef.current === 0) {
      setIsLoading(false);
      clearLoadingTimeout();
    }
  }, [clearLoadingTimeout]);

  /**
   * Wrap an async function with automatic loading state management
   */
  const withLoading = useCallback(
    async <T>(
      fn: () => Promise<T>,
      callOptions: {
        timeout?: number;
        onError?: (error: Error) => void;
        hideOnError?: boolean;
      } = {}
    ): Promise<T> => {
      const timeoutDuration =
        callOptions.timeout !== undefined
          ? callOptions.timeout
          : defaultTimeout;
      const errorCallback = callOptions.onError || onError;
      const shouldHideOnError =
        callOptions.hideOnError !== undefined
          ? callOptions.hideOnError
          : hideOnError;

      // Show loading
      loadingCountRef.current += 1;
      setIsLoading(true);

      // Set up timeout for this specific call
      if (timeoutDuration > 0) {
        setupTimeout(timeoutDuration);
      }

      try {
        const result = await fn();

        // Hide loading on success
        loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
        if (loadingCountRef.current === 0) {
          setIsLoading(false);
          clearLoadingTimeout();
        }

        return result;
      } catch (error) {
        // Handle error
        const errorObj =
          error instanceof Error ? error : new Error(String(error));

        // Call error callback if provided
        if (errorCallback) {
          errorCallback(errorObj);
        }

        // Hide loading on error if configured
        if (shouldHideOnError) {
          loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
          if (loadingCountRef.current === 0) {
            setIsLoading(false);
            clearLoadingTimeout();
          }
        }

        // Re-throw the error so calling code can handle it
        throw errorObj;
      }
    },
    [defaultTimeout, onError, hideOnError, setupTimeout, clearLoadingTimeout]
  );

  /**
   * Reset the loading state and clear any active timeouts
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    loadingCountRef.current = 0;
    clearLoadingTimeout();
  }, [clearLoadingTimeout]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearLoadingTimeout();
    };
  }, [clearLoadingTimeout]);

  return {
    isLoading,
    showLoading,
    hideLoading,
    withLoading,
    reset,
  };
}

/**
 * Specialized hook for loading with custom timeout
 *
 * @param timeout - Timeout duration in milliseconds
 * @returns UseLoadingReturn object
 *
 * @example
 * ```tsx
 * const { isLoading, withLoading } = useLoadingWithTimeout(5000);
 * ```
 */
export function useLoadingWithTimeout(timeout: number): UseLoadingReturn {
  return useLoading({ defaultTimeout: timeout });
}

/**
 * Specialized hook for loading without timeout
 *
 * @returns UseLoadingReturn object
 *
 * @example
 * ```tsx
 * const { isLoading, showLoading, hideLoading } = useLoadingNoTimeout();
 * ```
 */
export function useLoadingNoTimeout(): UseLoadingReturn {
  return useLoading({ defaultTimeout: 0 });
}
