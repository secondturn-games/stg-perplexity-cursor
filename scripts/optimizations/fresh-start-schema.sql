-- Fresh Start: Clean BGG-Optimized Schema
-- This script drops and recreates the games table with the correct schema
-- ONLY run this if your games table is empty!

-- =============================================================================
-- WARNING: THIS WILL DROP THE GAMES TABLE
-- =============================================================================
-- Only proceed if you're sure your games table is empty!

-- =============================================================================
-- STEP 1: Drop existing games table and related objects
-- =============================================================================

-- Drop any existing indexes on games table
DROP INDEX IF EXISTS idx_games_bgg_id;
DROP INDEX IF EXISTS idx_games_title_trgm;
DROP INDEX IF EXISTS idx_games_categories;
DROP INDEX IF EXISTS idx_games_mechanics;
DROP INDEX IF EXISTS idx_games_mechanisms;
DROP INDEX IF EXISTS idx_games_year;
DROP INDEX IF EXISTS idx_games_players;
DROP INDEX IF EXISTS idx_games_rating;
DROP INDEX IF EXISTS idx_games_stale_priority;
DROP INDEX IF EXISTS idx_games_sync_timestamp;
DROP INDEX IF EXISTS idx_games_player_range;
DROP INDEX IF EXISTS idx_games_rating_rank;
DROP INDEX IF EXISTS idx_games_year_range;
DROP INDEX IF EXISTS idx_games_weight;
DROP INDEX IF EXISTS idx_games_designers;
DROP INDEX IF EXISTS idx_games_publishers;
DROP INDEX IF EXISTS idx_games_artists;
DROP INDEX IF EXISTS idx_games_languages;
DROP INDEX IF EXISTS idx_games_popular;
DROP INDEX IF EXISTS idx_games_recent;
DROP INDEX IF EXISTS idx_games_classic;
DROP INDEX IF EXISTS idx_games_needs_sync;

-- Drop any existing views
DROP VIEW IF EXISTS games_performance_stats;
DROP VIEW IF EXISTS games_cache_stats;

-- Drop the games table
DROP TABLE IF EXISTS public.games CASCADE;

-- =============================================================================
-- STEP 2: Create clean games table with proper schema
-- =============================================================================

CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bgg_id INTEGER UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    year_published INTEGER CHECK (year_published >= 1800 AND year_published <= EXTRACT(YEAR FROM NOW()) + 5),
    min_players INTEGER CHECK (min_players > 0),
    max_players INTEGER CHECK (max_players > 0),
    playing_time INTEGER CHECK (playing_time > 0), -- in minutes
    complexity_rating DECIMAL(2,1) CHECK (complexity_rating >= 1.0 AND complexity_rating <= 5.0),
    image_url TEXT,
    thumbnail_url TEXT,
    categories TEXT[] DEFAULT '{}',
    mechanics TEXT[] DEFAULT '{}',  -- Using 'mechanics' (not 'mechanisms')
    designers TEXT[] DEFAULT '{}',  -- Using plural form
    artists TEXT[] DEFAULT '{}',    -- Using plural form
    publishers TEXT[] DEFAULT '{}', -- Using plural form
    languages TEXT[] DEFAULT '{}',
    age_rating INTEGER CHECK (age_rating > 0),
    bgg_rating DECIMAL(3,2),
    bgg_rank INTEGER,
    weight_rating DECIMAL(2,1) CHECK (weight_rating >= 1.0 AND weight_rating <= 5.0),
    last_bgg_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 3: Create performance indexes (safe versions)
-- =============================================================================

-- Basic indexes
CREATE INDEX idx_games_bgg_id ON public.games(bgg_id);
CREATE INDEX idx_games_title_trgm ON public.games USING gin(title gin_trgm_ops);
CREATE INDEX idx_games_categories ON public.games USING gin(categories);
CREATE INDEX idx_games_mechanics ON public.games USING gin(mechanics);
CREATE INDEX idx_games_year ON public.games(year_published);
CREATE INDEX idx_games_players ON public.games(min_players, max_players);
CREATE INDEX idx_games_rating ON public.games(bgg_rating DESC);

-- Composite indexes for stale games queries
CREATE INDEX idx_games_stale_priority 
ON public.games(bgg_rating DESC, last_bgg_sync ASC NULLS FIRST);

-- Index for sync timestamp queries
CREATE INDEX idx_games_sync_timestamp 
ON public.games(last_bgg_sync DESC NULLS LAST);

