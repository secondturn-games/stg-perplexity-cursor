-- BGG Performance Optimization Indexes
-- Additional indexes for better query performance

-- =============================================================================
-- EXISTING INDEXES (from marketplace-schema.sql)
-- =============================================================================
-- These indexes already exist:
-- CREATE INDEX IF NOT EXISTS idx_games_bgg_id ON public.games(bgg_id);
-- CREATE INDEX IF NOT EXISTS idx_games_title_trgm ON public.games USING gin(title gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_games_categories ON public.games USING gin(categories);
-- CREATE INDEX IF NOT EXISTS idx_games_mechanics ON public.games USING gin(mechanics);
-- CREATE INDEX IF NOT EXISTS idx_games_year ON public.games(year_published);
-- CREATE INDEX IF NOT EXISTS idx_games_players ON public.games(min_players, max_players);
-- CREATE INDEX IF NOT EXISTS idx_games_rating ON public.games(bgg_rating DESC);

-- =============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =============================================================================

-- Composite index for stale games queries (last_bgg_sync + rating)
-- Only create if last_bgg_sync column exists
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

-- =============================================================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- =============================================================================

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

-- Index for games that need sync (no sync or old sync)
-- Only create if last_bgg_sync column exists
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
-- STATISTICS AND ANALYTICS
-- =============================================================================

-- Update table statistics for better query planning
ANALYZE public.games;

-- =============================================================================
-- QUERY OPTIMIZATION HINTS
-- =============================================================================

-- Example optimized queries that will use these indexes:

-- 1. Get stale games with priority ordering (only if last_bgg_sync exists):
-- SELECT * FROM games 
-- WHERE last_bgg_sync IS NULL OR last_bgg_sync < NOW() - INTERVAL '24 hours'
-- ORDER BY bgg_rating DESC, last_bgg_sync ASC NULLS FIRST
-- LIMIT 100;

-- 2. Search games by title with full-text search:
-- SELECT * FROM games 
-- WHERE to_tsvector('english', title) @@ plainto_tsquery('english', 'catan')
-- ORDER BY bgg_rating DESC
-- LIMIT 20;

-- 3. Filter games by category and players:
-- SELECT * FROM games 
-- WHERE categories && ARRAY['Strategy', 'Family']
-- AND min_players <= 4 AND max_players >= 4
-- ORDER BY bgg_rating DESC
-- LIMIT 50;

-- 4. Get popular games:
-- SELECT * FROM games 
-- WHERE bgg_rating >= 7.0 AND bgg_rank IS NOT NULL AND bgg_rank <= 1000
-- ORDER BY bgg_rating DESC, bgg_rank ASC
-- LIMIT 100;

-- 5. Get recent games:
-- SELECT * FROM games 
-- WHERE year_published >= EXTRACT(YEAR FROM NOW()) - 5
-- ORDER BY year_published DESC, bgg_rating DESC
-- LIMIT 50;

-- =============================================================================
-- PERFORMANCE MONITORING
-- =============================================================================

-- Create a view for monitoring query performance
-- Only create if last_bgg_sync column exists
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
-- Only create if last_bgg_sync column exists
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
