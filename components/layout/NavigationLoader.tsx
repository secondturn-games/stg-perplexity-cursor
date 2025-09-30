/**
 * Navigation Loader Component
 * Handles loading states during client-side navigation
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import DiceLoader from '@/components/ui/DiceLoader';

/**
 * NavigationLoader - Shows loading indicator during route transitions
 *
 * This component monitors route changes and displays a loading indicator
 * during client-side navigation transitions
 */
export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  useEffect(() => {
    // Determine loading text based on route
    const getLoadingText = (path: string): string => {
      if (path.startsWith('/marketplace')) {
        if (path.includes('/listings/new')) {
          return 'Preparing listing form...';
        }
        if (path.includes('/listings/')) {
          return 'Loading listing...';
        }
        return 'Loading marketplace...';
      }

      if (path.startsWith('/profile')) {
        return 'Loading profile...';
      }

      if (path.startsWith('/dashboard')) {
        return 'Loading dashboard...';
      }

      if (path.startsWith('/auth')) {
        if (path.includes('signin')) {
          return 'Loading sign in...';
        }
        if (path.includes('signup')) {
          return 'Loading sign up...';
        }
        return 'Loading...';
      }

      if (path.startsWith('/messages')) {
        return 'Loading messages...';
      }

      if (path.startsWith('/cart')) {
        return 'Loading cart...';
      }

      return 'Loading...';
    };

    setLoadingText(getLoadingText(pathname));

    // Hide loading on route change completion
    setIsLoading(false);
  }, [pathname, searchParams]);

  return <DiceLoader isVisible={isLoading} text={loadingText} variant='roll' />;
}
