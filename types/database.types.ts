/**
 * Database types for Supabase - Second Turn Games Marketplace
 * These types are generated from your Supabase database schema
 * and provide type safety for all database operations.
 *
 * To regenerate these types:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          email_verified: boolean;
          full_name: string | null;
          id: string;
          is_verified: boolean;
          last_active_at: string;
          location: Database['public']['Enums']['user_location'] | null;
          notification_settings: Json;
          phone: string | null;
          phone_verified: boolean;
          privacy_settings: Json;
          reputation_score: number;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          email_verified?: boolean;
          full_name?: string | null;
          id: string;
          is_verified?: boolean;
          last_active_at?: string;
          location?: Database['public']['Enums']['user_location'] | null;
          notification_settings?: Json;
          phone?: string | null;
          phone_verified?: boolean;
          privacy_settings?: Json;
          reputation_score?: number;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          email_verified?: boolean;
          full_name?: string | null;
          id?: string;
          is_verified?: boolean;
          last_active_at?: string;
          location?: Database['public']['Enums']['user_location'] | null;
          notification_settings?: Json;
          phone?: string | null;
          phone_verified?: boolean;
          privacy_settings?: Json;
          reputation_score?: number;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          age_rating: number | null;
          alternate_names: Json;
          artists: string[];
          bgg_id: number | null;
          bgg_rank: number | null;
          bgg_rating: number | null;
          categories: string[];
          complexity_rating: number | null;
          created_at: string;
          description: string | null;
          designers: string[];
          editions: Json;
          id: string;
          image_url: string | null;
          language_dependence: Json | null;
          last_bgg_sync: string | null;
          max_players: number | null;
          mechanics: string[];
          min_players: number | null;
          playing_time: number | null;
          publishers: string[];
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
          weight_rating: number | null;
          year_published: number | null;
        };
        Insert: {
          age_rating?: number | null;
          alternate_names?: Json;
          artists?: string[];
          bgg_id?: number | null;
          bgg_rank?: number | null;
          bgg_rating?: number | null;
          categories?: string[];
          complexity_rating?: number | null;
          created_at?: string;
          description?: string | null;
          designers?: string[];
          editions?: Json;
          id?: string;
          image_url?: string | null;
          language_dependence?: Json | null;
          last_bgg_sync?: string | null;
          max_players?: number | null;
          mechanics?: string[];
          min_players?: number | null;
          playing_time?: number | null;
          publishers?: string[];
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
          weight_rating?: number | null;
          year_published?: number | null;
        };
        Update: {
          age_rating?: number | null;
          alternate_names?: Json;
          artists?: string[];
          bgg_id?: number | null;
          bgg_rank?: number | null;
          bgg_rating?: number | null;
          categories?: string[];
          complexity_rating?: number | null;
          created_at?: string;
          description?: string | null;
          designers?: string[];
          editions?: Json;
          id?: string;
          image_url?: string | null;
          language_dependence?: Json | null;
          last_bgg_sync?: string | null;
          max_players?: number | null;
          mechanics?: string[];
          min_players?: number | null;
          playing_time?: number | null;
          publishers?: string[];
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
          weight_rating?: number | null;
          year_published?: number | null;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          condition: Database['public']['Enums']['listing_condition'];
          created_at: string;
          currency: string;
          deleted_at: string | null;
          description: string | null;
          expires_at: string | null;
          game_id: string;
          id: string;
          images: string[];
          is_active: boolean;
          is_featured: boolean;
          location: string;
          message_count: number;
          price: number;
          seller_id: string;
          shipping_options: Json;
          sold_at: string | null;
          title: string;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          condition: Database['public']['Enums']['listing_condition'];
          created_at?: string;
          currency?: string;
          deleted_at?: string | null;
          description?: string | null;
          expires_at?: string | null;
          game_id: string;
          id?: string;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          location: string;
          message_count?: number;
          price: number;
          seller_id: string;
          shipping_options?: Json;
          sold_at?: string | null;
          title: string;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          condition?: Database['public']['Enums']['listing_condition'];
          created_at?: string;
          currency?: string;
          deleted_at?: string | null;
          description?: string | null;
          expires_at?: string | null;
          game_id?: string;
          id?: string;
          images?: string[];
          is_active?: boolean;
          is_featured?: boolean;
          location?: string;
          message_count?: number;
          price?: number;
          seller_id?: string;
          shipping_options?: Json;
          sold_at?: string | null;
          title?: string;
          updated_at?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'listings_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'listings_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          buyer_id: string;
          buyer_unread_count: number;
          created_at: string;
          id: string;
          is_archived_by_buyer: boolean;
          is_archived_by_seller: boolean;
          last_message_at: string;
          last_message_preview: string | null;
          listing_id: string;
          seller_id: string;
          seller_unread_count: number;
          updated_at: string;
        };
        Insert: {
          buyer_id: string;
          buyer_unread_count?: number;
          created_at?: string;
          id?: string;
          is_archived_by_buyer?: boolean;
          is_archived_by_seller?: boolean;
          last_message_at?: string;
          last_message_preview?: string | null;
          listing_id: string;
          seller_id: string;
          seller_unread_count?: number;
          updated_at?: string;
        };
        Update: {
          buyer_id?: string;
          buyer_unread_count?: number;
          created_at?: string;
          id?: string;
          is_archived_by_buyer?: boolean;
          is_archived_by_seller?: boolean;
          last_message_at?: string;
          last_message_preview?: string | null;
          listing_id?: string;
          seller_id?: string;
          seller_unread_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_buyer_id_fkey';
            columns: ['buyer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          edited_at: string | null;
          id: string;
          is_read: boolean;
          message_type: Database['public']['Enums']['message_type'];
          metadata: Json;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          is_read?: boolean;
          message_type?: Database['public']['Enums']['message_type'];
          metadata?: Json;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          is_read?: boolean;
          message_type?: Database['public']['Enums']['message_type'];
          metadata?: Json;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_ratings: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          is_verified_purchase: boolean;
          listing_id: string | null;
          rated_user_id: string;
          rater_user_id: string;
          rating: number;
          updated_at: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          is_verified_purchase?: boolean;
          listing_id?: string | null;
          rated_user_id: string;
          rater_user_id: string;
          rating: number;
          updated_at?: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          is_verified_purchase?: boolean;
          listing_id?: string | null;
          rated_user_id?: string;
          rater_user_id?: string;
          rating?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_ratings_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_ratings_rated_user_id_fkey';
            columns: ['rated_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_ratings_rater_user_id_fkey';
            columns: ['rater_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      wishlists: {
        Row: {
          condition_preference:
            | Database['public']['Enums']['listing_condition'][]
            | null;
          created_at: string;
          game_id: string;
          id: string;
          location_preference: string | null;
          max_price: number | null;
          notification_enabled: boolean;
          user_id: string;
        };
        Insert: {
          condition_preference?:
            | Database['public']['Enums']['listing_condition'][]
            | null;
          created_at?: string;
          game_id: string;
          id?: string;
          location_preference?: string | null;
          max_price?: number | null;
          notification_enabled?: boolean;
          user_id: string;
        };
        Update: {
          condition_preference?:
            | Database['public']['Enums']['listing_condition'][]
            | null;
          created_at?: string;
          game_id?: string;
          id?: string;
          location_preference?: string | null;
          max_price?: number | null;
          notification_enabled?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wishlists_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'wishlists_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          conversation_id: string | null;
          created_at: string;
          currency: string;
          id: string;
          listing_id: string | null;
          metadata: Json;
          payment_intent_id: string | null;
          processed_at: string | null;
          provider: Database['public']['Enums']['payment_provider'];
          status: Database['public']['Enums']['payment_status'];
          transaction_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          conversation_id?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          listing_id?: string | null;
          metadata?: Json;
          payment_intent_id?: string | null;
          processed_at?: string | null;
          provider: Database['public']['Enums']['payment_provider'];
          status?: Database['public']['Enums']['payment_status'];
          transaction_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          conversation_id?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          listing_id?: string | null;
          metadata?: Json;
          payment_intent_id?: string | null;
          processed_at?: string | null;
          provider?: Database['public']['Enums']['payment_provider'];
          status?: Database['public']['Enums']['payment_status'];
          transaction_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      jobs: {
        Row: {
          created_at: string;
          error: string | null;
          id: string;
          metadata: Json;
          payload: Json;
          priority: Database['public']['Enums']['job_priority'];
          result: Json | null;
          status: Database['public']['Enums']['job_status'];
          type: Database['public']['Enums']['job_type'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: string;
          metadata?: Json;
          payload: Json;
          priority?: Database['public']['Enums']['job_priority'];
          result?: Json | null;
          status?: Database['public']['Enums']['job_status'];
          type: Database['public']['Enums']['job_type'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: string;
          metadata?: Json;
          payload?: Json;
          priority?: Database['public']['Enums']['job_priority'];
          result?: Json | null;
          status?: Database['public']['Enums']['job_status'];
          type?: Database['public']['Enums']['job_type'];
          updated_at?: string;
        };
        Relationships: [];
      };
      job_history: {
        Row: {
          created_at: string;
          error: string | null;
          id: string;
          job_id: string;
          metadata: Json;
          payload: Json;
          priority: Database['public']['Enums']['job_priority'];
          result: Json | null;
          status: Database['public']['Enums']['job_status'];
          type: Database['public']['Enums']['job_type'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          id?: string;
          job_id: string;
          metadata?: Json;
          payload?: Json;
          priority?: Database['public']['Enums']['job_priority'];
          result?: Json | null;
          status?: Database['public']['Enums']['job_status'];
          type?: Database['public']['Enums']['job_type'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          id?: string;
          job_id?: string;
          metadata?: Json;
          payload?: Json;
          priority?: Database['public']['Enums']['job_priority'];
          result?: Json | null;
          status?: Database['public']['Enums']['job_status'];
          type?: Database['public']['Enums']['job_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'job_history_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_user_rate: {
        Args: {
          p_listing_id: string;
          p_rated_user_id: string;
          p_rater_user_id: string;
        };
        Returns: boolean;
      };
      export_user_data: {
        Args: {
          p_user_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      listing_condition:
        | 'fair'
        | 'good'
        | 'like_new'
        | 'new'
        | 'poor'
        | 'very_good';
      message_type: 'image' | 'offer' | 'system' | 'text';
      payment_provider: 'makecommerce' | 'stripe';
      payment_status:
        | 'cancelled'
        | 'completed'
        | 'failed'
        | 'pending'
        | 'processing'
        | 'refunded';
      shipping_method: 'courier' | 'international' | 'pickup' | 'post';
      user_location: 'EST' | 'EU' | 'LVA' | 'LTU' | 'OTHER';
      job_status:
        | 'pending'
        | 'processing'
        | 'completed'
        | 'failed'
        | 'cancelled';
      job_priority: 'low' | 'normal' | 'high' | 'critical';
      job_type:
        | 'bgg_sync'
        | 'bgg_bulk_sync'
        | 'cache_warmup'
        | 'user_collection_sync'
        | 'search_prefetch';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for common operations
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// Specific table types
export type Profile = Tables<'profiles'>;
export type Game = Tables<'games'>;
export type Listing = Tables<'listings'>;
export type Conversation = Tables<'conversations'>;
export type Message = Tables<'messages'>;
export type UserRating = Tables<'user_ratings'>;
export type Wishlist = Tables<'wishlists'>;
export type Payment = Tables<'payments'>;
export type Job = Tables<'jobs'>;
export type JobHistory = Tables<'job_history'>;

// Enum types
export type ListingCondition = Enums<'listing_condition'>;
export type MessageType = Enums<'message_type'>;
export type PaymentProvider = Enums<'payment_provider'>;
export type PaymentStatus = Enums<'payment_status'>;
export type ShippingMethod = Enums<'shipping_method'>;
export type UserLocation = Enums<'user_location'>;
export type JobStatus = Enums<'job_status'>;
export type JobPriority = Enums<'job_priority'>;
export type JobType = Enums<'job_type'>;

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type GameInsert = Database['public']['Tables']['games']['Insert'];
export type ListingInsert = Database['public']['Tables']['listings']['Insert'];
export type ConversationInsert =
  Database['public']['Tables']['conversations']['Insert'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type UserRatingInsert =
  Database['public']['Tables']['user_ratings']['Insert'];
export type WishlistInsert =
  Database['public']['Tables']['wishlists']['Insert'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type JobInsert = Database['public']['Tables']['jobs']['Insert'];
export type JobHistoryInsert =
  Database['public']['Tables']['job_history']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type GameUpdate = Database['public']['Tables']['games']['Update'];
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];
export type ConversationUpdate =
  Database['public']['Tables']['conversations']['Update'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];
export type UserRatingUpdate =
  Database['public']['Tables']['user_ratings']['Update'];
export type WishlistUpdate =
  Database['public']['Tables']['wishlists']['Update'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];
export type JobHistoryUpdate =
  Database['public']['Tables']['job_history']['Update'];

// Utility types for common operations
export type ProfileWithStats = Profile & {
  total_listings: number;
  total_sales: number;
  average_rating: number;
  total_ratings: number;
};

export type ListingWithDetails = Listing & {
  game: Game;
  seller: Profile;
  images: string[];
};

export type ConversationWithDetails = Conversation & {
  listing: ListingWithDetails;
  buyer: Profile;
  seller: Profile;
  last_message: Message | null;
};

export type MessageWithSender = Message & {
  sender: Profile;
};

// Search and filter types
export type GameSearchFilters = {
  categories?: string[];
  mechanics?: string[];
  min_players?: number;
  max_players?: number;
  min_playing_time?: number;
  max_playing_time?: number;
  min_year?: number;
  max_year?: number;
  min_rating?: number;
  designers?: string[];
  publishers?: string[];
};

export type ListingSearchFilters = {
  condition?: ListingCondition[];
  min_price?: number;
  max_price?: number;
  location?: string[];
  is_featured?: boolean;
  game_id?: string;
  seller_id?: string;
};

// API response types
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
