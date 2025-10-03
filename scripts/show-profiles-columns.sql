-- =============================================================================
-- SHOW ALL PROFILES TABLE COLUMNS
-- =============================================================================
-- Simple script to show all columns in the profiles table
-- =============================================================================

-- Show all columns with details
SELECT 
    column_name as "Column Name",
    data_type as "Data Type",
    is_nullable as "Nullable",
    column_default as "Default Value",
    character_maximum_length as "Max Length"
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Show count
SELECT COUNT(*) as "Total Columns" FROM information_schema.columns WHERE table_name = 'profiles';

-- Check for specific columns that should exist for onboarding
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id') 
        THEN '✅' ELSE '❌' 
    END as "id",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') 
        THEN '✅' ELSE '❌' 
    END as "username",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') 
        THEN '✅' ELSE '❌' 
    END as "full_name",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') 
        THEN '✅' ELSE '❌' 
    END as "bio",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') 
        THEN '✅' ELSE '❌' 
    END as "location",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') 
        THEN '✅' ELSE '❌' 
    END as "phone",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'privacy_settings') 
        THEN '✅' ELSE '❌' 
    END as "privacy_settings",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_settings') 
        THEN '✅' ELSE '❌' 
    END as "notification_settings";