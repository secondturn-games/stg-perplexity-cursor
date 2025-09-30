/**
 * Protected Route Component
 * Wrapper for pages that require authentication
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DiceLoader from '@/components/ui/DiceLoader';

interface ProtectedRouteProps {
  /**
   * Child components to render when authenticated
   */
  children: React.ReactNode;

  /**
   * Redirect path if not authenticated
   * @default '/auth/signin'
   */
  redirectTo?: string;

  /**
   * Loading text to display
   * @default 'Verifying authentication...'
   */
  loadingText?: string;

  /**
   * Require email verification
   * @default false
   */
  requireEmailVerification?: boolean;
}

/**
 * ProtectedRoute - Wrapper for authenticated pages
 *
 * Displays loading state while checking authentication,
 * redirects to sign-in if not authenticated
 */
export default function ProtectedRoute({
  children,
  redirectTo = '/auth/signin',
  loadingText = 'Verifying authentication...',
  requireEmailVerification = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) {
      return;
    }

    // Not authenticated
    if (!user) {
      const currentPath = window.location.pathname;
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check email verification if required
    if (requireEmailVerification && !user.email_confirmed_at) {
      router.push('/auth/verify-email');
      return;
    }

    // Authenticated - show content
    setIsChecking(false);
  }, [user, loading, router, redirectTo, requireEmailVerification]);

  // Show loading while checking authentication
  if (loading || isChecking) {
    return <DiceLoader isVisible={true} text={loadingText} variant='bounce' />;
  }

  // Not authenticated (will redirect)
  if (!user) {
    return (
      <DiceLoader
        isVisible={true}
        text='Redirecting to sign in...'
        variant='spin'
      />
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}
