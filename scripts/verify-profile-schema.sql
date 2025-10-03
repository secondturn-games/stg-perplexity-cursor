-- =============================================================================
-- PROFILE SCHEMA VERIFICATION SCRIPT
-- =============================================================================
-- This script checks if the profiles table schema matches the TypeScript types
-- =============================================================================

-- Check if profiles table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE '❌ PROFILES TABLE DOES NOT EXIST!';
        RAISE NOTICE 'Please run the marketplace schema setup first.';
        RETURN;
    ELSE
        RAISE NOTICE '✅ Profiles table exists';
    END IF;
END $$;

-- Check all required columns
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    required_columns TEXT[] := ARRAY[
        'id', 'username', 'full_name', 'bio', 'avatar_url', 'location', 'phone',
        'reputation_score', 'is_verified', 'email_verified', 'phone_verified',
        'last_active_at', 'privacy_settings', 'notification_settings',
        'created_at', 'updated_at'
    ];
    col TEXT;
BEGIN
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '❌ Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ All required columns exist';
    END IF;
END $$;

-- Check column constraints
DO $$
DECLARE
    constraint_info RECORD;
BEGIN
    RAISE NOTICE '📋 Column constraints:';
    
    FOR constraint_info IN
        SELECT 
            column_name,
            is_nullable,
            data_type,
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'profiles'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %: % % (default: %)', 
            constraint_info.column_name,
            constraint_info.data_type,
            CASE WHEN constraint_info.is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END,
            COALESCE(constraint_info.column_default, 'none');
    END LOOP;
END $$;

-- Check if trigger exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE '✅ Profile creation trigger exists';
    ELSE
        RAISE NOTICE '❌ Profile creation trigger MISSING!';
        RAISE NOTICE 'New users will not automatically get profiles created.';
    END IF;
END $$;

-- Check RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'profiles';
    
    IF policy_count > 0 THEN
        RAISE NOTICE '✅ RLS policies exist (% policies)', policy_count;
    ELSE
        RAISE NOTICE '❌ No RLS policies found for profiles table';
    END IF;
END $$;

-- Check existing profiles vs users
DO $$
DECLARE
    user_count INTEGER;
    profile_count INTEGER;
    missing_profiles INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    missing_profiles := user_count - profile_count;
    
    RAISE NOTICE '📊 User/Profile counts:';
    RAISE NOTICE '  Total users: %', user_count;
    RAISE NOTICE '  Total profiles: %', profile_count;
    RAISE NOTICE '  Missing profiles: %', missing_profiles;
    
    IF missing_profiles > 0 THEN
        RAISE NOTICE '❌ Some users are missing profiles!';
    ELSE
        RAISE NOTICE '✅ All users have profiles';
    END IF;
END $$;

-- Sample profile data check
DO $$
DECLARE
    sample_profile RECORD;
BEGIN
    SELECT * INTO sample_profile 
    FROM public.profiles 
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE '📄 Sample profile data:';
        RAISE NOTICE '  ID: %', sample_profile.id;
        RAISE NOTICE '  Username: %', sample_profile.username;
        RAISE NOTICE '  Full name: %', sample_profile.full_name;
        RAISE NOTICE '  Email verified: %', sample_profile.email_verified;
        RAISE NOTICE '  Privacy settings: %', sample_profile.privacy_settings;
        RAISE NOTICE '  Notification settings: %', sample_profile.notification_settings;
    ELSE
        RAISE NOTICE '❌ No profiles found in database';
    END IF;
END $$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 SCHEMA VERIFICATION COMPLETE';
    RAISE NOTICE 'If you see any ❌ errors above, please run:';
    RAISE NOTICE '  scripts/fix-profile-creation-complete.sql';
    RAISE NOTICE '';
END $$;