-- =============================================================================
-- BGG INTEGRATION MIGRATION
-- =============================================================================
-- Adds BGG-specific columns and indexes to the games table
-- =============================================================================

-- Add BGG-specific columns to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS bgg_id INTEGER UNIQUE,
ADD COLUMN IF NOT EXISTS bgg_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS bgg_rank INTEGER,
ADD COLUMN IF NOT EXISTS weight_rating DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS age_rating INTEGER CHECK (age_rating > 0),
ADD COLUMN IF NOT EXISTS last_bgg_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS designers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS artists TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS publishers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- Update existing columns with better defaults
ALTER TABLE public.games 
ALTER COLUMN categories SET DEFAULT '{}',
ALTER COLUMN mechanics SET DEFAULT '{}';

-- Create indexes for BGG data
CREATE INDEX IF NOT EXISTS idx_games_bgg_id ON public.games(bgg_id);
CREATE INDEX IF NOT EXISTS idx_games_bgg_rating ON public.games(bgg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_games_bgg_rank ON public.games(bgg_rank ASC) WHERE bgg_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_last_bgg_sync ON public.games(last_bgg_sync DESC);
CREATE INDEX IF NOT EXISTS idx_games_designers ON public.games USING GIN(designers);
CREATE INDEX IF NOT EXISTS idx_games_artists ON public.games USING GIN(artists);
CREATE INDEX IF NOT EXISTS idx_games_publishers ON public.games USING GIN(publishers);
CREATE INDEX IF NOT EXISTS idx_games_categories ON public.games USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_games_mechanics ON public.games USING GIN(mechanics);

-- Create function to update last_bgg_sync timestamp
CREATE OR REPLACE FUNCTION update_last_bgg_sync()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_bgg_sync = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_bgg_sync
DROP TRIGGER IF EXISTS update_games_last_bgg_sync ON public.games;
CREATE TRIGGER update_games_last_bgg_sync
    BEFORE UPDATE ON public.games
    FOR EACH ROW
    WHEN (OLD.bgg_rating IS DISTINCT FROM NEW.bgg_rating 
          OR OLD.bgg_rank IS DISTINCT FROM NEW.bgg_rank
          OR OLD.weight_rating IS DISTINCT FROM NEW.weight_rating)
    EXECUTE FUNCTION update_last_bgg_sync();

-- Create function to calculate weight rating from BGG data
CREATE OR REPLACE FUNCTION calculate_weight_rating(
    bgg_rating DECIMAL,
    bgg_rank INTEGER,
    min_players INTEGER,
    max_players INTEGER,
    playing_time INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
    weight DECIMAL(2,1) := 0.0;
BEGIN
    -- Base weight from BGG rating (0-5 scale)
    IF bgg_rating IS NOT NULL THEN
        weight := weight + (bgg_rating / 2.0); -- Convert 0-10 to 0-5
    END IF;
    
    -- Adjust for player count complexity
    IF min_players IS NOT NULL AND max_players IS NOT NULL THEN
        IF max_players - min_players > 4 THEN
            weight := weight + 0.5; -- More complex with wider player range
        END IF;
    END IF;
    
    -- Adjust for playing time
    IF playing_time IS NOT NULL THEN
        IF playing_time > 120 THEN
            weight := weight + 0.5; -- Longer games are more complex
        ELSIF playing_time > 60 THEN
            weight := weight + 0.2;
        END IF;
    END IF;
    
    -- Ensure weight is between 0 and 5
    weight := GREATEST(0.0, LEAST(5.0, weight));
    
    RETURN weight;
END;
$$ LANGUAGE plpgsql;

-- Create function to update weight rating for all games
CREATE OR REPLACE FUNCTION update_all_weight_ratings()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    game_record RECORD;
BEGIN
    FOR game_record IN 
        SELECT id, bgg_rating, bgg_rank, min_players, max_players, playing_time
        FROM public.games
        WHERE bgg_rating IS NOT NULL
    LOOP
        UPDATE public.games
        SET weight_rating = calculate_weight_rating(
            game_record.bgg_rating,
            game_record.bgg_rank,
            game_record.min_players,
            game_record.max_players,
            game_record.playing_time
        )
        WHERE id = game_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get games by BGG rank range
CREATE OR REPLACE FUNCTION get_games_by_bgg_rank(
    min_rank INTEGER DEFAULT 1,
    max_rank INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    bgg_rank INTEGER,
    bgg_rating DECIMAL,
    weight_rating DECIMAL,
    min_players INTEGER,
    max_players INTEGER,
    playing_time INTEGER,
    year_published INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.bgg_rank,
        g.bgg_rating,
        g.weight_rating,
        g.min_players,
        g.max_players,
        g.playing_time,
        g.year_published
    FROM public.games g
    WHERE g.bgg_rank BETWEEN min_rank AND max_rank
    ORDER BY g.bgg_rank ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to search games by designer
CREATE OR REPLACE FUNCTION search_games_by_designer(designer_name TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    designers TEXT[],
    bgg_rating DECIMAL,
    bgg_rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.designers,
        g.bgg_rating,
        g.bgg_rank
    FROM public.games g
    WHERE g.designers @> ARRAY[designer_name]
    ORDER BY g.bgg_rank ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Create function to get games by category
CREATE OR REPLACE FUNCTION get_games_by_category(category_name TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    categories TEXT[],
    bgg_rating DECIMAL,
    bgg_rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.categories,
        g.bgg_rating,
        g.bgg_rank
    FROM public.games g
    WHERE g.categories @> ARRAY[category_name]
    ORDER BY g.bgg_rating DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Create function to get games by mechanic
CREATE OR REPLACE FUNCTION get_games_by_mechanic(mechanic_name TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    mechanics TEXT[],
    bgg_rating DECIMAL,
    bgg_rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.mechanics,
        g.bgg_rating,
        g.bgg_rank
    FROM public.games g
    WHERE g.mechanics @> ARRAY[mechanic_name]
    ORDER BY g.bgg_rating DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Create function to get popular games (top 100 by BGG rank)
CREATE OR REPLACE FUNCTION get_popular_games(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    title TEXT,
    bgg_rank INTEGER,
    bgg_rating DECIMAL,
    weight_rating DECIMAL,
    min_players INTEGER,
    max_players INTEGER,
    playing_time INTEGER,
    year_published INTEGER,
    thumbnail_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.bgg_rank,
        g.bgg_rating,
        g.weight_rating,
        g.min_players,
        g.max_players,
        g.playing_time,
        g.year_published,
        g.thumbnail_url
    FROM public.games g
    WHERE g.bgg_rank IS NOT NULL
    ORDER BY g.bgg_rank ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get recently synced games
CREATE OR REPLACE FUNCTION get_recently_synced_games(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
    id UUID,
    title TEXT,
    bgg_rating DECIMAL,
    bgg_rank INTEGER,
    last_bgg_sync TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.bgg_rating,
        g.bgg_rank,
        g.last_bgg_sync
    FROM public.games g
    WHERE g.last_bgg_sync > NOW() - INTERVAL '1 hour' * hours_back
    ORDER BY g.last_bgg_sync DESC;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for games table
DROP POLICY IF EXISTS "Games are viewable by everyone" ON public.games;
CREATE POLICY "Games are viewable by everyone" ON public.games
    FOR SELECT USING (true);

-- Allow authenticated users to insert games (for BGG sync)
DROP POLICY IF EXISTS "Authenticated users can insert games" ON public.games;
CREATE POLICY "Authenticated users can insert games" ON public.games
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update games (for BGG sync)
DROP POLICY IF EXISTS "Authenticated users can update games" ON public.games;
CREATE POLICY "Authenticated users can update games" ON public.games
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create storage bucket for game images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('game-images', 'game-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for game images
DROP POLICY IF EXISTS "Game images are publicly viewable" ON storage.objects;
CREATE POLICY "Game images are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'game-images');

DROP POLICY IF EXISTS "Authenticated users can upload game images" ON storage.objects;
CREATE POLICY "Authenticated users can upload game images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'game-images' AND
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Authenticated users can update game images" ON storage.objects;
CREATE POLICY "Authenticated users can update game images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'game-images' AND
        auth.role() = 'authenticated'
    );

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ BGG Integration migration completed successfully!';
    RAISE NOTICE '🎮 Added BGG-specific columns to games table';
    RAISE NOTICE '📊 Created indexes for BGG data queries';
    RAISE NOTICE '🔧 Added helper functions for BGG data';
    RAISE NOTICE '🖼️ Created storage bucket for game images';
    RAISE NOTICE '🚀 BGG integration is ready to use!';
END $$;
