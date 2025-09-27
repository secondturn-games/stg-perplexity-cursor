import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Supabase client configuration
 * This file provides both client-side and server-side Supabase configurations
 * for the Next.js App Router with proper TypeScript support.
 */

// Database types (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          location: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          bgg_id: number | null;
          title: string;
          description: string | null;
          min_players: number | null;
          max_players: number | null;
          min_age: number | null;
          playing_time: number | null;
          year_published: number | null;
          designer: string[] | null;
          artist: string[] | null;
          publisher: string[] | null;
          categories: string[] | null;
          mechanisms: string[] | null;
          image_url: string | null;
          thumbnail_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bgg_id?: number | null;
          title: string;
          description?: string | null;
          min_players?: number | null;
          max_players?: number | null;
          min_age?: number | null;
          playing_time?: number | null;
          year_published?: number | null;
          designer?: string[] | null;
          artist?: string[] | null;
          publisher?: string[] | null;
          categories?: string[] | null;
          mechanisms?: string[] | null;
          image_url?: string | null;
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bgg_id?: number | null;
          title?: string;
          description?: string | null;
          min_players?: number | null;
          max_players?: number | null;
          min_age?: number | null;
          playing_time?: number | null;
          year_published?: number | null;
          designer?: string[] | null;
          artist?: string[] | null;
          publisher?: string[] | null;
          categories?: string[] | null;
          mechanisms?: string[] | null;
          image_url?: string | null;
          thumbnail_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          title: string;
          description: string;
          price: number;
          condition:
            | 'new'
            | 'like_new'
            | 'very_good'
            | 'good'
            | 'fair'
            | 'poor';
          status: 'active' | 'pending' | 'sold' | 'expired' | 'cancelled';
          location: string;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          title: string;
          description: string;
          price: number;
          condition:
            | 'new'
            | 'like_new'
            | 'very_good'
            | 'good'
            | 'fair'
            | 'poor';
          status?: 'active' | 'pending' | 'sold' | 'expired' | 'cancelled';
          location: string;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          title?: string;
          description?: string;
          price?: number;
          condition?:
            | 'new'
            | 'like_new'
            | 'very_good'
            | 'good'
            | 'fair'
            | 'poor';
          status?: 'active' | 'pending' | 'sold' | 'expired' | 'cancelled';
          location?: string;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
        };
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          url: string;
          alt_text?: string | null;
          sort_order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          url?: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          listing_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'system';
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'system';
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'system';
          read_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      game_condition:
        | 'new'
        | 'like_new'
        | 'very_good'
        | 'good'
        | 'fair'
        | 'poor';
      listing_status: 'active' | 'pending' | 'sold' | 'expired' | 'cancelled';
      message_type: 'text' | 'image' | 'system';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/**
 * Create a Supabase client for client-side usage
 * This client is used in browser environments and React components
 */
export function createClientComponentClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'second-turn-games',
        },
      },
    }
  );
}

/**
 * Create a Supabase client for server-side usage
 * This client bypasses RLS and uses the service role key
 */
export function createServerComponentClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'second-turn-games-server',
        },
      },
    }
  );
}

/**
 * Create a Supabase client for middleware usage
 * This client is optimized for middleware functions
 */
export function createMiddlewareClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

/**
 * Storage configuration
 */
export const STORAGE_BUCKETS = {
  LISTING_IMAGES: 'listing-images',
  PROFILE_AVATARS: 'profile-avatars',
  GAME_IMAGES: 'game-images',
} as const;

/**
 * Storage helper functions
 */
export const storage = {
  /**
   * Get public URL for a storage object
   */
  getPublicUrl: (bucket: string, path: string) => {
    const supabase = createClientComponentClient();
    return supabase.storage.from(bucket).getPublicUrl(path);
  },

  /**
   * Upload file to storage bucket
   */
  uploadFile: async (
    bucket: string,
    path: string,
    file: File,
    options?: {
      cacheControl?: string;
      upsert?: boolean;
    }
  ) => {
    const supabase = createClientComponentClient();
    return supabase.storage.from(bucket).upload(path, file, options);
  },

  /**
   * Delete file from storage bucket
   */
  deleteFile: async (bucket: string, path: string) => {
    const supabase = createClientComponentClient();
    return supabase.storage.from(bucket).remove([path]);
  },

  /**
   * List files in storage bucket
   */
  listFiles: async (bucket: string, path?: string) => {
    const supabase = createClientComponentClient();
    return supabase.storage.from(bucket).list(path);
  },
};

