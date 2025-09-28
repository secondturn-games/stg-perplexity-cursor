import {
  createClientComponentClient,
  createServerComponentClient,
} from '@/lib/supabase';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface SignUpData {
  email: string;
  password: string;
  username: string;
  fullName: string;
  gdprConsent: boolean;
  marketingConsent?: boolean;
}

/**
 * Authentication utilities for Next.js App Router
 * Provides server and client-side auth helpers
 */

/**
 * Server-side auth helpers
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createServerComponentClient({
    cookies: () => cookieStore,
  });
}

/**
 * Get current user on the server
 */
export async function getCurrentUser() {
  const supabase = await createServerClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting user:', error);
      }
      return { user: null, error };
    }

    return { user, error: null };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Unexpected error getting user:', error);
    }
    return { user: null, error };
  }
}

/**
 * Get user session on the server
 */
export async function getSession() {
  const supabase = await createServerClient();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting session:', error);
      }
      return { session: null, error };
    }

    return { session, error: null };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Unexpected error getting session:', error);
    }
    return { session: null, error };
  }
}

/**
 * Client-side auth helpers
 */
export function createClientClient() {
  return createClientComponentClient();
}

/**
 * Sign in with email and password (client-side)
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClientClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign up with email and password (client-side)
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: Record<string, any>
) {
  const supabase = createClientClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  return { data, error };
}

/**
 * Sign up with complete profile data (client-side)
 */
export async function signUpWithProfile(data: SignUpData) {
  const supabase = createClientClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        username: data.username,
        full_name: data.fullName,
        gdpr_consent: data.gdprConsent,
        marketing_consent: data.marketingConsent || false,
      },
    },
  });

  if (error) {
    return { data: null, error };
  }

  // Create profile if user was created
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: data.username,
        full_name: data.fullName,
        privacy_settings: {
          show_email: false,
          show_phone: false,
          show_location: true,
        },
        notification_settings: {
          messages: true,
          offers: true,
          listings: true,
          marketing: data.marketingConsent || false,
        },
      });

    if (profileError) {
      return { data: authData, error: profileError };
    }
  }

  return { data: authData, error: null };
}

/**
 * Sign in with Google (client-side)
 */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClientClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  return { data, error };
}

/**
 * Sign out (client-side)
 */
export async function signOut() {
  const supabase = createClientClient();

  const { error } = await supabase.auth.signOut();

  return { error };
}

/**
 * Reset password (client-side)
 */
export async function resetPassword(email: string) {
  const supabase = createClientClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  return { data, error };
}

/**
 * Update password (client-side)
 */
export async function updatePassword(password: string) {
  const supabase = createClientClient();

  const { data, error } = await supabase.auth.updateUser({
    password,
  });

  return { data, error };
}

/**
 * Update user metadata (client-side)
 */
export async function updateUserMetadata(metadata: Record<string, any>) {
  const supabase = createClientClient();

  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  return { data, error };
}

/**
 * Auth state management hook
 */
export function useAuth() {
  const supabase = createClientClient();

  return {
    signIn: signInWithEmail,
    signUp: signUpWithEmail,
    signOut,
    resetPassword,
    updatePassword,
    updateUserMetadata,
  };
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const { user } = await getCurrentUser();
  return !!user;
}

/**
 * Require authentication (server-side)
 * Throws an error if user is not authenticated
 */
export async function requireAuth() {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Get user profile (server-side)
 */
export async function getUserProfile(userId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { profile: data, error };
}

/**
 * Get user profile (client-side)
 */
export async function getProfile(userId: string) {
  const supabase = createClientClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
}

/**
 * Create user profile (client-side)
 */
export async function createProfile(profile: ProfileInsert) {
  const supabase = createClientClient();

  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  return { data, error };
}

/**
 * Update user profile (client-side)
 */
export async function updateProfile(updates: ProfileUpdate) {
  const supabase = createClientClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: { message: 'No user logged in' } };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  return { data, error };
}

/**
 * Update password (client-side)
 */
export async function updatePassword(currentPassword: string, newPassword: string) {
  const supabase = createClientClient();

  // First verify current password
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: { message: 'No user logged in' } };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { data: null, error: { message: 'Current password is incorrect' } };
  }

  // Update password
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

/**
 * Create user profile (server-side)
 */
export async function createUserProfile(profile: {
  user_id: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;
}) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  return { profile: data, error };
}

/**
 * Update user profile (server-side)
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    username: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    location: string;
    website: string;
  }>
) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  return { profile: data, error };
}
