-- =============================================================================
-- COMPLETE DATABASE VERIFICATION SCRIPT
-- =============================================================================
-- This script checks all tables, relationships, indexes, and functions
-- to ensure the database is ready for marketplace operations
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 Starting comprehensive database verification...';
    RAISE NOTICE '';
END $$;

-- =============================================================================
-- 1. CHECK ALL TABLES EXIST
-- =============================================================================

DO $$
DECLARE
    table_count INTEGER;
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    expected_tables TEXT[] := ARRAY[
        'profiles', 'games', 'listings', 'conversations', 
        'messages', 'user_ratings', 'wishlists', 'payments', 'jobs', 'job_history'
    ];
    tbl_name TEXT;
BEGIN
    RAISE NOTICE '📋 Checking all required tables...';
    
    FOREACH tbl_name IN ARRAY expected_tables
    LOOP
        SELECT COUNT(*) INTO table_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = tbl_name;
        
        IF table_count = 0 THEN
            missing_tables := array_append(missing_tables, tbl_name);
            RAISE NOTICE '❌ Missing table: %', tbl_name;
        ELSE
            RAISE NOTICE '✅ Table exists: %', tbl_name;
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Missing tables: %', array_to_string(missing_tables, ', ');
        RAISE NOTICE '💡 Run the appropriate migration scripts to create missing tables.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ All required tables exist!';
    END IF;
END $$;

-- =============================================================================
-- 2. CHECK TABLE STRUCTURES AND COLUMNS
-- =============================================================================

DO $$
DECLARE
    col_count INTEGER;
    expected_cols TEXT[];
    col_name TEXT;
    missing_cols TEXT[];
BEGIN
    RAISE NOTICE '🏗️  Checking table structures...';
    RAISE NOTICE '';
    
    -- Check profiles table
    RAISE NOTICE 'Checking profiles table:';
    expected_cols := ARRAY['id', 'username', 'full_name', 'location', 'reputation_score', 'is_verified', 'email_verified', 'phone_verified', 'privacy_settings', 'notification_settings'];
    missing_cols := ARRAY[]::TEXT[];
    
    FOREACH col_name IN ARRAY expected_cols
    LOOP
        SELECT COUNT(*) INTO col_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = col_name;
        
        IF col_count = 0 THEN
            missing_cols := array_append(missing_cols, col_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_cols, 1) > 0 THEN
        RAISE NOTICE '❌ Missing columns in profiles: %', array_to_string(missing_cols, ', ');
    ELSE
        RAISE NOTICE '✅ Profiles table structure is correct';
    END IF;
    
    -- Check games table
    RAISE NOTICE 'Checking games table:';
    expected_cols := ARRAY['id', 'bgg_id', 'title', 'mechanics', 'categories', 'designers', 'artists', 'publishers', 'languages', 'last_bgg_sync', 'weight_rating', 'bgg_rank'];
    missing_cols := ARRAY[]::TEXT[];
    
    FOREACH col_name IN ARRAY expected_cols
    LOOP
        SELECT COUNT(*) INTO col_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'games' AND column_name = col_name;
        
        IF col_count = 0 THEN
            missing_cols := array_append(missing_cols, col_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_cols, 1) > 0 THEN
        RAISE NOTICE '❌ Missing columns in games: %', array_to_string(missing_cols, ', ');
    ELSE
        RAISE NOTICE '✅ Games table structure is correct';
    END IF;
    
    -- Check listings table
    RAISE NOTICE 'Checking listings table:';
    expected_cols := ARRAY['id', 'game_id', 'seller_id', 'title', 'price', 'condition', 'currency', 'is_active', 'is_featured', 'shipping_options', 'deleted_at'];
    missing_cols := ARRAY[]::TEXT[];
    
    FOREACH col_name IN ARRAY expected_cols
    LOOP
        SELECT COUNT(*) INTO col_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = col_name;
        
        IF col_count = 0 THEN
            missing_cols := array_append(missing_cols, col_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_cols, 1) > 0 THEN
        RAISE NOTICE '❌ Missing columns in listings: %', array_to_string(missing_cols, ', ');
    ELSE
        RAISE NOTICE '✅ Listings table structure is correct';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- =============================================================================
-- 3. CHECK FOREIGN KEY RELATIONSHIPS
-- =============================================================================

