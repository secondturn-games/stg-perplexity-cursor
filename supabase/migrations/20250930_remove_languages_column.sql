-- Migration: Remove languages column from games table
-- Description: Languages are available in editions/versions data, not needed as a separate column
-- Date: 2025-09-30

-- Remove the languages column (language info is in editions JSONB)
ALTER TABLE games DROP COLUMN IF EXISTS languages;

-- Add comment to document the change
COMMENT ON TABLE games IS 'Board games catalog with full BGG metadata. Language information is stored in the editions field (added 2025-09-30)';