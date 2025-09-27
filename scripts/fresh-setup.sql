-- Fresh Database Setup Script
-- This script combines reset + setup for a completely fresh database
-- Run this if you want to start over completely

-- First, run the reset script
\i scripts/reset-database.sql

-- Then run the setup script  
\i scripts/setup-database.sql

-- Finally run the RLS policies
\i lib/supabase/rls-policies.sql

-- You should now have a completely fresh database with all tables, triggers, and policies
