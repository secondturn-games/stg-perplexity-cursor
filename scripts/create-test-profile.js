#!/usr/bin/env node

/**
 * Create Test Profile
 *
 * This script creates a profile for testing purposes when the database trigger
 * isn't set up yet.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function createTestProfile() {
  console.log('🔧 Creating test profile...');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get the current user (you need to be logged in)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ No authenticated user found. Please log in first.');
      process.exit(1);
    }

    console.log(`👤 Creating profile for user: ${user.email}`);

    // Create profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username:
          user.user_metadata?.username || `user_${user.id.substring(0, 8)}`,
        full_name: user.user_metadata?.full_name || 'Test User',
        privacy_settings: {
          show_email: false,
          show_phone: false,
          show_location: true,
        },
        notification_settings: {
          messages: true,
          offers: true,
          listings: true,
          marketing: user.user_metadata?.marketing_consent || false,
        },
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.log('✅ Profile already exists for this user');
        return;
      }
      console.error('❌ Error creating profile:', error);
      process.exit(1);
    }

    console.log('✅ Profile created successfully!');
    console.log('   - Username:', data.username);
    console.log('   - Full Name:', data.full_name);
  } catch (error) {
    console.error('❌ Failed to create profile:', error);
    process.exit(1);
  }
}

// Run the script
createTestProfile();
