-- =============================================================================
-- FIX MISSING PROFILE COLUMNS
-- =============================================================================
-- This script adds the missing columns to the profiles table
-- =============================================================================

-- Step 1: Add missing JSONB columns
DO $$
BEGIN
    -- Add privacy_settings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'privacy_settings') THEN
        ALTER TABLE public.profiles ADD COLUMN privacy_settings JSONB DEFAULT '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb;
        RAISE NOTICE '✅ Added privacy_settings column';
    ELSE
        RAISE NOTICE 'ℹ️  privacy_settings column already exists';
    END IF;
    
    -- Add notification_settings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'notification_settings') THEN
        ALTER TABLE public.profiles ADD COLUMN notification_settings JSONB DEFAULT '{"messages": true, "offers": true, "listings": true, "marketing": false}'::jsonb;
        RAISE NOTICE '✅ Added notification_settings column';
    ELSE
        RAISE NOTICE 'ℹ️  notification_settings column already exists';
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added email_verified column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added phone_verified column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added is_verified column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ Added avatar_url column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'last_active_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added last_active_at column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'reputation_score') THEN
        ALTER TABLE public.profiles ADD COLUMN reputation_score INTEGER DEFAULT 0 CHECK (reputation_score >= 0);
        RAISE NOTICE '✅ Added reputation_score column';
    END IF;
END $$;

-- Step 2: Update existing profiles with default values for new columns
UPDATE public.profiles 
SET 
    privacy_settings = COALESCE(privacy_settings, '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb),
    notification_settings = COALESCE(notification_settings, '{"messages": true, "offers": true, "listings": true, "marketing": false}'::jsonb),
    email_verified = COALESCE(email_verified, FALSE),
    phone_verified = COALESCE(phone_verified, FALSE),
    is_verified = COALESCE(is_verified, FALSE),
    reputation_score = COALESCE(reputation_score, 0),
    last_active_at = COALESCE(last_active_at, NOW())
WHERE 
    privacy_settings IS NULL 
    OR notification_settings IS NULL 
    OR email_verified IS NULL 
    OR phone_verified IS NULL 
    OR is_verified IS NULL 
    OR reputation_score IS NULL 
    OR last_active_at IS NULL;

-- Step 3: Set proper constraints
ALTER TABLE public.profiles 
    ALTER COLUMN privacy_settings SET NOT NULL,
    ALTER COLUMN notification_settings SET NOT NULL,
    ALTER COLUMN email_verified SET NOT NULL,
    ALTER COLUMN phone_verified SET NOT NULL,
    ALTER COLUMN is_verified SET NOT NULL,
    ALTER COLUMN reputation_score SET NOT NULL,
    ALTER COLUMN last_active_at SET NOT NULL;

-- Step 4: Verify the schema
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'profiles';
    
    RAISE NOTICE '📊 Profiles table now has % columns', column_count;
    RAISE NOTICE '✅ All required columns have been added!';
END $$;

-- Step 5: Show current schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;