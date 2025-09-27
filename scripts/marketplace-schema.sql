-- =============================================================================
-- SECOND TURN GAMES - MARKETPLACE DATABASE SCHEMA
-- =============================================================================
-- Complete marketplace database schema with GDPR-compliant RLS policies
-- Designed for Baltic market (EST/LVA/LTU) with EUR currency
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- 1. PROFILES TABLE (extends auth.users)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT CHECK (LENGTH(bio) <= 500),
    location TEXT CHECK (location IN ('EST', 'LVA', 'LTU', 'EU', 'OTHER')),
    phone VARCHAR(20),
    reputation_score INTEGER DEFAULT 0 CHECK (reputation_score >= 0),
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    privacy_settings JSONB DEFAULT '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb,
    notification_settings JSONB DEFAULT '{"messages": true, "offers": true, "listings": true, "marketing": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. GAMES TABLE (BGG cache)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bgg_id INTEGER UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    year_published INTEGER CHECK (year_published >= 1800 AND year_published <= EXTRACT(YEAR FROM NOW()) + 5),
    min_players INTEGER CHECK (min_players > 0),
    max_players INTEGER CHECK (max_players > 0),
    playing_time INTEGER CHECK (playing_time > 0), -- in minutes
    complexity_rating DECIMAL(2,1) CHECK (complexity_rating >= 1.0 AND complexity_rating <= 5.0),
    image_url TEXT,
    thumbnail_url TEXT,
    categories TEXT[] DEFAULT '{}',
    mechanics TEXT[] DEFAULT '{}',
    designers TEXT[] DEFAULT '{}',
    artists TEXT[] DEFAULT '{}',
    publishers TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    age_rating INTEGER CHECK (age_rating > 0),
    bgg_rating DECIMAL(3,2),
    bgg_rank INTEGER,
    weight_rating DECIMAL(2,1), -- BGG weight/complexity
    last_bgg_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. LISTINGS TABLE
-- =============================================================================

CREATE TYPE listing_condition AS ENUM ('new', 'like_new', 'very_good', 'good', 'fair', 'poor');
CREATE TYPE shipping_method AS ENUM ('pickup', 'courier', 'post', 'international');

CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 200),
    description TEXT CHECK (LENGTH(description) <= 2000),
    condition listing_condition NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    currency VARCHAR(3) DEFAULT 'EUR' CHECK (currency = 'EUR'),
    images TEXT[] DEFAULT '{}',
    location TEXT NOT NULL,
    shipping_options JSONB DEFAULT '{
        "pickup": {"available": true, "cost": 0},
        "courier": {"available": false, "cost": 0, "regions": []},
        "post": {"available": false, "cost": 0, "regions": []},
        "international": {"available": false, "cost": 0, "countries": []}
    }'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    message_count INTEGER DEFAULT 0 CHECK (message_count >= 0),
    expires_at TIMESTAMP WITH TIME ZONE,
    sold_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete for GDPR compliance
);

-- =============================================================================
-- 4. CONVERSATIONS TABLE
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
    UNIQUE(listing_id, buyer_id) -- One conversation per listing per buyer
);

-- =============================================================================
-- 5. MESSAGES TABLE
-- =============================================================================

CREATE TYPE message_type AS ENUM ('text', 'offer', 'image', 'system');

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000),
    message_type message_type DEFAULT 'text',
    metadata JSONB DEFAULT '{}', -- For offer amounts, image URLs, etc.
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 6. USER RATINGS TABLE
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
    UNIQUE(rated_user_id, rater_user_id, listing_id) -- One rating per transaction
);

-- =============================================================================
-- 7. WISHLISTS TABLE
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
    UNIQUE(user_id, game_id) -- One wishlist entry per user per game
);

-- =============================================================================
-- 8. PAYMENTS TABLE
-- =============================================================================

CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE payment_provider AS ENUM ('makecommerce', 'stripe');

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
    metadata JSONB DEFAULT '{}', -- Provider-specific data
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 9. PERFORMANCE INDEXES
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
-- 10. UTILITY FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
-- 11. TRIGGERS
-- =============================================================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_games_updated_at ON public.games;
CREATE TRIGGER update_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON public.listings;
CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_ratings_updated_at ON public.user_ratings;
CREATE TRIGGER update_user_ratings_updated_at
    BEFORE UPDATE ON public.user_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Games policies (read-only for users, admin can modify)
DROP POLICY IF EXISTS "Games are viewable by everyone" ON public.games;
CREATE POLICY "Games are viewable by everyone" ON public.games
    FOR SELECT USING (true);

-- Listings policies
DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON public.listings;
CREATE POLICY "Active listings are viewable by everyone" ON public.listings
    FOR SELECT USING (is_active = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can view their own listings" ON public.listings;
CREATE POLICY "Users can view their own listings" ON public.listings
    FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
CREATE POLICY "Users can insert their own listings" ON public.listings
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
CREATE POLICY "Users can update their own listings" ON public.listings
    FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
CREATE POLICY "Users can delete their own listings" ON public.listings
    FOR DELETE USING (auth.uid() = seller_id);

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

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

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
-- 13. GDPR COMPLIANCE FUNCTIONS
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
    UPDATE public.listations 
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
-- 14. SAMPLE DATA (for development)
-- =============================================================================

-- Insert sample games (optional - for development/testing)
INSERT INTO public.games (bgg_id, title, description, year_published, min_players, max_players, playing_time, complexity_rating, categories, mechanics)
VALUES 
    (1, 'Catan', 'Build settlements and trade resources', 1995, 3, 4, 75, 2.3, ARRAY['Strategy', 'Economic'], ARRAY['Trading', 'Dice Rolling']),
    (2, 'Ticket to Ride', 'Build train routes across North America', 2004, 2, 5, 45, 1.9, ARRAY['Strategy', 'Family'], ARRAY['Route Building', 'Set Collection'])
ON CONFLICT (bgg_id) DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Marketplace database schema created successfully!';
    RAISE NOTICE '📊 Tables created: profiles, games, listings, conversations, messages, user_ratings, wishlists, payments';
    RAISE NOTICE '🔒 RLS policies enabled for GDPR compliance';
    RAISE NOTICE '⚡ Performance indexes created for optimal query speed';
    RAISE NOTICE '🔧 Utility functions and triggers configured';
    RAISE NOTICE '🚀 Ready for marketplace operations!';
END $$;
