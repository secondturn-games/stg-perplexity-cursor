-- Check Table Status Before Fresh Start
-- Run this to verify your tables are empty before proceeding

-- =============================================================================
-- CHECK GAMES TABLE STATUS
-- =============================================================================

SELECT 
    'games' as table_name,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SAFE TO DROP - Table is empty'
        ELSE '⚠️  WARNING - Table has ' || COUNT(*) || ' rows. Consider backing up first!'
    END as safety_status
FROM public.games;

-- =============================================================================
-- CHECK RELATED TABLES
-- =============================================================================

-- Check listings table (references games)
SELECT 
    'listings' as table_name,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SAFE - No listings depend on games'
        ELSE '⚠️  WARNING - ' || COUNT(*) || ' listings reference games table'
    END as safety_status
FROM public.listings;

-- Check if there are any foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name = 'games' OR tc.table_name = 'games');

-- =============================================================================
-- CHECK CURRENT SCHEMA ISSUES
-- =============================================================================

-- Check what columns actually exist in games table
SELECT 
    'Current Schema Issues:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'games' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- RECOMMENDATION
-- =============================================================================

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM public.games) = 0 
             AND (SELECT COUNT(*) FROM public.listings) = 0
        THEN '✅ RECOMMENDATION: Safe to proceed with fresh start schema'
        ELSE '⚠️  RECOMMENDATION: Consider backing up data or fixing schema incrementally'
    END as recommendation;