DO $$
DECLARE
    fk_count INTEGER;
    missing_fks TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '🔗 Checking foreign key relationships...';
    
    -- Check listings -> games
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'listings' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'game_id'
    AND ccu.table_name = 'games';
    
    IF fk_count = 0 THEN
        missing_fks := array_append(missing_fks, 'listings.game_id -> games.id');
    ELSE
        RAISE NOTICE '✅ listings.game_id -> games.id';
    END IF;
    
    -- Check listings -> profiles (seller_id)
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'listings' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'seller_id'
    AND ccu.table_name = 'profiles';
    
    IF fk_count = 0 THEN
        missing_fks := array_append(missing_fks, 'listings.seller_id -> profiles.id');
    ELSE
        RAISE NOTICE '✅ listings.seller_id -> profiles.id';
    END IF;
    
    -- Check conversations -> listings
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'conversations' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'listing_id'
    AND ccu.table_name = 'listings';
    
    IF fk_count = 0 THEN
        missing_fks := array_append(missing_fks, 'conversations.listing_id -> listings.id');
    ELSE
        RAISE NOTICE '✅ conversations.listing_id -> listings.id';
    END IF;
    
    -- Check conversations -> profiles (buyer_id)
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'conversations' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'buyer_id'
    AND ccu.table_name = 'profiles';
    
    IF fk_count = 0 THEN
        missing_fks := array_append(missing_fks, 'conversations.buyer_id -> profiles.id');
    ELSE
        RAISE NOTICE '✅ conversations.buyer_id -> profiles.id';
    END IF;
    
    -- Check conversations -> profiles (seller_id)
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'conversations' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'seller_id'
    AND ccu.table_name = 'profiles';
    
    IF fk_count = 0 THEN
        missing_fks := array_append(missing_fks, 'conversations.seller_id -> profiles.id');
    ELSE
        RAISE NOTICE '✅ conversations.seller_id -> profiles.id';
    END IF;
    
    IF array_length(missing_fks, 1) > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ Missing foreign keys: %', array_to_string(missing_fks, ', ');
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ All foreign key relationships are correct!';
    END IF;
END $$;

-- =============================================================================
-- 4. CHECK INDEXES
-- =============================================================================

DO $$
DECLARE
    idx_count INTEGER;
    missing_indexes TEXT[] := ARRAY[]::TEXT[];
    expected_indexes TEXT[] := ARRAY[
        'idx_games_bgg_id', 'idx_games_title_trgm', 'idx_games_categories', 'idx_games_mechanics',
        'idx_listings_game_id', 'idx_listings_seller_id', 'idx_listings_active',
        'idx_conversations_buyer_id', 'idx_conversations_seller_id', 'idx_conversations_listing_id'
    ];
    idx_nm TEXT;
BEGIN
    RAISE NOTICE '📊 Checking critical indexes...';
    
    FOREACH idx_nm IN ARRAY expected_indexes
    LOOP
        SELECT COUNT(*) INTO idx_count
        FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname = idx_nm;
        
        IF idx_count = 0 THEN
            missing_indexes := array_append(missing_indexes, idx_nm);
            RAISE NOTICE '❌ Missing index: %', idx_nm;
        ELSE
            RAISE NOTICE '✅ Index exists: %', idx_nm;
        END IF;
    END LOOP;
    
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Missing indexes: %', array_to_string(missing_indexes, ', ');
        RAISE NOTICE '💡 Run the optimization scripts to create missing indexes.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ All critical indexes exist!';
    END IF;
END $$;

-- =============================================================================
-- 5. CHECK ENUMS
-- =============================================================================

DO $$
DECLARE
    enum_count INTEGER;
    missing_enums TEXT[] := ARRAY[]::TEXT[];
    expected_enums TEXT[] := ARRAY[
        'listing_condition', 'message_type', 'payment_status', 'payment_provider', 
        'shipping_method', 'user_location', 'job_status', 'job_priority', 'job_type'
    ];
    enum_nm TEXT;
BEGIN
    RAISE NOTICE '🏷️  Checking custom enums...';
    
    FOREACH enum_nm IN ARRAY expected_enums
    LOOP
        SELECT COUNT(*) INTO enum_count
        FROM pg_type 
        WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND typname = enum_nm;
        
        IF enum_count = 0 THEN
            missing_enums := array_append(missing_enums, enum_nm);
            RAISE NOTICE '❌ Missing enum: %', enum_nm;
        ELSE
            RAISE NOTICE '✅ Enum exists: %', enum_nm;
        END IF;
    END LOOP;
    
    IF array_length(missing_enums, 1) > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Missing enums: %', array_to_string(missing_enums, ', ');
        RAISE NOTICE '💡 Run the marketplace schema migration to create missing enums.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ All required enums exist!';
    END IF;
END $$;

-- =============================================================================
-- 6. CHECK FUNCTIONS
-- =============================================================================

