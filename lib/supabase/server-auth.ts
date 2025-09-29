import { createServerComponentClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Server-side authentication utilities for Next.js App Router
 * These functions can only be used in Server Components or API routes
 */

/**
 * Create server-side Supabase client
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createServerComponentClient();
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
    .insert(profile as never)
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
    } as never)
    .eq('user_id', userId)
    .select()
    .single();

  return { profile: data, error };
}
