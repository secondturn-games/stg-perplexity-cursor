/**
 * Page Loader Component
 * Reusable page-level loading component with route-aware messages
 */

'use client';

import { usePathname } from 'next/navigation';
import DiceLoader from '@/components/ui/DiceLoader';

interface PageLoaderProps {
  /**
   * Custom loading text (overrides route-based text)
   */
  text?: string;

  /**
   * Animation variant
   * @default 'roll'
   */
  variant?: 'roll' | 'bounce' | 'spin';

  /**
   * Whether the loader is visible
   * @default true
   */
  isVisible?: boolean;
}

/**
 * Get loading text based on current route
 */
function getRouteLoadingText(pathname: string): string {
  // Marketplace routes
  if (pathname.startsWith('/marketplace')) {
    if (pathname.includes('/listings/new')) {
      return 'Preparing listing form...';
    }
    if (pathname.includes('/listings/') && pathname.includes('/edit')) {
      return 'Loading listing editor...';
    }
    if (pathname.includes('/listings/')) {
      return 'Loading listing details...';
    }
    if (pathname === '/marketplace') {
      return 'Loading marketplace...';
    }
    return 'Loading...';
  }

  // Profile routes
  if (pathname.startsWith('/profile')) {
    if (pathname.includes('/edit')) {
      return 'Loading profile editor...';
    }
    if (pathname.includes('/settings')) {
      return 'Loading settings...';
    }
    return 'Loading profile...';
  }

  // Dashboard
  if (pathname.startsWith('/dashboard')) {
    return 'Loading dashboard...';
  }

  // Authentication routes
  if (pathname.startsWith('/auth')) {
    if (pathname.includes('/signin')) {
      return 'Loading sign in...';
    }
    if (pathname.includes('/signup')) {
      return 'Loading sign up...';
    }
    if (pathname.includes('/reset-password')) {
      return 'Loading password reset...';
    }
    if (pathname.includes('/verify-email')) {
      return 'Verifying email...';
    }
    return 'Loading authentication...';
  }

  // Messages
  if (pathname.startsWith('/messages')) {
    return 'Loading messages...';
  }

  // Cart
  if (pathname.startsWith('/cart')) {
    return 'Loading cart...';
  }

  // Orders
  if (pathname.startsWith('/orders')) {
    return 'Loading orders...';
  }

  // Default
  return 'Loading page...';
}

/**
 * PageLoader - Route-aware page loading component
 *
 * Automatically determines appropriate loading text based on the current route,
 * or accepts custom text via props.
 *
 * @example
 * ```tsx
 * // Automatic route-based text
 * <PageLoader />
 *
 * // Custom text
 * <PageLoader text="Loading game data..." variant="bounce" />
 * ```
 */
export default function PageLoader({
  text,
  variant = 'roll',
  isVisible = true,
}: PageLoaderProps) {
  const pathname = usePathname();
  const loadingText = text || getRouteLoadingText(pathname);

  return (
    <DiceLoader isVisible={isVisible} text={loadingText} variant={variant} />
  );
}
