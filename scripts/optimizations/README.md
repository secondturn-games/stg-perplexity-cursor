# BGG Database Optimizations Setup

This directory contains scripts to fix your database schema and add performance optimizations for the BGG service.

## 🚨 The Problem

You're getting this error:

```
ERROR: 42703: column "last_bgg_sync" does not exist
```

This happens because your database was created with an older schema that doesn't have the `last_bgg_sync` column needed for BGG optimizations.

## 🔧 The Solution

### Option 1: Run the Complete Setup (Recommended)

Run this single script in your Supabase SQL editor:

```sql
\i scripts/optimizations/run-optimizations.sql
```

This will:

1. ✅ Add missing columns to your `games` table
2. ✅ Create performance indexes
3. ✅ Set up monitoring views
4. ✅ Verify everything worked

### Option 2: Run Scripts Individually

If you prefer to run them separately:

1. **Fix the schema first**:

   ```sql
   \i scripts/optimizations/fix-games-schema.sql
   ```

2. **Add performance indexes**:
   ```sql
   \i scripts/optimizations/database-indexes.sql
   ```

## 📊 What Gets Added

### Missing Columns Added to `games` Table:

- `last_bgg_sync` - Timestamp of last BGG API sync
- `weight_rating` - BGG weight/complexity rating
- `complexity_rating` - Game complexity rating
- `bgg_rank` - BGG overall rank
- `age_rating` - Minimum recommended age
- `designers` - Array of game designers
- `artists` - Array of game artists
- `publishers` - Array of game publishers
- `languages` - Array of supported languages

### Performance Indexes Added:

- Composite indexes for stale game queries
- GIN indexes for array fields (categories, mechanics)
- Partial indexes for popular/recent games
- Full-text search optimization

### Monitoring Views Added:

- `games_performance_stats` - Overall performance metrics
- `games_cache_stats` - Cache hit rate monitoring

## ✅ Verification

After running the scripts, you should see output like:

```
NOTICE:  Added last_bgg_sync column to games table
NOTICE:  Added weight_rating column to games table
NOTICE:  Created sync-related indexes
NOTICE:  Created games_performance_stats view
✅ last_bgg_sync column exists
✅ weight_rating column exists
✅ bgg_rank column exists
```

## 🔄 After Setup

Once the database is fixed, you can:

1. **Use the optimized BGG service**:

   ```typescript
   import { createBGGService } from '@/lib/bgg/BGGServiceFactory';
   const bggService = createBGGService('optimized');
   ```

2. **Monitor performance**:
   ```sql
   SELECT * FROM games_performance_stats;
   SELECT * FROM games_cache_stats;
   ```

## 🚨 Troubleshooting

### If you still get column errors:

- Make sure you ran the schema fix script first
- Check that the column was actually added:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'games' AND column_name = 'last_bgg_sync';
  ```

### If indexes fail to create:

- The scripts are designed to be safe and will skip missing columns
- Check the output messages for any warnings

### If you need to start over:

- The scripts use `IF NOT EXISTS` and `IF EXISTS` checks
- They're safe to run multiple times
- No data will be lost

## 📝 Notes

- All scripts are **safe to run multiple times**
- They use `IF NOT EXISTS` checks to avoid errors
- No existing data will be modified or lost
- The optimizations are **backward compatible**

## 🎯 Next Steps

After fixing the database:

1. Update your API endpoints to use the optimized service
2. Configure environment variables for optimizations
3. Monitor performance improvements
4. Enjoy faster BGG operations! 🚀
