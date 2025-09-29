-- BGG Optimizations Setup Script
-- Run this script to set up all BGG optimizations

-- =============================================================================
-- STEP 1: Fix Games Table Schema
-- =============================================================================

\echo 'Step 1: Fixing games table schema...'
\i scripts/optimizations/fix-games-schema.sql

-- =============================================================================
-- STEP 2: Add Performance Indexes
-- =============================================================================

\echo 'Step 2: Adding performance indexes...'
\i scripts/optimizations/database-indexes.sql

-- =============================================================================
-- STEP 3: Verify Setup
-- =============================================================================

\echo 'Step 3: Verifying setup...'

-- Check if all required columns exist
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'games' AND column_name = 'last_bgg_sync'
        ) THEN '✅ last_bgg_sync column exists'
        ELSE '❌ last_bgg_sync column missing'
    END as last_bgg_sync_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'games' AND column_name = 'weight_rating'
        ) THEN '✅ weight_rating column exists'
        ELSE '❌ weight_rating column missing'
    END as weight_rating_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'games' AND column_name = 'bgg_rank'
        ) THEN '✅ bgg_rank column exists'
        ELSE '❌ bgg_rank column missing'
    END as bgg_rank_status;

-- Check if indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'games' 
AND indexname LIKE 'idx_games_%'
ORDER BY indexname;

-- Check if views were created
SELECT 
    viewname,
    definition
FROM pg_views 
WHERE viewname LIKE 'games_%_stats'
ORDER BY viewname;

\echo 'BGG optimizations setup complete!'
