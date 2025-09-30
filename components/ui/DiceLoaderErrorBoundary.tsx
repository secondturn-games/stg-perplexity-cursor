/**
 * DiceLoader Error Boundary
 * Catches and handles errors in DiceLoader component
 */

'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  /**
   * Children to render
   */
  children: ReactNode;

  /**
   * Fallback UI to render on error
   */
  fallback?: ReactNode;

  /**
   * Callback when error occurs
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * DiceLoaderErrorBoundary - Wraps DiceLoader to prevent crashes
 *
 * Provides graceful error handling for the DiceLoader component.
 * If an error occurs, shows fallback UI instead of crashing the app.
 *
 * @example
 * ```tsx
 * <DiceLoaderErrorBoundary>
 *   <DiceLoader isVisible={isLoading} text="Loading..." />
 * </DiceLoaderErrorBoundary>
 * ```
 */
export class DiceLoaderErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to error tracking service (e.g., Sentry) in production
    // Error is silently handled to prevent app crashes
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback: invisible div (silent failure)
      // This ensures the app doesn't crash if loading indicator fails
      return (
        <div
          role='alert'
          aria-live='assertive'
          className='sr-only'
          aria-label='Loading indicator encountered an error'
        >
          Loading...
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Safe DiceLoader wrapper with automatic error boundary
 *
 * @example
 * ```tsx
 * import { SafeDiceLoader } from '@/components/ui';
 *
 * <SafeDiceLoader isVisible={isLoading} text="Loading..." />
 * ```
 */
export function SafeDiceLoader(
  props: React.ComponentProps<typeof import('./DiceLoader').default>
): JSX.Element {
  const DiceLoader = require('./DiceLoader').default;

  return (
    <DiceLoaderErrorBoundary>
      <DiceLoader {...props} />
    </DiceLoaderErrorBoundary>
  );
}
