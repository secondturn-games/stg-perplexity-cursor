/**
 * Common types used throughout the application
 */

// User types
export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  bio?: string;
  location?: string;
  website?: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  language: 'en' | 'et' | 'lv' | 'lt';
  currency: 'EUR';
  notifications: {
    email: boolean;
    push: boolean;
    marketplace_updates: boolean;
    messages: boolean;
  };
  privacy: {
    show_email: boolean;
    show_location: boolean;
    allow_messages: boolean;
  };
}

// Game types
export interface Game {
  id: string;
  bgg_id?: number;
  title: string;
  description?: string;
  min_players?: number;
  max_players?: number;
  min_age?: number;
  playing_time?: number;
  year_published?: number;
  designer?: string[];
  artist?: string[];
  publisher?: string[];
  categories?: string[];
  mechanisms?: string[];
  image_url?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface GameSearchResult {
  id: string;
  title: string;
  year_published?: number;
  thumbnail_url?: string;
  bgg_rating?: number;
  user_rating?: number;
}

// Listing types
export interface Listing {
  id: string;
  user_id: string;
  game_id: string;
  title: string;
  description: string;
  price: number;
  condition: GameCondition;
  status: ListingStatus;
  location: string;
  shipping_methods: ShippingMethod[];
  images: ListingImage[];
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export type GameCondition = 'new' | 'like_new' | 'very_good' | 'good' | 'fair' | 'poor';

export type ListingStatus = 'active' | 'pending' | 'sold' | 'expired' | 'cancelled';

export interface ShippingMethod {
  id: string;
  name: string;
  cost: number;
  estimated_days: number;
  available_regions: string[];
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  alt_text?: string;
  order: number;
  created_at: string;
}

// Message types
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  read_at?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id?: string;
  participants: string[];
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Search and Filter types
export interface SearchFilters {
  query?: string;
  min_price?: number;
  max_price?: number;
  condition?: GameCondition[];
  location?: string;
  radius?: number;
  min_players?: number;
  max_players?: number;
  min_age?: number;
  max_playing_time?: number;
  categories?: string[];
  mechanisms?: string[];
  sort_by?: 'price' | 'created_at' | 'rating' | 'distance';
  sort_order?: 'asc' | 'desc';
}

// Form types
export interface CreateListingForm {
  game_id: string;
  title: string;
  description: string;
  price: number;
  condition: GameCondition;
  location: string;
  shipping_methods: Omit<ShippingMethod, 'id'>[];
  images: File[];
}

export interface UpdateProfileForm {
  display_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  preferences: Partial<UserPreferences>;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

// Environment types
export type Environment = 'development' | 'test' | 'production';

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: string;
  user_id?: string;
}
