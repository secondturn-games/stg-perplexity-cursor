/**
 * Suspense Wrapper Component
 * Wrapper for React Suspense boundaries with DiceLoader fallback
 */

'use client';

import { Suspense } from 'react';
import DiceLoader from '@/components/ui/DiceLoader';

interface SuspenseWrapperProps {
  /**
   * Child components to wrap in Suspense
   */
  children: React.ReactNode;

  /**
   * Loading text to display
   * @default 'Loading...'
   */
  loadingText?: string;

  /**
   * Animation variant
   * @default 'roll'
   */
  variant?: 'roll' | 'bounce' | 'spin';
}

/**
 * SuspenseWrapper - Wraps children in Suspense with DiceLoader fallback
 *
 * @example
 * ```tsx
 * <SuspenseWrapper loadingText="Loading games...">
 *   <GamesList />
 * </SuspenseWrapper>
 * ```
 */
export default function SuspenseWrapper({
  children,
  loadingText = 'Loading...',
  variant = 'roll',
}: SuspenseWrapperProps) {
  return (
    <Suspense
      fallback={
        <DiceLoader isVisible={true} text={loadingText} variant={variant} />
      }
    >
      {children}
    </Suspense>
  );
}
