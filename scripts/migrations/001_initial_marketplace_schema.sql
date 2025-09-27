-- =============================================================================
-- MIGRATION 001: Initial Marketplace Schema
-- =============================================================================
-- This migration creates the complete marketplace database schema
-- Run this after the basic setup-database.sql has been executed
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- 1. CREATE ENUMS
-- =============================================================================

-- User location enum for Baltic market
DO $$ BEGIN
    CREATE TYPE user_location AS ENUM ('EST', 'LVA', 'LTU', 'EU', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Listing condition enum
DO $$ BEGIN
    CREATE TYPE listing_condition AS ENUM ('new', 'like_new', 'very_good', 'good', 'fair', 'poor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Message type enum
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'offer', 'image', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment status enum
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payment provider enum
DO $$ BEGIN
    CREATE TYPE payment_provider AS ENUM ('makecommerce', 'stripe');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Shipping method enum
DO $$ BEGIN
    CREATE TYPE shipping_method AS ENUM ('pickup', 'courier', 'post', 'international');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. UPDATE PROFILES TABLE
-- =============================================================================

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0 CHECK (reputation_score >= 0),
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"messages": true, "offers": true, "listings": true, "marketing": false}'::jsonb;

-- Update location column to use enum
ALTER TABLE public.profiles 
ALTER COLUMN location TYPE user_location USING location::user_location;

-- Add constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
ADD CONSTRAINT IF NOT EXISTS profiles_bio_length CHECK (LENGTH(bio) <= 500);

-- =============================================================================
-- 3. UPDATE GAMES TABLE
-- =============================================================================

-- Add new columns to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS age_rating INTEGER CHECK (age_rating > 0),
ADD COLUMN IF NOT EXISTS bgg_rank INTEGER,
ADD COLUMN IF NOT EXISTS weight_rating DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS last_bgg_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS designers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS artists TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS publishers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- Update existing columns
ALTER TABLE public.games 
ALTER COLUMN categories SET DEFAULT '{}',
ALTER COLUMN mechanics SET DEFAULT '{}';

-- Rename mechanics to mechanics (if it was called mechanisms)
ALTER TABLE public.games RENAME COLUMN IF EXISTS mechanisms TO mechanics;

-- =============================================================================
-- 4. UPDATE LISTINGS TABLE
-- =============================================================================

-- Add new columns to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0 CHECK (message_count >= 0),
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS shipping_options JSONB DEFAULT '{
    "pickup": {"available": true, "cost": 0},
    "courier": {"available": false, "cost": 0, "regions": []},
    "post": {"available": false, "cost": 0, "regions": []},
    "international": {"available": false, "cost": 0, "countries": []}
}'::jsonb;

-- Update condition column to use enum
ALTER TABLE public.listings 
ALTER COLUMN condition TYPE listing_condition USING condition::listing_condition;

-- Rename user_id to seller_id
ALTER TABLE public.listings RENAME COLUMN IF EXISTS user_id TO seller_id;

-- =============================================================================
-- 5. CREATE CONVERSATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_preview TEXT,
    buyer_unread_count INTEGER DEFAULT 0 CHECK (buyer_unread_count >= 0),
    seller_unread_count INTEGER DEFAULT 0 CHECK (seller_unread_count >= 0),
    is_archived_by_buyer BOOLEAN DEFAULT FALSE,
    is_archived_by_seller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(listing_id, buyer_id)
);

-- =============================================================================
-- 6. UPDATE MESSAGES TABLE
-- =============================================================================

-- Add new columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Update message_type to use enum
ALTER TABLE public.messages 
ALTER COLUMN message_type TYPE message_type USING message_type::message_type;

-- =============================================================================
-- 7. CREATE USER_RATINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rated_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rater_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT CHECK (LENGTH(comment) <= 500),
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rated_user_id, rater_user_id, listing_id)
);

-- =============================================================================
-- 8. CREATE WISHLISTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    max_price DECIMAL(10,2) CHECK (max_price > 0),
    condition_preference listing_condition[],
    location_preference TEXT,
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);

