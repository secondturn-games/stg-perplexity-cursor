'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { Profile } from '@/types/database.types';
import {
  getProfile,
  createProfile,
  createOrUpdateProfile,
  updateProfile as updateProfileClient,
} from '@/lib/supabase/auth-client';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    redirectTo?: string
  ) => Promise<{ error: any }>;
  signUp: (data: SignUpData, redirectTo?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ error: any }>;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  username: string;
  fullName: string;
  gdprConsent: boolean;
  marketingConsent?: boolean;
}

interface ProfileUpdateData {
  username?: string;
  full_name?: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://placeholder.supabase.co',
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'placeholder-key'
  );

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }

      // Only set loading to false after profile loading is complete
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await getProfile(userId);
      if (error) {
        // If profile doesn't exist (PGRST116), that's expected for new users
        if (error.code === 'PGRST116') {
          console.log('Profile not found - user needs to complete onboarding');
          setProfile(null);
          return;
        }
        console.error('Error loading profile:', error);
        setProfile(null);
        return;
      }

      // Check if profile is complete (has username and full_name)
      if (data && (!data.username || !data.full_name)) {
        console.log('Profile incomplete - user needs to complete onboarding');
        setProfile(null);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    }
  };

  const signIn = async (
    email: string,
    password: string,
    redirectTo?: string
  ) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    // Redirect if specified
    if (redirectTo) {
      window.location.href = redirectTo;
    }

    return { error: null };
  };

  const signUp = async (data: SignUpData, redirectTo?: string) => {
    const { error } = await supabase.auth.signUp({
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
      return { error };
    }

    // Redirect if specified
    if (redirectTo) {
      window.location.href = redirectTo;
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (data: ProfileUpdateData) => {
    if (!user) {
      return { error: { message: 'No user logged in' } };
    }

    // Use createOrUpdateProfile to handle both creation and updates
    const { error } = await createOrUpdateProfile({
      username: data.username || '',
      full_name: data.full_name || '',
      bio: data.bio || null,
      location: data.location || null,
      phone: data.phone || null,
      privacy_settings: data.privacy_settings || {},
      notification_settings: data.notification_settings || {},
    });

    if (error) {
      return { error };
    }

    // Refresh profile data
    await loadProfile(user.id);
    return { error: null };
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!user) {
      return { error: { message: 'No user logged in' } };
    }

    // First verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return { error: { message: 'Current password is incorrect' } };
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
