-- Fix Games Table Schema for BGG Optimizations
-- This script adds missing columns needed for BGG optimization features

-- =============================================================================
-- 1. ADD MISSING COLUMNS TO GAMES TABLE
-- =============================================================================

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

-- =============================================================================
-- 2. UPDATE EXISTING COLUMNS WITH DEFAULTS
-- =============================================================================

-- Update categories column default if needed
ALTER TABLE public.games 
ALTER COLUMN categories SET DEFAULT '{}';

-- Update mechanics column default if needed
ALTER TABLE public.games 
ALTER COLUMN mechanics SET DEFAULT '{}';

-- =============================================================================
-- 3. VERIFY SCHEMA
-- =============================================================================

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

-- =============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN public.games.last_bgg_sync IS 'Timestamp of last BGG API sync for this game';
COMMENT ON COLUMN public.games.weight_rating IS 'BGG weight/complexity rating (1.0-5.0)';
COMMENT ON COLUMN public.games.complexity_rating IS 'Game complexity rating (1.0-5.0)';
COMMENT ON COLUMN public.games.bgg_rank IS 'BGG overall rank';
COMMENT ON COLUMN public.games.age_rating IS 'Minimum recommended age';
COMMENT ON COLUMN public.games.designers IS 'Array of game designers';
COMMENT ON COLUMN public.games.artists IS 'Array of game artists';
COMMENT ON COLUMN public.games.publishers IS 'Array of game publishers';
COMMENT ON COLUMN public.games.languages IS 'Array of supported languages';

RAISE NOTICE 'Games table schema updated successfully for BGG optimizations';
