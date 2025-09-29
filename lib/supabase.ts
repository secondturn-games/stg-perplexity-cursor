import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '@/types/database.types';

/**
 * Supabase client configuration
 * This file provides both client-side and server-side Supabase configurations
 * for the Next.js App Router with proper TypeScript support.
 */

/**
 * Create a Supabase client for client-side usage
 * This client is used in browser environments and React components
 */
export const createClientClient = () => {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

/**
 * Create a Supabase client for server-side usage
 * This client is used in API routes and server components
 */
export const createServerComponentClient = () => {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

/**
 * Database helper functions
 * These functions provide a clean interface for common database operations
 */
export const db = {
  /**
   * Get user profile
   */
  getProfile: async (userId: string) => {
    const supabase = createServerComponentClient();
    return supabase.from('profiles').select('*').eq('id', userId).single();
  },

  /**
   * Create user profile
   */
  createProfile: async (
    profile: Database['public']['Tables']['profiles']['Insert']
  ) => {
    const supabase = createServerComponentClient();
    return supabase.from('profiles').insert([profile]);
  },

  /**
   * Update user profile
   */
  updateProfile: async (
    userId: string,
    updates: Database['public']['Tables']['profiles']['Update']
  ) => {
    const supabase = createServerComponentClient();
    return supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
  },

  /**
   * Get game by ID
   */
  getGame: async (gameId: string) => {
    const supabase = createServerComponentClient();
    return supabase.from('games').select('*').eq('id', gameId).single();
  },

  /**
   * Get games by BGG ID
   */
  getGameByBggId: async (bggId: number) => {
    const supabase = createServerComponentClient();
    return supabase.from('games').select('*').eq('bgg_id', bggId).single();
  },

  /**
   * Search games
   */
  searchGames: async (query: string, limit = 20) => {
    const supabase = createServerComponentClient();
    return supabase
      .from('games')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);
  },

  /**
   * Get listings
   */
  getListings: async (filters?: {
    gameId?: string;
    sellerId?: string;
    isActive?: boolean;
    limit?: number;
  }) => {
    const supabase = createServerComponentClient();
    let query = supabase.from('listings').select('*');

    if (filters?.gameId) {
      query = query.eq('game_id', filters.gameId);
    }
    if (filters?.sellerId) {
      query = query.eq('seller_id', filters.sellerId);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return query.order('created_at', { ascending: false });
  },

  /**
   * Create listing
   */
  createListing: async (
    listing: Database['public']['Tables']['listings']['Insert']
  ) => {
    const supabase = createServerComponentClient();
    return supabase.from('listings').insert([listing]).select().single();
  },

  /**
   * Update listing
   */
  updateListing: async (
    listingId: string,
    updates: Database['public']['Tables']['listings']['Update']
  ) => {
    const supabase = createServerComponentClient();
    return supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId)
      .select()
      .single();
  },

  /**
   * Get conversations for a user
   */
  getConversations: async (userId: string) => {
    const supabase = createServerComponentClient();
    return supabase
      .from('conversations')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });
  },

  /**
   * Get messages for a conversation
   */
  getMessages: async (conversationId: string) => {
    const supabase = createServerComponentClient();
    return supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
  },

  /**
   * Create message
   */
  createMessage: async (
    message: Database['public']['Tables']['messages']['Insert']
  ) => {
    const supabase = createServerComponentClient();
    return supabase.from('messages').insert([message]).select().single();
  },

  /**
   * Get user ratings
   */
  getUserRatings: async (userId: string) => {
    const supabase = createServerComponentClient();
    return supabase
      .from('user_ratings')
      .select('*')
      .eq('rated_user_id', userId);
  },

  /**
   * Create user rating
   */
  createUserRating: async (
    rating: Database['public']['Tables']['user_ratings']['Insert']
  ) => {
    const supabase = createServerComponentClient();
    return supabase.from('user_ratings').insert([rating]).select().single();
  },

  /**
   * Get user wishlist
   */
  getWishlist: async (userId: string) => {
    const supabase = createServerComponentClient();
    return supabase.from('wishlists').select('*').eq('user_id', userId);
  },

  /**
   * Add to wishlist
   */
  addToWishlist: async (
    wishlistItem: Database['public']['Tables']['wishlists']['Insert']
  ) => {
    const supabase = createServerComponentClient();
    return supabase.from('wishlists').insert([wishlistItem]).select().single();
  },

  /**
   * Remove from wishlist
   */
  removeFromWishlist: async (userId: string, gameId: string) => {
    const supabase = createServerComponentClient();
    return supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('game_id', gameId);
  },

  /**
   * Get payments for a user
   */
  getPayments: async (userId: string) => {
    const supabase = createServerComponentClient();
    return supabase.from('payments').select('*').eq('user_id', userId);
  },

  /**
   * Create payment
   */
  createPayment: async (
    payment: Database['public']['Tables']['payments']['Insert']
  ) => {
    const supabase = createServerComponentClient();
    return supabase.from('payments').insert([payment]).select().single();
  },

  /**
   * Update payment
   */
  updatePayment: async (
    paymentId: string,
    updates: Database['public']['Tables']['payments']['Update']
  ) => {
    const supabase = createServerComponentClient();
    return supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single();
  },
};

/**
 * Storage helper functions
 * These functions provide a clean interface for file storage operations
 */
export const storageUtils = {
  /**
   * Upload file to storage
   */
  uploadFile: async (bucket: string, path: string, file: File) => {
    const supabase = createClientClient();
    return supabase.storage.from(bucket).upload(path, file);
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl: (bucket: string, path: string) => {
    const supabase = createClientClient();
    return supabase.storage.from(bucket).getPublicUrl(path);
  },

  /**
   * Delete file from storage
   */
  deleteFile: async (bucket: string, path: string) => {
    const supabase = createClientClient();
    return supabase.storage.from(bucket).remove([path]);
  },

  /**
   * List files in a bucket
   */
  listFiles: async (bucket: string, path?: string) => {
    const supabase = createClientClient();
    return supabase.storage.from(bucket).list(path);
  },
};

/**
 * Real-time helper functions
 * These functions provide a clean interface for real-time subscriptions
 */
export const realtime = {
  /**
   * Subscribe to messages in a conversation
   */
  subscribeToMessages: (
    conversationId: string,
    callback: (message: any) => void
  ) => {
    const supabase = createClientClient();
    return supabase
      .channel(`conversation:${conversationId}`)
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

  /**
   * Subscribe to listing updates
   */
  subscribeToListing: (listingId: string, callback: (listing: any) => void) => {
    const supabase = createClientClient();
    return supabase
      .channel(`listing:${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listings',
          filter: `id=eq.${listingId}`,
        },
        callback
      )
      .subscribe();
  },
};