-- Composite index for player count range queries
CREATE INDEX idx_games_player_range 
ON public.games(min_players, max_players) 
WHERE min_players IS NOT NULL AND max_players IS NOT NULL;

-- Index for rating-based filtering and sorting
CREATE INDEX idx_games_rating_rank 
ON public.games(bgg_rating DESC, bgg_rank ASC) 
WHERE bgg_rating IS NOT NULL AND bgg_rank IS NOT NULL;

-- Index for year-based queries
CREATE INDEX idx_games_year_range 
ON public.games(year_published DESC) 
WHERE year_published IS NOT NULL;

-- Index for weight/complexity queries
CREATE INDEX idx_games_weight 
ON public.games(weight_rating DESC) 
WHERE weight_rating IS NOT NULL;

-- Indexes for array fields
CREATE INDEX idx_games_designers ON public.games USING gin(designers);
CREATE INDEX idx_games_publishers ON public.games USING gin(publishers);
CREATE INDEX idx_games_artists ON public.games USING gin(artists);
CREATE INDEX idx_games_languages ON public.games USING gin(languages);

-- Partial indexes for common queries (using fixed years to avoid IMMUTABLE issues)
CREATE INDEX idx_games_popular 
ON public.games(bgg_rating DESC, bgg_rank ASC) 
WHERE bgg_rating >= 7.0 AND bgg_rank IS NOT NULL AND bgg_rank <= 1000;

-- Use fixed year 2020 for recent games (will need manual updates)
CREATE INDEX idx_games_recent 
ON public.games(year_published DESC) 
WHERE year_published >= 2020;

-- Use fixed year 2004 for classic games (will need manual updates)  
CREATE INDEX idx_games_classic 
ON public.games(year_published ASC) 
WHERE year_published <= 2004;

-- Index for games that need sync (simplified without dynamic time)
CREATE INDEX idx_games_needs_sync 
ON public.games(updated_at ASC) 
WHERE last_bgg_sync IS NULL;

-- =============================================================================
-- STEP 4: Create performance monitoring views
-- =============================================================================

-- Create a view for monitoring query performance
CREATE VIEW games_performance_stats AS
SELECT 
    COUNT(*) as total_games,
    COUNT(last_bgg_sync) as synced_games,
    COUNT(*) - COUNT(last_bgg_sync) as unsynced_games,
    CASE WHEN COUNT(*) > 0 THEN AVG(bgg_rating) ELSE NULL END as avg_rating,
    CASE WHEN COUNT(*) > 0 THEN MIN(bgg_rating) ELSE NULL END as min_rating,
    CASE WHEN COUNT(*) > 0 THEN MAX(bgg_rating) ELSE NULL END as max_rating,
    CASE WHEN COUNT(*) > 0 THEN AVG(weight_rating) ELSE NULL END as avg_weight,
    COUNT(CASE WHEN bgg_rank IS NOT NULL AND bgg_rank <= 100 THEN 1 END) as top_100_games,
    COUNT(CASE WHEN year_published >= 2020 THEN 1 END) as recent_games,
    COUNT(CASE WHEN last_bgg_sync IS NULL THEN 1 END) as stale_games
FROM public.games;

-- Create a view for cache hit rate monitoring
CREATE VIEW games_cache_stats AS
SELECT 
    COUNT(*) as total_games,
    COUNT(CASE WHEN last_bgg_sync IS NOT NULL THEN 1 END) as cached_games,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            ROUND(
                COUNT(CASE WHEN last_bgg_sync IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
                2
            )
        ELSE 0.00 
    END as cache_hit_rate,
    COUNT(CASE WHEN last_bgg_sync IS NOT NULL THEN 1 END) as fresh_games,
    COUNT(CASE WHEN last_bgg_sync IS NULL THEN 1 END) as very_stale_games
FROM public.games;

-- =============================================================================
-- STEP 5: Update table statistics
-- =============================================================================

ANALYZE public.games;

-- =============================================================================
-- STEP 6: Verify the setup
-- =============================================================================

-- Show the new schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'games' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show created indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'games' 
AND indexname LIKE 'idx_games_%'
ORDER BY indexname;

-- Show created views
SELECT 
    viewname
FROM pg_views 
WHERE viewname LIKE 'games_%_stats'
ORDER BY viewname;

-- Test the views
SELECT 'Performance Stats:' as info;
SELECT * FROM games_performance_stats;

SELECT 'Cache Stats:' as info;
SELECT * FROM games_cache_stats;
