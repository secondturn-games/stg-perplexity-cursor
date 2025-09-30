/**
 * Supabase API Operations with Loading State Integration
 * Wrapper functions for Supabase operations that integrate with useLoading hook
 *
 * @module lib/supabase/api-with-loading
 */

import type { UseLoadingReturn } from '@/hooks/useLoading';
import type { Database } from '@/types/database.types';
import { createClientClient } from './auth-client';
import * as authClient from './auth-client';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Options for Supabase operations with loading
 */
export interface SupabaseLoadingOptions {
  /**
   * Whether to show loading animation
   * @default true
   */
  showLoading?: boolean;

  /**
   * Delay before showing loading animation (in milliseconds)
   * @default 300
   */
  loadingDelay?: number;

  /**
   * Timeout for the operation (in milliseconds)
   * @default 30000
   */
  timeout?: number;

  /**
   * Custom error handler
   */
  onError?: (error: Error) => void;
}

/**
 * Execute a Supabase operation with loading state
 *
 * @param operation - The async operation to execute
 * @param loadingHook - The useLoading hook instance
 * @param options - Loading configuration options
 * @returns Promise resolving to the operation result
 */
async function withLoadingState<T>(
  operation: () => Promise<T>,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options: SupabaseLoadingOptions = {}
): Promise<T> {
  const {
    showLoading = true,
    loadingDelay = 300,
    timeout = 30000,
    onError,
  } = options;

  if (!showLoading || !loadingHook?.withLoading) {
    return operation();
  }

  // Implement loading delay to prevent flashing for quick operations
  let showLoadingTimeout: NodeJS.Timeout | null = null;
  let shouldShowLoading = false;

  const delayPromise = new Promise<void>(resolve => {
    showLoadingTimeout = setTimeout(() => {
      shouldShowLoading = true;
      resolve();
    }, loadingDelay);
  });

  try {
    const result = await operation();

    // Clear the timeout if operation completes quickly
    if (showLoadingTimeout) {
      clearTimeout(showLoadingTimeout);
    }

    // If operation completed before delay, return immediately
    if (!shouldShowLoading) {
      return result;
    }

    // Otherwise, show loading state
    return result;
  } catch (error) {
    if (showLoadingTimeout) {
      clearTimeout(showLoadingTimeout);
    }

    const errorObj = error instanceof Error ? error : new Error(String(error));

    if (onError) {
      onError(errorObj);
    }

    throw errorObj;
  }
}

/**
 * Sign in with email and password (with loading state)
 */
export async function signInWithEmailLoading(
  email: string,
  password: string,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options?: SupabaseLoadingOptions
) {
  return withLoadingState(
    () => authClient.signInWithEmail(email, password),
    loadingHook,
    options
  );
}

/**
 * Sign up with profile (with loading state)
 */
export async function signUpWithProfileLoading(
  data: {
    email: string;
    password: string;
    fullName: string;
    gdprConsent: boolean;
  },
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options?: SupabaseLoadingOptions
) {
  return withLoadingState(
    () => authClient.signUpWithProfile(data),
    loadingHook,
    options
  );
}

/**
 * Sign in with Google (with loading state)
 */
export async function signInWithGoogleLoading(
  redirectTo?: string,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options?: SupabaseLoadingOptions
) {
  return withLoadingState(
    () => authClient.signInWithGoogle(redirectTo),
    loadingHook,
    options
  );
}

/**
 * Sign out (with loading state)
 */
export async function signOutLoading(
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options?: SupabaseLoadingOptions
) {
  return withLoadingState(() => authClient.signOut(), loadingHook, options);
}

/**
 * Reset password (with loading state)
 */
export async function resetPasswordLoading(
  email: string,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options?: SupabaseLoadingOptions
) {
  return withLoadingState(
    () => authClient.resetPassword(email),
    loadingHook,
    options
  );
}

/**
 * Update password (with loading state)
 */
export async function updatePasswordLoading(
  currentPassword: string,
  newPassword: string,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options?: SupabaseLoadingOptions
) {
  return withLoadingState(
    () => authClient.updatePassword(currentPassword, newPassword),
    loadingHook,
    options
  );
}

/**
 * Get profile (with loading state)
 */
export async function getProfileLoading(
  userId: string,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options?: SupabaseLoadingOptions
) {
  return withLoadingState(
    () => authClient.getProfile(userId),
    loadingHook,
    options
  );
}

/**
 * Create or update profile (with loading state)
 */
export async function createOrUpdateProfileLoading(
  profileData: Parameters<typeof authClient.createOrUpdateProfile>[0],
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options?: SupabaseLoadingOptions
) {
  return withLoadingState(
    () => authClient.createOrUpdateProfile(profileData),
    loadingHook,
    options
  );
}

/**
 * Update profile (with loading state)
 */
export async function updateProfileLoading(
  updates: ProfileUpdate,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options?: SupabaseLoadingOptions
) {
  return withLoadingState(
    () => authClient.updateProfile(updates),
    loadingHook,
    options
  );
}

/**
 * Generic Supabase query wrapper with loading state
 *
 * @example
 * ```tsx
 * const { withLoading } = useLoading();
 * const supabase = createClientClient();
 *
 * const { data, error } = await withSupabaseLoading(
 *   async () => {
 *     return supabase
 *       .from('games')
 *       .select('*')
 *       .limit(10);
 *   },
 *   { withLoading }
 * );
 * ```
 */
export async function withSupabaseLoading<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options?: SupabaseLoadingOptions
) {
  return withLoadingState(queryFn, loadingHook, options);
}
