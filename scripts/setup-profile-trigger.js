#!/usr/bin/env node

/**
 * Setup Profile Creation Trigger
 *
 * This script sets up a database trigger that automatically creates
 * a profile when a new user signs up, solving the RLS policy issue.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function setupProfileTrigger() {
  console.log('🔧 Setting up profile creation trigger...');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-profile-trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error setting up trigger:', error);
      process.exit(1);
    }

    console.log('✅ Profile creation trigger setup successfully!');
    console.log('   - New users will automatically get a profile created');
    console.log('   - RLS policy issues should be resolved');
  } catch (error) {
    console.error('❌ Failed to setup trigger:', error);
    process.exit(1);
  }
}

// Run the setup
setupProfileTrigger();
