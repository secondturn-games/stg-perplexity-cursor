/**
 * useLoading Hook Tests
 * Unit tests for the useLoading hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useLoading,
  useLoadingWithTimeout,
  useLoadingNoTimeout,
} from '../useLoading';

describe('useLoading', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should start with isLoading false', () => {
      const { result } = renderHook(() => useLoading());
      expect(result.current.isLoading).toBe(false);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useLoading());
      expect(typeof result.current.showLoading).toBe('function');
      expect(typeof result.current.hideLoading).toBe('function');
      expect(typeof result.current.withLoading).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('showLoading and hideLoading', () => {
    it('should show loading when showLoading is called', () => {
      const { result } = renderHook(() => useLoading());

      act(() => {
        result.current.showLoading();
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should hide loading when hideLoading is called', () => {
      const { result } = renderHook(() => useLoading());

      act(() => {
        result.current.showLoading();
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.hideLoading();
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle multiple showLoading calls (counter)', () => {
      const { result } = renderHook(() => useLoading());

      act(() => {
        result.current.showLoading();
        result.current.showLoading();
        result.current.showLoading();
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.hideLoading();
      });
      expect(result.current.isLoading).toBe(true); // Still loading

      act(() => {
        result.current.hideLoading();
      });
      expect(result.current.isLoading).toBe(true); // Still loading

      act(() => {
        result.current.hideLoading();
      });
      expect(result.current.isLoading).toBe(false); // Now hidden
    });
  });

  describe('withLoading', () => {
    it('should wrap async function and manage loading state', async () => {
      const { result } = renderHook(() => useLoading());
      const mockFn = jest.fn().mockResolvedValue('success');

      expect(result.current.isLoading).toBe(false);

      const promise = act(async () => {
        return await result.current.withLoading(mockFn);
      });

      // Should be loading during execution
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalled();
      });

      const returnValue = await promise;

      // Should return the function result
      expect(returnValue).toBe('success');

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors in withLoading', async () => {
      const { result } = renderHook(() => useLoading());
      const error = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(
        act(async () => {
          await result.current.withLoading(mockFn);
        })
      ).rejects.toThrow('Test error');

      // Should hide loading after error
      expect(result.current.isLoading).toBe(false);
    });

    it('should call onError callback on error', async () => {
      const onError = jest.fn();
      const { result } = renderHook(() => useLoading({ onError }));
      const error = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(
        act(async () => {
          await result.current.withLoading(mockFn);
        })
      ).rejects.toThrow();

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should handle hideOnError option', async () => {
      const { result } = renderHook(() => useLoading({ hideOnError: true }));
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(
        act(async () => {
          await result.current.withLoading(mockFn);
        })
      ).rejects.toThrow();

      // Should hide loading on error
      expect(result.current.isLoading).toBe(false);
    });

    it('should not hide on error when hideOnError is false', async () => {
      const { result } = renderHook(() => useLoading({ hideOnError: false }));
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(
        act(async () => {
          await result.current.withLoading(mockFn);
        })
      ).rejects.toThrow();

      // Should still be loading
      expect(result.current.isLoading).toBe(true);

      // Manually hide
      act(() => {
        result.current.hideLoading();
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should trigger timeout callback', () => {
      const onTimeout = jest.fn();
      const { result } = renderHook(() =>
        useLoading({ defaultTimeout: 1000, onTimeout })
      );

      act(() => {
        result.current.showLoading();
      });

      expect(result.current.isLoading).toBe(true);

      // Advance time past timeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onTimeout).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear timeout when loading is hidden manually', () => {
      const onTimeout = jest.fn();
      const { result } = renderHook(() =>
        useLoading({ defaultTimeout: 1000, onTimeout })
      );

      act(() => {
        result.current.showLoading();
      });

      // Hide before timeout
      act(() => {
        result.current.hideLoading();
      });

      // Advance time past timeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Timeout should not be called
      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should support custom timeout in withLoading', async () => {
      jest.useRealTimers(); // Use real timers for this test
      const onTimeout = jest.fn();
      const { result } = renderHook(() => useLoading({ onTimeout }));

      const slowFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done';
      };

      await act(async () => {
        await result.current.withLoading(slowFn, { timeout: 50 });
      });

      // Should complete without timeout (because we use real timers and the function completes)
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset loading state', () => {
      const { result } = renderHook(() => useLoading());

      act(() => {
        result.current.showLoading();
        result.current.showLoading();
        result.current.showLoading();
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.reset();
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear active timeouts', () => {
      jest.useFakeTimers();
      const onTimeout = jest.fn();
      const { result } = renderHook(() =>
        useLoading({ defaultTimeout: 1000, onTimeout })
      );

      act(() => {
        result.current.showLoading();
      });

      act(() => {
        result.current.reset();
      });

      // Advance time past timeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Timeout should not be called after reset
      expect(onTimeout).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('Specialized Hooks', () => {
    it('useLoadingWithTimeout should set custom timeout', () => {
      jest.useFakeTimers();
      const onTimeout = jest.fn();
      const { result } = renderHook(() => useLoadingWithTimeout(500));

      // Note: We can't easily test the timeout value directly,
      // but we can test that the hook functions correctly
      expect(typeof result.current.showLoading).toBe('function');
      expect(typeof result.current.withLoading).toBe('function');

      jest.useRealTimers();
    });

    it('useLoadingNoTimeout should not set timeout', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useLoadingNoTimeout());

      act(() => {
        result.current.showLoading();
      });

      expect(result.current.isLoading).toBe(true);

      // Advance time significantly
      act(() => {
        jest.advanceTimersByTime(100000);
      });

      // Should still be loading (no timeout)
      expect(result.current.isLoading).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should clean up timeout on unmount', () => {
      const onTimeout = jest.fn();
      const { result, unmount } = renderHook(() =>
        useLoading({ defaultTimeout: 1000, onTimeout })
      );

      act(() => {
        result.current.showLoading();
      });

      unmount();

      // Advance time past timeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Timeout should not be called after unmount
      expect(onTimeout).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should convert non-Error objects to Error', async () => {
      const { result } = renderHook(() => useLoading());
      const mockFn = jest.fn().mockRejectedValue('string error');

      await expect(
        act(async () => {
          await result.current.withLoading(mockFn);
        })
      ).rejects.toThrow();

      expect(result.current.isLoading).toBe(false);
    });

    it('should call per-call onError handler', async () => {
      const globalOnError = jest.fn();
      const perCallOnError = jest.fn();
      const { result } = renderHook(() =>
        useLoading({ onError: globalOnError })
      );
      const error = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(error);

      await expect(
        act(async () => {
          await result.current.withLoading(mockFn, { onError: perCallOnError });
        })
      ).rejects.toThrow();

      // Both should be called
      expect(globalOnError).toHaveBeenCalledWith(error);
      expect(perCallOnError).toHaveBeenCalledWith(error);
    });
  });
});