-- =============================================================================
-- 9. CREATE PAYMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'EUR' CHECK (currency = 'EUR'),
    status payment_status DEFAULT 'pending',
    provider payment_provider NOT NULL,
    payment_intent_id TEXT,
    transaction_id TEXT,
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 10. CREATE INDEXES
-- =============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON public.profiles(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at DESC);

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_bgg_id ON public.games(bgg_id);
CREATE INDEX IF NOT EXISTS idx_games_title_trgm ON public.games USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_games_categories ON public.games USING gin(categories);
CREATE INDEX IF NOT EXISTS idx_games_mechanics ON public.games USING gin(mechanics);
CREATE INDEX IF NOT EXISTS idx_games_year ON public.games(year_published);
CREATE INDEX IF NOT EXISTS idx_games_players ON public.games(min_players, max_players);
CREATE INDEX IF NOT EXISTS idx_games_rating ON public.games(bgg_rating DESC);

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_game_id ON public.listings(game_id);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_active ON public.listings(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON public.listings USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON public.listings(condition);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(is_featured) WHERE is_featured = TRUE;

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON public.conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, is_read) WHERE is_read = FALSE;

-- User ratings indexes
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON public.user_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_user ON public.user_ratings(rater_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_listing_id ON public.user_ratings(listing_id);

-- Wishlists indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_game_id ON public.wishlists(game_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_price ON public.wishlists(max_price);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_listing_id ON public.payments(listing_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON public.payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- =============================================================================
-- 11. CREATE UTILITY FUNCTIONS
-- =============================================================================

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    -- Update unread counts
    IF NEW.sender_id = (SELECT buyer_id FROM public.conversations WHERE id = NEW.conversation_id) THEN
        UPDATE public.conversations 
        SET seller_unread_count = seller_unread_count + 1
        WHERE id = NEW.conversation_id;
    ELSE
        UPDATE public.conversations 
        SET buyer_unread_count = buyer_unread_count + 1
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update listing view count
CREATE OR REPLACE FUNCTION increment_listing_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.listings 
    SET view_count = view_count + 1
    WHERE id = NEW.listing_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update user reputation
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL;
BEGIN
    SELECT AVG(rating) INTO avg_rating
    FROM public.user_ratings 
    WHERE rated_user_id = NEW.rated_user_id;
    
    UPDATE public.profiles 
    SET reputation_score = COALESCE(avg_rating * 20, 0) -- Scale 1-5 to 0-100
    WHERE id = NEW.rated_user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to check if user can rate (completed transaction)
CREATE OR REPLACE FUNCTION can_user_rate(p_rated_user_id UUID, p_rater_user_id UUID, p_listing_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_completed_payment BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.payments 
        WHERE user_id = p_rater_user_id 
        AND listing_id = p_listing_id 
        AND status = 'completed'
    ) INTO has_completed_payment;
    
    RETURN has_completed_payment;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- =============================================================================
-- 12. CREATE TRIGGERS
-- =============================================================================

-- Message triggers
DROP TRIGGER IF EXISTS update_conversation_on_message ON public.messages;
CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- View count trigger
DROP TRIGGER IF EXISTS increment_view_count ON public.conversations;
CREATE TRIGGER increment_view_count
    AFTER INSERT ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION increment_listing_view_count();

-- Reputation trigger
DROP TRIGGER IF EXISTS update_reputation_on_rating ON public.user_ratings;
CREATE TRIGGER update_reputation_on_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.user_ratings
    FOR EACH ROW EXECUTE FUNCTION update_user_reputation();

-- =============================================================================
-- 13. UPDATE RLS POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Conversations policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Buyers can create conversations" ON public.conversations;
CREATE POLICY "Buyers can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = buyer_id AND auth.uid() != seller_id);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- User ratings policies
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.user_ratings;
CREATE POLICY "Ratings are viewable by everyone" ON public.user_ratings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can rate others after completed transaction" ON public.user_ratings;
CREATE POLICY "Users can rate others after completed transaction" ON public.user_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = rater_user_id AND
        auth.uid() != rated_user_id AND
        can_user_rate(rated_user_id, rater_user_id, listing_id)
    );

DROP POLICY IF EXISTS "Users can update their own ratings" ON public.user_ratings;
CREATE POLICY "Users can update their own ratings" ON public.user_ratings
    FOR UPDATE USING (auth.uid() = rater_user_id);

DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.user_ratings;
CREATE POLICY "Users can delete their own ratings" ON public.user_ratings
    FOR DELETE USING (auth.uid() = rater_user_id);

-- Wishlists policies
DROP POLICY IF EXISTS "Users can view their own wishlists" ON public.wishlists;
CREATE POLICY "Users can view their own wishlists" ON public.wishlists
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own wishlists" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlists" ON public.wishlists
    FOR ALL USING (auth.uid() = user_id);

-- Payments policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create payments for themselves" ON public.payments;
CREATE POLICY "Users can create payments for themselves" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 14. GDPR COMPLIANCE FUNCTIONS
-- =============================================================================

-- Function to anonymize user data for GDPR deletion
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonymize profile
    UPDATE public.profiles 
    SET 
        username = 'deleted_user_' || SUBSTRING(p_user_id::text, 1, 8),
        full_name = NULL,
        avatar_url = NULL,
        bio = NULL,
        phone = NULL,
        email_verified = FALSE,
        phone_verified = FALSE,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Soft delete listings
    UPDATE public.listings 
    SET 
        deleted_at = NOW(),
        is_active = FALSE,
        updated_at = NOW()
    WHERE seller_id = p_user_id;
    
    -- Anonymize messages (keep for other participants)
    UPDATE public.messages 
    SET 
        content = '[Message deleted by user]',
        updated_at = NOW()
    WHERE sender_id = p_user_id;
    
    -- Delete wishlists
    DELETE FROM public.wishlists WHERE user_id = p_user_id;
    
    -- Anonymize ratings (keep structure for other users)
    UPDATE public.user_ratings 
    SET 
        comment = NULL,
        updated_at = NOW()
    WHERE rater_user_id = p_user_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to export user data for GDPR access
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', (SELECT to_jsonb(p.*) FROM public.profiles p WHERE p.id = p_user_id),
        'listings', (SELECT jsonb_agg(to_jsonb(l.*)) FROM public.listings l WHERE l.seller_id = p_user_id),
        'conversations', (SELECT jsonb_agg(to_jsonb(c.*)) FROM public.conversations c WHERE c.buyer_id = p_user_id OR c.seller_id = p_user_id),
        'messages', (SELECT jsonb_agg(to_jsonb(m.*)) FROM public.messages m 
                    JOIN public.conversations c ON m.conversation_id = c.id 
                    WHERE c.buyer_id = p_user_id OR c.seller_id = p_user_id),
        'ratings_given', (SELECT jsonb_agg(to_jsonb(r.*)) FROM public.user_ratings r WHERE r.rater_user_id = p_user_id),
        'ratings_received', (SELECT jsonb_agg(to_jsonb(r.*)) FROM public.user_ratings r WHERE r.rated_user_id = p_user_id),
        'wishlists', (SELECT jsonb_agg(to_jsonb(w.*)) FROM public.wishlists w WHERE w.user_id = p_user_id),
        'payments', (SELECT jsonb_agg(to_jsonb(p.*)) FROM public.payments p WHERE p.user_id = p_user_id)
    ) INTO result;
    
    RETURN result;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration 001 completed successfully!';
    RAISE NOTICE '📊 Enhanced profiles, games, and listings tables';
    RAISE NOTICE '💬 Added conversations and enhanced messages';
    RAISE NOTICE '⭐ Added user ratings and wishlists';
    RAISE NOTICE '💳 Added payments table with Baltic payment support';
    RAISE NOTICE '🔒 Updated RLS policies for GDPR compliance';
    RAISE NOTICE '⚡ Added performance indexes and utility functions';
    RAISE NOTICE '🚀 Marketplace schema is now complete!';
END $$;
