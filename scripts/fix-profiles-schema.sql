-- Migration to fix profiles table schema
-- This script safely updates the existing profiles table to use full_name instead of display_name

-- First, check if the column exists and what it's called
DO $$
BEGIN
    -- Check if display_name column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'display_name'
        AND table_schema = 'public'
    ) THEN
        -- Rename display_name to full_name
        ALTER TABLE profiles RENAME COLUMN display_name TO full_name;
        RAISE NOTICE 'Renamed display_name column to full_name in profiles table';
    ELSE
        -- Check if full_name already exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'full_name'
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE 'full_name column already exists in profiles table';
        ELSE
            -- Add full_name column if neither exists
            ALTER TABLE profiles ADD COLUMN full_name TEXT;
            RAISE NOTICE 'Added full_name column to profiles table';
        END IF;
    END IF;
END $$;

-- Update the handle_new_user function to use full_name
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Update RLS policies to use full_name
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Add comment to document the change
COMMENT ON COLUMN profiles.full_name IS 'User full name (renamed from display_name for consistency)';

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
