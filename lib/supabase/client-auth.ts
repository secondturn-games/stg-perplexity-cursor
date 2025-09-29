import { createClientComponentClient } from '@/lib/supabase';
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
 * Client-side authentication utilities for Next.js App Router
 * These functions can be used in Client Components
 */

/**
 * Create client-side Supabase client
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
    ...(metadata && {
      options: {
        data: metadata,
      },
    }),
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
    const { error: profileError } = await supabase.from('profiles').insert({
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
    } as never);

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
      redirectTo:
        redirectTo || `${process.env['NEXT_PUBLIC_APP_URL']}/auth/callback`,
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
    redirectTo: `${process.env['NEXT_PUBLIC_APP_URL']}/auth/reset-password`,
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
    .insert(profile as never)
    .select()
    .single();

  return { data, error };
}

/**
 * Update user profile (client-side)
 */
export async function updateProfile(updates: ProfileUpdate) {
  const supabase = createClientClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: { message: 'No user logged in' } };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates as never)
    .eq('id', user.id)
    .select()
    .single();

  return { data, error };
}

/**
 * Update password with current password verification (client-side)
 */
export async function updatePasswordWithVerification(
  currentPassword: string,
  newPassword: string
) {
  const supabase = createClientClient();

  // First verify current password
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
