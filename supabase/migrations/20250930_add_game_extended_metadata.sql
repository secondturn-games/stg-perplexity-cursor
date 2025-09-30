-- Migration: Add Extended Game Metadata Fields
-- Description: Adds columns for storing alternate names, editions/versions, and language dependence from BGG API
-- Date: 2025-09-30

-- Add JSONB columns for extended BGG metadata
ALTER TABLE games
ADD COLUMN IF NOT EXISTS alternate_names JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS editions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS language_dependence JSONB DEFAULT NULL;

-- Add comments to document the structure
COMMENT ON COLUMN games.alternate_names IS 'Array of alternate names from BGG API. Structure: [{ type: "primary"|"alternate", sortindex: number, value: string }]';
COMMENT ON COLUMN games.editions IS 'Array of game editions/versions from BGG API. Structure: [{ id: string, name: string, type: string, yearpublished: number, publishers: string[], languages: string[], thumbnail: string, bggLink: string, productCode: string }]';
COMMENT ON COLUMN games.language_dependence IS 'Language dependence poll data from BGG API. Structure: { level: number, description: string, votes: number, totalVotes: number, percentage: number }';

-- Create indexes for better query performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_games_alternate_names ON games USING GIN (alternate_names);
CREATE INDEX IF NOT EXISTS idx_games_editions ON games USING GIN (editions);
CREATE INDEX IF NOT EXISTS idx_games_language_dependence ON games USING GIN (language_dependence);

-- Add a comment on the table to document the update
COMMENT ON TABLE games IS 'Board games catalog with full BGG metadata including alternate names, editions, and language dependence (added 2025-09-30)';