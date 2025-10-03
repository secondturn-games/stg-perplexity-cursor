import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  gdprConsent: boolean;
}

/**
 * Client-side authentication utilities
 * These functions are safe to use in client components
 */

/**
 * Create Supabase client for client-side use
 */
export function createClientClient() {
  return createBrowserClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );
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
    ...(metadata && { options: { data: metadata } }),
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
        full_name: data.fullName,
        gdpr_consent: data.gdprConsent,
      },
    },
  });

  if (error) {
    return { data: null, error };
  }

  // Note: Profile will be created after email verification
  // We'll handle this in the auth callback or with a database trigger

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
    redirectTo: `${process.env['NEXT_PUBLIC_APP_URL']}/auth/update-password`,
  });

  return { data, error };
}

/**
 * Update password (client-side)
 */
export async function updatePassword(
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
 * Create or update user profile (client-side)
 * This function handles both creating new profiles and updating existing ones
 */
export async function createOrUpdateProfile(profileData: {
  username: string;
  full_name: string;
  bio?: string | null;
  location?: 'EST' | 'LVA' | 'LTU' | 'EU' | 'OTHER' | null;
  phone?: string | null;
  privacy_settings?: {
    show_email?: boolean;
    show_phone?: boolean;
    show_location?: boolean;
  };
  notification_settings?: {
    messages?: boolean;
    offers?: boolean;
    listings?: boolean;
    marketing?: boolean;
  };
}) {
  const supabase = createClientClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('❌ Profile creation failed: No user logged in');
    return { data: null, error: { message: 'No user logged in' } };
  }

  console.log('🔄 Creating/updating profile for user:', user.id);

  // Try to update existing profile first
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ Error checking existing profile:', checkError);
    return { data: null, error: checkError };
  }

  if (existingProfile) {
    console.log('📝 Updating existing profile');
    // Update existing profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username: profileData.username,
        full_name: profileData.full_name,
        bio: profileData.bio || null,
        location: profileData.location || null,
        phone: profileData.phone || null,
        privacy_settings: profileData.privacy_settings || {},
        notification_settings: profileData.notification_settings || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Profile update failed:', error);
    } else {
      console.log('✅ Profile updated successfully');
    }

    return { data, error };
  } else {
    console.log('🆕 Creating new profile');
    // Create new profile
    const profileInsertData = {
      id: user.id,
      username: profileData.username,
      full_name: profileData.full_name,
      bio: profileData.bio || null,
      location: profileData.location || null,
      phone: profileData.phone || null,
      privacy_settings: profileData.privacy_settings || {
        show_email: false,
        show_phone: false,
        show_location: true,
      },
      notification_settings: profileData.notification_settings || {
        messages: true,
        offers: true,
        listings: true,
        marketing: false,
      },
      email_verified: user.email_confirmed_at ? true : false,
      phone_verified: false,
      is_verified: false,
      reputation_score: 0,
      last_active_at: new Date().toISOString(),
    };

    console.log('📤 Profile data to insert:', profileInsertData);

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileInsertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Profile creation failed:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {
      console.log('✅ Profile created successfully:', data);
    }

    return { data, error };
  }
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
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  return { data, error };
}
