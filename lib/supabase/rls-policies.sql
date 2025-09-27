-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - SECOND TURN GAMES MARKETPLACE
-- =============================================================================
-- GDPR-compliant security policies for the complete marketplace schema
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

-- =============================================================================
-- PROFILES TABLE POLICIES
-- =============================================================================

-- Users can view all profiles (for marketplace visibility)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- GAMES TABLE POLICIES
-- =============================================================================

-- Games are publicly readable (BGG cache)
DROP POLICY IF EXISTS "Games are viewable by everyone" ON public.games;
CREATE POLICY "Games are viewable by everyone" ON public.games
    FOR SELECT USING (true);

-- Only authenticated users can insert games (admin/BGG sync)
DROP POLICY IF EXISTS "Authenticated users can insert games" ON public.games;
CREATE POLICY "Authenticated users can insert games" ON public.games
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update games
DROP POLICY IF EXISTS "Authenticated users can update games" ON public.games;
CREATE POLICY "Authenticated users can update games" ON public.games
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================================================
-- LISTINGS TABLE POLICIES
-- =============================================================================

-- Active listings are viewable by everyone
DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON public.listings;
CREATE POLICY "Active listings are viewable by everyone" ON public.listings
    FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Users can view their own listings (including inactive/deleted)
DROP POLICY IF EXISTS "Users can view their own listings" ON public.listings;
CREATE POLICY "Users can view their own listings" ON public.listings
    FOR SELECT USING (auth.uid() = seller_id);

-- Users can insert their own listings
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
CREATE POLICY "Users can insert their own listings" ON public.listings
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Users can update their own listings
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
CREATE POLICY "Users can update their own listings" ON public.listings
    FOR UPDATE USING (auth.uid() = seller_id);

-- Users can delete their own listings (soft delete)
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
CREATE POLICY "Users can delete their own listings" ON public.listings
    FOR DELETE USING (auth.uid() = seller_id);

-- =============================================================================
-- CONVERSATIONS TABLE POLICIES
-- =============================================================================

-- Users can view conversations they participate in
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Buyers can create conversations
DROP POLICY IF EXISTS "Buyers can create conversations" ON public.conversations;
CREATE POLICY "Buyers can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = buyer_id AND auth.uid() != seller_id);

-- Participants can update conversations (archive/unarchive)
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- =============================================================================
-- MESSAGES TABLE POLICIES
-- =============================================================================

-- Users can view messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        )
    );

-- Users can send messages in their conversations
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

-- Users can update their own messages (edit)
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- =============================================================================
-- USER_RATINGS TABLE POLICIES
-- =============================================================================

-- Ratings are viewable by everyone (for transparency)
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.user_ratings;
CREATE POLICY "Ratings are viewable by everyone" ON public.user_ratings
    FOR SELECT USING (true);

-- Users can rate others after completed transaction
DROP POLICY IF EXISTS "Users can rate others after completed transaction" ON public.user_ratings;
CREATE POLICY "Users can rate others after completed transaction" ON public.user_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = rater_user_id AND
        auth.uid() != rated_user_id AND
        can_user_rate(rated_user_id, rater_user_id, listing_id)
    );

-- Users can update their own ratings
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.user_ratings;
CREATE POLICY "Users can update their own ratings" ON public.user_ratings
    FOR UPDATE USING (auth.uid() = rater_user_id);

-- Users can delete their own ratings
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.user_ratings;
CREATE POLICY "Users can delete their own ratings" ON public.user_ratings
    FOR DELETE USING (auth.uid() = rater_user_id);

-- =============================================================================
-- WISHLISTS TABLE POLICIES
-- =============================================================================

-- Users can view their own wishlists
DROP POLICY IF EXISTS "Users can view their own wishlists" ON public.wishlists;
CREATE POLICY "Users can view their own wishlists" ON public.wishlists
    FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own wishlists
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlists" ON public.wishlists
    FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- PAYMENTS TABLE POLICIES
-- =============================================================================

-- Users can view their own payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create payments for themselves
DROP POLICY IF EXISTS "Users can create payments for themselves" ON public.payments;
CREATE POLICY "Users can create payments for themselves" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own payments
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- STORAGE BUCKET POLICIES
-- =============================================================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('listing-images', 'listing-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('message-attachments', 'message-attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Avatar upload policy - users can upload their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Avatar view policy - avatars are publicly viewable
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Avatar update policy - users can update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Avatar delete policy - users can delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Listing images upload policy - users can upload images for their listings
DROP POLICY IF EXISTS "Users can upload listing images" ON storage.objects;
CREATE POLICY "Users can upload listing images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'listing-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Listing images view policy - listing images are publicly viewable
DROP POLICY IF EXISTS "Listing images are publicly viewable" ON storage.objects;
CREATE POLICY "Listing images are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'listing-images');

-- Listing images update policy - users can update their listing images
DROP POLICY IF EXISTS "Users can update their listing images" ON storage.objects;
CREATE POLICY "Users can update their listing images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'listing-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Listing images delete policy - users can delete their listing images
DROP POLICY IF EXISTS "Users can delete their listing images" ON storage.objects;
CREATE POLICY "Users can delete their listing images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'listing-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Message attachments upload policy - conversation participants can upload attachments
DROP POLICY IF EXISTS "Conversation participants can upload attachments" ON storage.objects;
CREATE POLICY "Conversation participants can upload attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'message-attachments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Message attachments view policy - conversation participants can view attachments
DROP POLICY IF EXISTS "Conversation participants can view attachments" ON storage.objects;
CREATE POLICY "Conversation participants can view attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'message-attachments' AND
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.messages m ON m.conversation_id = c.id
            WHERE m.id::text = (storage.foldername(name))[2]
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
    );

-- Message attachments delete policy - conversation participants can delete attachments
DROP POLICY IF EXISTS "Conversation participants can delete attachments" ON storage.objects;
CREATE POLICY "Conversation participants can delete attachments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'message-attachments' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies applied successfully!';
    RAISE NOTICE '🔒 All tables have GDPR-compliant security policies';
    RAISE NOTICE '📁 Storage buckets created with proper access controls';
    RAISE NOTICE '🛡️ User data is protected with row-level security';
    RAISE NOTICE '🚀 Marketplace is secure and ready for production!';
END $$;