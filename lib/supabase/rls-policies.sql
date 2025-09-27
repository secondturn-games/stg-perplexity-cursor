-- Row Level Security (RLS) Policies for Second Turn Games
-- These policies ensure data security and proper access control

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Users can view all profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete their own profile" ON profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Games table policies
-- Games are publicly readable
CREATE POLICY "Games are viewable by everyone" ON games
    FOR SELECT USING (true);

-- Only authenticated users can insert games (for admin purposes)
CREATE POLICY "Authenticated users can insert games" ON games
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update games
CREATE POLICY "Authenticated users can update games" ON games
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete games
CREATE POLICY "Authenticated users can delete games" ON games
    FOR DELETE USING (auth.role() = 'authenticated');

-- Listings table policies
-- Everyone can view active listings
CREATE POLICY "Active listings are viewable by everyone" ON listings
    FOR SELECT USING (status = 'active');

-- Users can view their own listings regardless of status
CREATE POLICY "Users can view their own listings" ON listings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own listings
CREATE POLICY "Users can insert their own listings" ON listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own listings
CREATE POLICY "Users can update their own listings" ON listings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own listings
CREATE POLICY "Users can delete their own listings" ON listings
    FOR DELETE USING (auth.uid() = user_id);

-- Listing images table policies
-- Everyone can view listing images for active listings
CREATE POLICY "Listing images are viewable for active listings" ON listing_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE listings.id = listing_images.listing_id 
            AND listings.status = 'active'
        )
    );

-- Users can view images for their own listings
CREATE POLICY "Users can view images for their own listings" ON listing_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE listings.id = listing_images.listing_id 
            AND listings.user_id = auth.uid()
        )
    );

-- Users can insert images for their own listings
CREATE POLICY "Users can insert images for their own listings" ON listing_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE listings.id = listing_images.listing_id 
            AND listings.user_id = auth.uid()
        )
    );

-- Users can update images for their own listings
CREATE POLICY "Users can update images for their own listings" ON listing_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE listings.id = listing_images.listing_id 
            AND listings.user_id = auth.uid()
        )
    );

-- Users can delete images for their own listings
CREATE POLICY "Users can delete images for their own listings" ON listing_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE listings.id = listing_images.listing_id 
            AND listings.user_id = auth.uid()
        )
    );

-- Conversations table policies
-- Users can view conversations they participate in
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_participants.conversation_id = conversations.id 
            AND conversation_participants.user_id = auth.uid()
        )
    );

-- Authenticated users can create conversations
CREATE POLICY "Authenticated users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update conversations they participate in
CREATE POLICY "Users can update their conversations" ON conversations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_participants.conversation_id = conversations.id 
            AND conversation_participants.user_id = auth.uid()
        )
    );

-- Conversation participants table policies
-- Users can view participants of their conversations
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp2
            WHERE cp2.conversation_id = conversation_participants.conversation_id 
            AND cp2.user_id = auth.uid()
        )
    );

-- Users can join conversations
CREATE POLICY "Users can join conversations" ON conversation_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave conversations
CREATE POLICY "Users can leave conversations" ON conversation_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Messages table policies
-- Users can view messages in conversations they participate in
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_participants.conversation_id = messages.conversation_id 
            AND conversation_participants.user_id = auth.uid()
        )
    );

-- Users can send messages to conversations they participate in
CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_participants.conversation_id = messages.conversation_id 
            AND conversation_participants.user_id = auth.uid()
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (auth.uid() = sender_id);

-- User preferences table policies
-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Reviews table policies
-- Everyone can view reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

-- Users can only insert reviews for themselves
CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = reviewer_id);

-- Storage bucket policies
-- Allow authenticated users to upload to listing-images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-avatars', 'profile-avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('game-images', 'game-images', true);

-- Storage policies for listing-images bucket
CREATE POLICY "Anyone can view listing images" ON storage.objects
    FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'listing-images' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own listing images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'listing-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own listing images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'listing-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for profile-avatars bucket
CREATE POLICY "Anyone can view profile avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their own profile avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own profile avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own profile avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for game-images bucket
CREATE POLICY "Anyone can view game images" ON storage.objects
    FOR SELECT USING (bucket_id = 'game-images');

CREATE POLICY "Authenticated users can upload game images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'game-images' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update game images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'game-images' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete game images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'game-images' AND 
        auth.role() = 'authenticated'
    );

-- Functions for better RLS policies
-- Function to check if user is participant in conversation
CREATE OR REPLACE FUNCTION is_conversation_participant(conversation_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_participants.conversation_id = is_conversation_participant.conversation_id 
        AND conversation_participants.user_id = is_conversation_participant.user_id
        AND conversation_participants.left_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns listing
CREATE OR REPLACE FUNCTION owns_listing(listing_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM listings 
        WHERE listings.id = owns_listing.listing_id 
        AND listings.user_id = owns_listing.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's profile
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    location TEXT,
    website TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        profiles.id,
        profiles.username,
        profiles.display_name,
        profiles.bio,
        profiles.avatar_url,
        profiles.location,
        profiles.website
    FROM profiles 
    WHERE profiles.user_id = get_user_profile.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