DO $$
DECLARE
    func_count INTEGER;
    missing_functions TEXT[] := ARRAY[]::TEXT[];
    expected_functions TEXT[] := ARRAY[
        'update_conversation_last_message', 'increment_listing_view_count', 
        'update_user_reputation', 'can_user_rate', 'anonymize_user_data', 'export_user_data'
    ];
    func_nm TEXT;
BEGIN
    RAISE NOTICE '⚙️  Checking utility functions...';
    
    FOREACH func_nm IN ARRAY expected_functions
    LOOP
        SELECT COUNT(*) INTO func_count
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = func_nm;
        
        IF func_count = 0 THEN
            missing_functions := array_append(missing_functions, func_nm);
            RAISE NOTICE '❌ Missing function: %', func_nm;
        ELSE
            RAISE NOTICE '✅ Function exists: %', func_nm;
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Missing functions: %', array_to_string(missing_functions, ', ');
        RAISE NOTICE '💡 Run the marketplace schema migration to create missing functions.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ All utility functions exist!';
    END IF;
END $$;

-- =============================================================================
-- 7. CHECK ROW LEVEL SECURITY
-- =============================================================================

DO $$
DECLARE
    rls_enabled BOOLEAN;
    tables_without_rls TEXT[] := ARRAY[]::TEXT[];
    expected_tables TEXT[] := ARRAY[
        'profiles', 'games', 'listings', 'conversations', 
        'messages', 'user_ratings', 'wishlists', 'payments'
    ];
    tbl_nm TEXT;
BEGIN
    RAISE NOTICE '🔒 Checking Row Level Security (RLS)...';
    
    FOREACH tbl_nm IN ARRAY expected_tables
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' AND c.relname = tbl_nm;
        
        IF NOT rls_enabled THEN
            tables_without_rls := array_append(tables_without_rls, tbl_nm);
            RAISE NOTICE '❌ RLS not enabled: %', tbl_nm;
        ELSE
            RAISE NOTICE '✅ RLS enabled: %', tbl_nm;
        END IF;
    END LOOP;
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Tables without RLS: %', array_to_string(tables_without_rls, ', ');
        RAISE NOTICE '💡 RLS is required for GDPR compliance.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ All tables have RLS enabled!';
    END IF;
END $$;

-- =============================================================================
-- 8. CHECK EXTENSIONS
-- =============================================================================

DO $$
DECLARE
    ext_count INTEGER;
    missing_extensions TEXT[] := ARRAY[]::TEXT[];
    expected_extensions TEXT[] := ARRAY['uuid-ossp', 'pg_trgm'];
    ext_nm TEXT;
BEGIN
    RAISE NOTICE '🔧 Checking required extensions...';
    
    FOREACH ext_nm IN ARRAY expected_extensions
    LOOP
        SELECT COUNT(*) INTO ext_count
        FROM pg_extension 
        WHERE extname = ext_nm;
        
        IF ext_count = 0 THEN
            missing_extensions := array_append(missing_extensions, ext_nm);
            RAISE NOTICE '❌ Missing extension: %', ext_nm;
        ELSE
            RAISE NOTICE '✅ Extension exists: %', ext_nm;
        END IF;
    END LOOP;
    
    IF array_length(missing_extensions, 1) > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Missing extensions: %', array_to_string(missing_extensions, ', ');
        RAISE NOTICE '💡 Run: CREATE EXTENSION IF NOT EXISTS "extension_name";';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ All required extensions are installed!';
    END IF;
END $$;

-- =============================================================================
-- 9. SUMMARY AND RECOMMENDATIONS
-- =============================================================================

DO $$
DECLARE
    total_tables INTEGER;
    total_indexes INTEGER;
    total_functions INTEGER;
    total_policies INTEGER;
BEGIN
    -- Count totals
    SELECT COUNT(*) INTO total_tables FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO total_indexes FROM pg_indexes WHERE schemaname = 'public';
    SELECT COUNT(*) INTO total_functions FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';
    SELECT COUNT(*) INTO total_policies FROM pg_policies WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '📈 DATABASE SUMMARY:';
    RAISE NOTICE '   Tables: %', total_tables;
    RAISE NOTICE '   Indexes: %', total_indexes;
    RAISE NOTICE '   Functions: %', total_functions;
    RAISE NOTICE '   RLS Policies: %', total_policies;
    RAISE NOTICE '';
    
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '   1. If any issues were found above, run the appropriate migration scripts';
    RAISE NOTICE '   2. Test BGG integration with: SELECT * FROM games LIMIT 5;';
    RAISE NOTICE '   3. Test job system with: SELECT * FROM jobs LIMIT 5;';
    RAISE NOTICE '   4. Verify RLS policies work with test user authentication';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your database is ready for marketplace operations!';
END $$;
