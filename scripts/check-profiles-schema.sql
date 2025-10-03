-- =============================================================================
-- CHECK PROFILES TABLE SCHEMA
-- =============================================================================
-- This script shows exactly what columns exist in the profiles table
-- =============================================================================

-- Show all columns in the profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Count total columns
SELECT COUNT(*) as total_columns FROM information_schema.columns WHERE table_name = 'profiles';

-- Check for specific columns that should exist
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
    RAISE NOTICE '🔍 Checking for required columns...';
    
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
            RAISE NOTICE '❌ Missing: %', col;
        ELSE
            RAISE NOTICE '✅ Found: %', col;
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '📋 Missing columns: %', array_to_string(missing_columns, ', ');
        RAISE NOTICE '💡 Run the fix script to add these columns.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '🎉 All required columns are present!';
    END IF;
END $$;