# Extended Game Metadata Migration

## Overview
This migration adds support for storing extended BoardGameGeek (BGG) metadata including:
- **Alternate Names**: Different names for the game in various languages and markets
- **Editions/Versions**: Different editions, regional versions, and implementations (includes language info)
- **Language Dependence**: Poll data about how language-dependent the game is

It also removes the `languages` column since language information is stored in the editions data.

## Migration Files
1. `20250930_add_game_extended_metadata.sql` - Adds extended metadata columns
2. `20250930_remove_languages_column.sql` - Removes languages column (languages are in editions)

## Database Changes

### New Columns Added to `games` Table

| Column Name | Type | Default | Description |
|------------|------|---------|-------------|
| `alternate_names` | JSONB | `[]` | Array of alternate game names from BGG |
| `editions` | JSONB | `[]` | Array of game editions/versions |
| `language_dependence` | JSONB | `NULL` | Language dependence poll results |

### Column Removed from `games` Table

| Column Name | Reason for Removal |
|------------|-------------------|
| `languages` | Language information is now stored in the `editions` JSONB field for each version/edition |

### JSONB Structure Documentation

#### `alternate_names` Structure
```json
[
  {
    "type": "primary" | "alternate",
    "sortindex": 1,
    "value": "Game Name"
  }
]
```

#### `editions` Structure
```json
[
  {
    "id": "685632",
    "name": "Nucleum: Polish Edition",
    "type": "implementation",
    "yearpublished": 2023,
    "publishers": ["Publisher Name"],
    "languages": ["Polish"],
    "thumbnail": "https://...",
    "bggLink": "https://boardgamegeek.com/boardgameversion/685632",
    "productCode": "ABC-123"
  }
]
```

#### `language_dependence` Structure
```json
{
  "description": "No necessary in-game text",
  "percentage": 89
}
```

### Indexes Created
- `idx_games_alternate_names` - GIN index on `alternate_names`
- `idx_games_editions` - GIN index on `editions`
- `idx_games_language_dependence` - GIN index on `language_dependence`

## How to Run the Migration

### Option 1: Supabase Dashboard
1. Log in to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `20250930_add_game_extended_metadata.sql`
4. Run the migration

### Option 2: Supabase CLI
```bash
# Make sure you're in the project root
cd /workspace

# Run the migration
supabase db push

# Or if you have the CLI configured:
supabase migration up
```

### Option 3: Direct SQL
```bash
# Connect to your database and run:
psql YOUR_DATABASE_URL < supabase/migrations/20250930_add_game_extended_metadata.sql
```

## Verify Migration Success

After running the migration, verify it worked:

```sql
-- Check that columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name IN ('alternate_names', 'editions', 'language_dependence');

-- Check that indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'games'
  AND indexname LIKE 'idx_games_%';

-- Check column comments
SELECT col_description('games'::regclass, ordinal_position) as description
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name IN ('alternate_names', 'editions', 'language_dependence');
```

Expected output:
```
       column_name       | data_type | column_default
-------------------------+-----------+----------------
 alternate_names         | jsonb     | '[]'::jsonb
 editions                | jsonb     | '[]'::jsonb
 language_dependence     | jsonb     | NULL
```

## Code Changes Included

The following files have been updated to support the new fields:

### 1. `/lib/bgg/BGGService.ts`
- ✅ `convertDbGameToBGGDetails()` - Now reads new fields from database
- ✅ Removed warning about missing data from DB cache

### 2. `/lib/repositories/SupabaseGameRepository.ts`
- ✅ `upsert()` - Inserts new fields when creating games
- ✅ `upsert()` - Updates new fields when updating games

### 3. `/types/database.types.ts`
- ✅ Added `alternate_names`, `editions`, `language_dependence` to `Row` type
- ✅ Added fields to `Insert` type
- ✅ Added fields to `Update` type

## Testing the Fix

### Step 1: Run the Migration
Follow the instructions above to run the SQL migration.

### Step 2: Clear Existing Cache
For games already in your database (like game ID 396790), you need to clear them so they get fresh data:

```sql
-- Delete specific game to force re-fetch
DELETE FROM games WHERE bgg_id = 396790;

-- OR clear all games to start fresh
TRUNCATE TABLE games CASCADE;
```

### Step 3: Test in the UI
1. Navigate to `/test-bgg`
2. Click "Clear Cache" button (to clear memory cache)
3. Enter game ID: `396790`
4. Click "Get Details"
5. Check the sections:
   - ✅ **Alternate Names** - Should show: "Nukleum", "Нуклеум", "ニュークレウム", etc.
   - ✅ **Game Versions** - Should show different editions with publishers and languages
   - ✅ **Language Dependence** - Should show: "Level 1: No necessary in-game text (89%)"

### Step 4: Verify Database Storage
```sql
-- Check that data is stored
SELECT 
  title,
  bgg_id,
  jsonb_array_length(alternate_names) as alt_names_count,
  jsonb_array_length(editions) as editions_count,
  language_dependence->>'description' as lang_desc,
  language_dependence->>'percentage' as lang_pct
FROM games 
WHERE bgg_id = 396790;
```

Expected output:
```
  title   | bgg_id | alt_names_count | editions_count |        lang_desc         | lang_pct
----------+--------+-----------------+----------------+--------------------------+----------
 Nucleum  | 396790 |               7 |              1 | No necessary in-game text| 89
```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_games_alternate_names;
DROP INDEX IF EXISTS idx_games_editions;
DROP INDEX IF EXISTS idx_games_language_dependence;

-- Remove columns
ALTER TABLE games DROP COLUMN IF EXISTS alternate_names;
ALTER TABLE games DROP COLUMN IF EXISTS editions;
ALTER TABLE games DROP COLUMN IF EXISTS language_dependence;
```

**Note:** After rollback, you'll also need to revert the code changes in the files mentioned above.

## Performance Considerations

- **JSONB columns** are efficiently stored and indexed in PostgreSQL
- **GIN indexes** enable fast searches within JSONB data
- **Default values** (`[]` for arrays) prevent null checks in application code
- **Storage impact**: Approximately 1-5KB per game (depending on number of editions)

## Future Enhancements

Consider adding these queries for advanced features:

```sql
-- Search games by alternate name
SELECT * FROM games 
WHERE alternate_names @> '[{"value": "Wingspan"}]'::jsonb;

-- Find games with many editions
SELECT title, jsonb_array_length(editions) as edition_count
FROM games
WHERE jsonb_array_length(editions) > 5
ORDER BY edition_count DESC;

-- Find games with low language dependence (high percentage for "No necessary text")
SELECT title, 
       language_dependence->>'description' as lang_dep,
       language_dependence->>'percentage' as lang_pct
FROM games
WHERE language_dependence->>'description' = 'No necessary in-game text'
ORDER BY bgg_rating DESC;
```

## Support

If you encounter any issues:
1. Check the Supabase logs for migration errors
2. Verify your PostgreSQL version supports JSONB (9.4+)
3. Ensure you have proper database permissions
4. Check the server console logs when fetching game details

## Related Files
- Migration: `/supabase/migrations/20250930_add_game_extended_metadata.sql`
- Service: `/lib/bgg/BGGService.ts`
- Repository: `/lib/repositories/SupabaseGameRepository.ts`
- Types: `/types/database.types.ts`