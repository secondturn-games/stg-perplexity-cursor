/**
 * Database types for Supabase
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
          id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          location: string | null;
          website: string | null;
          preferences: Json | null;
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
          preferences?: Json | null;
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
          preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          bgg_rating: number | null;
          user_rating: number | null;
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
          bgg_rating?: number | null;
          user_rating?: number | null;
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
          bgg_rating?: number | null;
          user_rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          title: string;
          description: string;
          price: number;
          condition: Database['public']['Enums']['game_condition'];
          status: Database['public']['Enums']['listing_status'];
          location: string;
          shipping_cost: number | null;
          shipping_methods: Json | null;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
          sold_at: string | null;
          buyer_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          title: string;
          description: string;
          price: number;
          condition: Database['public']['Enums']['game_condition'];
          status?: Database['public']['Enums']['listing_status'];
          location: string;
          shipping_cost?: number | null;
          shipping_methods?: Json | null;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
          sold_at?: string | null;
          buyer_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          title?: string;
          description?: string;
          price?: number;
          condition?: Database['public']['Enums']['game_condition'];
          status?: Database['public']['Enums']['listing_status'];
          location?: string;
          shipping_cost?: number | null;
          shipping_methods?: Json | null;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
          sold_at?: string | null;
          buyer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listings_game_id_fkey';
            columns: ['game_id'];
            referencedRelation: 'games';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'listings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          url: string;
          alt_text: string | null;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          url: string;
          alt_text?: string | null;
          order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          url?: string;
          alt_text?: string | null;
          order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'listing_images_listing_id_fkey';
            columns: ['listing_id'];
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          listing_id: string | null;
          title: string | null;
          created_at: string;
          updated_at: string;
          last_message_at: string | null;
        };
        Insert: {
          id?: string;
          listing_id?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          listing_id?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_listing_id_fkey';
            columns: ['listing_id'];
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
          left_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_participants_conversation_id_fkey';
            columns: ['conversation_id'];
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_participants_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: Database['public']['Enums']['message_type'];
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: Database['public']['Enums']['message_type'];
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: Database['public']['Enums']['message_type'];
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          language: string;
          currency: string;
          notifications: Json | null;
          privacy: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          language?: string;
          currency?: string;
          notifications?: Json | null;
          privacy?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          language?: string;
          currency?: string;
          notifications?: Json | null;
          privacy?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          reviewer_id: string;
          reviewee_id: string;
          listing_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reviewer_id: string;
          reviewee_id: string;
          listing_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          listing_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_listing_id_fkey';
            columns: ['listing_id'];
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_reviewee_id_fkey';
            columns: ['reviewee_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'reviews_reviewer_id_fkey';
            columns: ['reviewer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
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
export type ListingImage = Tables<'listing_images'>;
export type Conversation = Tables<'conversations'>;
export type ConversationParticipant = Tables<'conversation_participants'>;
export type Message = Tables<'messages'>;
export type UserPreferences = Tables<'user_preferences'>;
export type Review = Tables<'reviews'>;

// Enum types
export type GameCondition = Enums<'game_condition'>;
export type ListingStatus = Enums<'listing_status'>;
export type MessageType = Enums<'message_type'>;

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type GameInsert = Database['public']['Tables']['games']['Insert'];
export type ListingInsert = Database['public']['Tables']['listings']['Insert'];
export type ListingImageInsert =
  Database['public']['Tables']['listing_images']['Insert'];
export type ConversationInsert =
  Database['public']['Tables']['conversations']['Insert'];
export type ConversationParticipantInsert =
  Database['public']['Tables']['conversation_participants']['Insert'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type UserPreferencesInsert =
  Database['public']['Tables']['user_preferences']['Insert'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type GameUpdate = Database['public']['Tables']['games']['Update'];
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];
export type ListingImageUpdate =
  Database['public']['Tables']['listing_images']['Update'];
export type ConversationUpdate =
  Database['public']['Tables']['conversations']['Update'];
export type ConversationParticipantUpdate =
  Database['public']['Tables']['conversation_participants']['Update'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];
export type UserPreferencesUpdate =
  Database['public']['Tables']['user_preferences']['Update'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];