/**
 * Database helper functions
 */
export const db = {
  /**
   * Get user profile
   */
  getProfile: async (userId: string) => {
    const supabase = createServerComponentClient();
    return supabase.from('profiles').select('*').eq('user_id', userId).single();
  },

  /**
   * Create user profile
   */
  createProfile: async (
    profile: Database['public']['Tables']['profiles']['Insert']
  ) => {
    const supabase = createServerComponentClient();
    return supabase.from('profiles').insert(profile);
  },

  /**
   * Update user profile
   */
  updateProfile: async (
    userId: string,
    updates: Database['public']['Tables']['profiles']['Update']
  ) => {
    const supabase = createServerComponentClient();
    return supabase.from('profiles').update(updates).eq('user_id', userId);
  },

  /**
   * Get game by ID or BGG ID
   */
  getGame: async (id: string | number) => {
    const supabase = createServerComponentClient();
    const query =
      typeof id === 'number'
        ? supabase.from('games').select('*').eq('bgg_id', id)
        : supabase.from('games').select('*').eq('id', id);

    return query.single();
  },

  /**
   * Search games
   */
  searchGames: async (query: string, limit = 20) => {
    const supabase = createServerComponentClient();
    return supabase
      .from('games')
      .select('*')
      .textSearch('title', query)
      .limit(limit);
  },

  /**
   * Get listings with filters
   */
  getListings: async (filters?: {
    gameId?: string;
    userId?: string;
    status?: Database['public']['Enums']['listing_status'];
    limit?: number;
    offset?: number;
  }) => {
    const supabase = createServerComponentClient();
    let query = supabase.from('listings').select(`
        *,
        games(*),
        profiles!listings_user_id_fkey(*)
      `);

    if (filters?.gameId) {
      query = query.eq('game_id', filters.gameId);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 20);

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 20) - 1
      );
    }

    return query;
  },

  /**
   * Create new listing
   */
  createListing: async (
    listing: Database['public']['Tables']['listings']['Insert']
  ) => {
    const supabase = createServerComponentClient();
    return supabase.from('listings').insert(listing);
  },
};

/**
 * Authentication helper functions
 */
export const auth = {
  /**
   * Get current user (client-side)
   */
  getCurrentUser: async () => {
    const supabase = createClientComponentClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const supabase = createClientComponentClient();
    return supabase.auth.signInWithPassword({ email, password });
  },

  /**
   * Sign up with email and password
   */
  signUp: async (
    email: string,
    password: string,
    options?: {
      data?: Record<string, any>;
    }
  ) => {
    const supabase = createClientComponentClient();
    return supabase.auth.signUp({
      email,
      password,
      options,
    });
  },

  /**
   * Sign out
   */
  signOut: async () => {
    const supabase = createClientComponentClient();
    return supabase.auth.signOut();
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string) => {
    const supabase = createClientComponentClient();
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });
  },

  /**
   * Update password
   */
  updatePassword: async (password: string) => {
    const supabase = createClientComponentClient();
    return supabase.auth.updateUser({ password });
  },
};

/**
 * Real-time subscriptions
 */
export const realtime = {
  /**
   * Subscribe to listing updates
   */
  subscribeToListings: (callback: (payload: any) => void) => {
    const supabase = createClientComponentClient();
    return supabase
      .channel('listings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
        },
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe to conversation messages
   */
  subscribeToMessages: (
    conversationId: string,
    callback: (payload: any) => void
  ) => {
    const supabase = createClientComponentClient();
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback
      )
      .subscribe();
  },
};

// Export the main client for convenience
export const supabase = createClientComponentClient();
