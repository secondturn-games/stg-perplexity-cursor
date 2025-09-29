-- BGG Optimizations Setup Script for Supabase
-- Run this script in your Supabase SQL editor

-- =============================================================================
-- STEP 1: Fix Games Table Schema
-- =============================================================================

-- Add missing columns to games table

-- Add last_bgg_sync column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'last_bgg_sync'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ADD COLUMN last_bgg_sync TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_bgg_sync column to games table';
    ELSE
        RAISE NOTICE 'last_bgg_sync column already exists in games table';
    END IF;
END $$;

-- Add weight_rating column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'weight_rating'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ADD COLUMN weight_rating DECIMAL(2,1) CHECK (weight_rating >= 1.0 AND weight_rating <= 5.0);
        RAISE NOTICE 'Added weight_rating column to games table';
    ELSE
        RAISE NOTICE 'weight_rating column already exists in games table';
    END IF;
END $$;

-- Add complexity_rating column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'complexity_rating'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ADD COLUMN complexity_rating DECIMAL(2,1) CHECK (complexity_rating >= 1.0 AND complexity_rating <= 5.0);
        RAISE NOTICE 'Added complexity_rating column to games table';
    ELSE
        RAISE NOTICE 'complexity_rating column already exists in games table';
    END IF;
END $$;

-- Add bgg_rank column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'bgg_rank'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ADD COLUMN bgg_rank INTEGER;
        RAISE NOTICE 'Added bgg_rank column to games table';
    ELSE
        RAISE NOTICE 'bgg_rank column already exists in games table';
    END IF;
END $$;

-- Add age_rating column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'age_rating'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ADD COLUMN age_rating INTEGER CHECK (age_rating > 0);
        RAISE NOTICE 'Added age_rating column to games table';
    ELSE
        RAISE NOTICE 'age_rating column already exists in games table';
    END IF;
END $$;

-- Add designers column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'designers'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ADD COLUMN designers TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added designers column to games table';
    ELSE
        RAISE NOTICE 'designers column already exists in games table';
    END IF;
END $$;

-- Add artists column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'artists'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ADD COLUMN artists TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added artists column to games table';
    ELSE
        RAISE NOTICE 'artists column already exists in games table';
    END IF;
END $$;

-- Add publishers column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'publishers'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ADD COLUMN publishers TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added publishers column to games table';
    ELSE
        RAISE NOTICE 'publishers column already exists in games table';
    END IF;
END $$;

-- Add languages column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'languages'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ADD COLUMN languages TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added languages column to games table';
    ELSE
        RAISE NOTICE 'languages column already exists in games table';
    END IF;
END $$;

-- Update existing columns with defaults
ALTER TABLE public.games 
ALTER COLUMN categories SET DEFAULT '{}';

-- Handle both mechanics and mechanisms columns
DO $$
BEGIN
    -- Check if mechanics column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'mechanics'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ALTER COLUMN mechanics SET DEFAULT '{}';
        RAISE NOTICE 'Updated mechanics column default';
    END IF;
    
    -- Check if mechanisms column exists (older schema)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'mechanisms'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.games 
        ALTER COLUMN mechanisms SET DEFAULT '{}';
        RAISE NOTICE 'Updated mechanisms column default';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Add Performance Indexes
-- =============================================================================

