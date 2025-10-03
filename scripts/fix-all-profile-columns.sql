-- =============================================================================
-- FIX ALL MISSING PROFILE COLUMNS
-- =============================================================================
-- This script adds ALL missing columns to the profiles table
-- =============================================================================

-- Step 1: Show current schema before changes
SELECT 'BEFORE FIX:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 2: Add ALL missing columns with proper defaults
DO $$
BEGIN
    RAISE NOTICE '🔧 Adding missing columns to profiles table...';
    
    -- Add username column if missing (should be required)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username VARCHAR(50);
        RAISE NOTICE '✅ Added username column';
    END IF;
    
    -- Add full_name column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE '✅ Added full_name column';
    END IF;
    
    -- Add bio column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
        RAISE NOTICE '✅ Added bio column';
    END IF;
    
    -- Add avatar_url column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ Added avatar_url column';
    END IF;
    
    -- Add location column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT CHECK (location IN ('EST', 'LVA', 'LTU', 'EU', 'OTHER'));
        RAISE NOTICE '✅ Added location column';
    END IF;
    
    -- Add phone column if missing (this was causing your error)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE '✅ Added phone column';
    END IF;
    
    -- Add reputation_score column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'reputation_score') THEN
        ALTER TABLE public.profiles ADD COLUMN reputation_score INTEGER DEFAULT 0 CHECK (reputation_score >= 0);
        RAISE NOTICE '✅ Added reputation_score column';
    END IF;
    
    -- Add is_verified column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added is_verified column';
    END IF;
    
    -- Add email_verified column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added email_verified column';
    END IF;
    
    -- Add phone_verified column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added phone_verified column';
    END IF;
    
    -- Add last_active_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'last_active_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added last_active_at column';
    END IF;
    
    -- Add privacy_settings column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'privacy_settings') THEN
        ALTER TABLE public.profiles ADD COLUMN privacy_settings JSONB DEFAULT '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb;
        RAISE NOTICE '✅ Added privacy_settings column';
    END IF;
    
    -- Add notification_settings column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'notification_settings') THEN
        ALTER TABLE public.profiles ADD COLUMN notification_settings JSONB DEFAULT '{"messages": true, "offers": true, "listings": true, "marketing": false}'::jsonb;
        RAISE NOTICE '✅ Added notification_settings column';
    END IF;
    
    -- Add created_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added created_at column';
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column';
    END IF;
    
    RAISE NOTICE '🎉 All columns added successfully!';
END $$;

-- Step 3: Update existing profiles with default values for new columns
UPDATE public.profiles 
SET 
    privacy_settings = COALESCE(privacy_settings, '{"show_email": false, "show_phone": false, "show_location": true}'::jsonb),
    notification_settings = COALESCE(notification_settings, '{"messages": true, "offers": true, "listings": true, "marketing": false}'::jsonb),
    email_verified = COALESCE(email_verified, FALSE),
    phone_verified = COALESCE(phone_verified, FALSE),
    is_verified = COALESCE(is_verified, FALSE),
    reputation_score = COALESCE(reputation_score, 0),
    last_active_at = COALESCE(last_active_at, NOW()),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE 
    privacy_settings IS NULL 
    OR notification_settings IS NULL 
    OR email_verified IS NULL 
    OR phone_verified IS NULL 
    OR is_verified IS NULL 
    OR reputation_score IS NULL 
    OR last_active_at IS NULL
    OR created_at IS NULL
    OR updated_at IS NULL;

-- Step 4: Set proper constraints
ALTER TABLE public.profiles 
    ALTER COLUMN username SET NOT NULL,
    ALTER COLUMN privacy_settings SET NOT NULL,
    ALTER COLUMN notification_settings SET NOT NULL,
    ALTER COLUMN email_verified SET NOT NULL,
    ALTER COLUMN phone_verified SET NOT NULL,
    ALTER COLUMN is_verified SET NOT NULL,
    ALTER COLUMN reputation_score SET NOT NULL,
    ALTER COLUMN last_active_at SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

-- Step 5: Add unique constraint on username if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%username%'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
        RAISE NOTICE '✅ Added unique constraint on username';
    END IF;
END $$;

-- Step 6: Show final schema
SELECT 'AFTER FIX:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 7: Final verification
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'profiles';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PROFILES TABLE FIXED!';
    RAISE NOTICE '📊 Total columns: %', column_count;
    RAISE NOTICE '🚀 You can now try the onboarding flow again.';
    RAISE NOTICE '';
END $$;