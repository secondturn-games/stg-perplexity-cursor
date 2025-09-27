-- Reset Database Script
-- This script safely resets the database by dropping existing objects and recreating them
-- Use this if you need to start fresh or fix conflicts

-- Drop all triggers first
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON messages;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all policies (this will drop all RLS policies)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop policies for all tables
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own profile" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own profile" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Games are viewable by everyone" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert games" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update games" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete games" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own listings" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own listings" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own listings" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own listings" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Listing images are viewable for active listings" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view images for their own listings" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert images for their own listings" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update images for their own listings" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete images for their own listings" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their conversations" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create conversations" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their conversations" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view participants of their conversations" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can join conversations" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can leave conversations" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view messages in their conversations" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can send messages to their conversations" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own messages" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own messages" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own preferences" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own preferences" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own preferences" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own preferences" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own reviews" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own reviews" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own reviews" ON ' || r.tablename;
    END LOOP;
END $$;

-- Drop storage policies
DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view game images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload game images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update game images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete game images" ON storage.objects;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_conversation_last_message();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS is_conversation_participant(UUID, UUID);
DROP FUNCTION IF EXISTS owns_listing(UUID, UUID);
DROP FUNCTION IF EXISTS get_user_profile(UUID);

-- Drop storage buckets
DELETE FROM storage.buckets WHERE id IN ('listing-images', 'profile-avatars', 'game-images');

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS listing_images CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS game_condition CASCADE;
DROP TYPE IF EXISTS listing_status CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;

-- Now you can run the setup-database.sql script to recreate everything