-- Composite index for stale games queries (only if last_bgg_sync exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'last_bgg_sync'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_games_stale_priority 
        ON public.games(bgg_rating DESC, last_bgg_sync ASC NULLS FIRST);
        
        CREATE INDEX IF NOT EXISTS idx_games_sync_timestamp 
        ON public.games(last_bgg_sync DESC NULLS LAST);
        
        RAISE NOTICE 'Created sync-related indexes';
    ELSE
        RAISE NOTICE 'Skipping sync-related indexes - last_bgg_sync column does not exist';
    END IF;
END $$;

-- Composite index for player count range queries
CREATE INDEX IF NOT EXISTS idx_games_player_range 
ON public.games(min_players, max_players) 
WHERE min_players IS NOT NULL AND max_players IS NOT NULL;

-- Index for rating-based filtering and sorting
CREATE INDEX IF NOT EXISTS idx_games_rating_rank 
ON public.games(bgg_rating DESC, bgg_rank ASC) 
WHERE bgg_rating IS NOT NULL AND bgg_rank IS NOT NULL;

-- Index for year-based queries
CREATE INDEX IF NOT EXISTS idx_games_year_range 
ON public.games(year_published DESC) 
WHERE year_published IS NOT NULL;

-- Index for weight/complexity queries
CREATE INDEX IF NOT EXISTS idx_games_weight 
ON public.games(weight_rating DESC) 
WHERE weight_rating IS NOT NULL;

-- Index for designers (for designer-based searches)
CREATE INDEX IF NOT EXISTS idx_games_designers 
ON public.games USING gin(designers);

-- Index for publishers (for publisher-based searches)
CREATE INDEX IF NOT EXISTS idx_games_publishers 
ON public.games USING gin(publishers);

-- Index for artists (for artist-based searches)
CREATE INDEX IF NOT EXISTS idx_games_artists 
ON public.games USING gin(artists);

-- Index for languages
CREATE INDEX IF NOT EXISTS idx_games_languages 
ON public.games USING gin(languages);

-- Index for mechanics/mechanisms (handle both column names)
DO $$
BEGIN
    -- Check if mechanics column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'mechanics'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_games_mechanics 
        ON public.games USING gin(mechanics);
        RAISE NOTICE 'Created mechanics index';
    END IF;
    
    -- Check if mechanisms column exists (older schema)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'mechanisms'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_games_mechanisms 
        ON public.games USING gin(mechanisms);
        RAISE NOTICE 'Created mechanisms index';
    END IF;
END $$;

-- Index for popular games (high rating, low rank)
CREATE INDEX IF NOT EXISTS idx_games_popular 
ON public.games(bgg_rating DESC, bgg_rank ASC) 
WHERE bgg_rating >= 7.0 AND bgg_rank IS NOT NULL AND bgg_rank <= 1000;

-- Index for recent games
CREATE INDEX IF NOT EXISTS idx_games_recent 
ON public.games(year_published DESC) 
WHERE year_published >= EXTRACT(YEAR FROM NOW()) - 5;

-- Index for classic games
CREATE INDEX IF NOT EXISTS idx_games_classic 
ON public.games(year_published ASC) 
WHERE year_published <= EXTRACT(YEAR FROM NOW()) - 20;

-- Index for games that need sync (only if last_bgg_sync exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'last_bgg_sync'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_games_needs_sync 
        ON public.games(updated_at ASC) 
        WHERE last_bgg_sync IS NULL OR last_bgg_sync < NOW() - INTERVAL '24 hours';
        
        RAISE NOTICE 'Created needs-sync index';
    ELSE
        RAISE NOTICE 'Skipping needs-sync index - last_bgg_sync column does not exist';
    END IF;
END $$;

-- =============================================================================
-- STEP 3: Create Performance Monitoring Views
-- =============================================================================

-- Create a view for monitoring query performance
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'last_bgg_sync'
        AND table_schema = 'public'
    ) THEN
        CREATE OR REPLACE VIEW games_performance_stats AS
        SELECT 
            COUNT(*) as total_games,
            COUNT(last_bgg_sync) as synced_games,
            COUNT(*) - COUNT(last_bgg_sync) as unsynced_games,
            AVG(bgg_rating) as avg_rating,
            MIN(bgg_rating) as min_rating,
            MAX(bgg_rating) as max_rating,
            AVG(weight_rating) as avg_weight,
            COUNT(CASE WHEN bgg_rank IS NOT NULL AND bgg_rank <= 100 THEN 1 END) as top_100_games,
            COUNT(CASE WHEN year_published >= EXTRACT(YEAR FROM NOW()) - 5 THEN 1 END) as recent_games,
            COUNT(CASE WHEN last_bgg_sync IS NULL OR last_bgg_sync < NOW() - INTERVAL '24 hours' THEN 1 END) as stale_games
        FROM public.games;
        
        RAISE NOTICE 'Created games_performance_stats view';
    ELSE
        -- Create simplified view without sync columns
        CREATE OR REPLACE VIEW games_performance_stats AS
        SELECT 
            COUNT(*) as total_games,
            0 as synced_games,
            COUNT(*) as unsynced_games,
            AVG(bgg_rating) as avg_rating,
            MIN(bgg_rating) as min_rating,
            MAX(bgg_rating) as max_rating,
            AVG(weight_rating) as avg_weight,
            COUNT(CASE WHEN bgg_rank IS NOT NULL AND bgg_rank <= 100 THEN 1 END) as top_100_games,
            COUNT(CASE WHEN year_published >= EXTRACT(YEAR FROM NOW()) - 5 THEN 1 END) as recent_games,
            COUNT(*) as stale_games
        FROM public.games;
        
        RAISE NOTICE 'Created simplified games_performance_stats view (last_bgg_sync column missing)';
    END IF;
END $$;

-- Create a view for cache hit rate monitoring
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'last_bgg_sync'
        AND table_schema = 'public'
    ) THEN
        CREATE OR REPLACE VIEW games_cache_stats AS
        SELECT 
            COUNT(*) as total_games,
            COUNT(CASE WHEN last_bgg_sync IS NOT NULL THEN 1 END) as cached_games,
            ROUND(
                COUNT(CASE WHEN last_bgg_sync IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
                2
            ) as cache_hit_rate,
            COUNT(CASE WHEN last_bgg_sync > NOW() - INTERVAL '24 hours' THEN 1 END) as fresh_games,
            COUNT(CASE WHEN last_bgg_sync < NOW() - INTERVAL '7 days' THEN 1 END) as very_stale_games
        FROM public.games;
        
        RAISE NOTICE 'Created games_cache_stats view';
    ELSE
        -- Create simplified view without sync columns
        CREATE OR REPLACE VIEW games_cache_stats AS
        SELECT 
            COUNT(*) as total_games,
            0 as cached_games,
            0.0 as cache_hit_rate,
            0 as fresh_games,
            COUNT(*) as very_stale_games
        FROM public.games;
        
        RAISE NOTICE 'Created simplified games_cache_stats view (last_bgg_sync column missing)';
    END IF;
END $$;

-- =============================================================================
-- STEP 4: Verify Setup
-- =============================================================================

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

-- Show current games table schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'games' 
AND table_schema = 'public'
ORDER BY ordinal_position;
