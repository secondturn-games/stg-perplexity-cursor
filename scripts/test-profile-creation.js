/**
 * Test Profile Creation Script
 * 
 * This script tests the profile creation functionality to identify issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileCreation() {
  console.log('🧪 Testing profile creation functionality...\n');

  try {
    // Test 1: Check if profiles table exists and is accessible
    console.log('📋 Test 1: Checking profiles table access...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError) {
      console.error('❌ Cannot access profiles table:', profilesError.message);
      console.error('   Error code:', profilesError.code);
      console.error('   Error details:', profilesError.details);
      return;
    }
    console.log('✅ Profiles table is accessible\n');

    // Test 2: Check current user authentication
    console.log('📋 Test 2: Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication error:', authError.message);
      return;
    }

    if (!user) {
      console.log('⚠️  No authenticated user found');
      console.log('   This is expected if you run this script without being logged in');
      console.log('   The profile creation will be tested with a mock user ID\n');
    } else {
      console.log('✅ User authenticated:', user.email);
      console.log('   User ID:', user.id);
      console.log('   Email confirmed:', !!user.email_confirmed_at);
    }

    // Test 3: Check if user already has a profile
    if (user) {
      console.log('\n📋 Test 3: Checking existing profile...');
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error checking profile:', profileError.message);
        return;
      }

      if (existingProfile) {
        console.log('✅ User already has a profile:');
        console.log('   Username:', existingProfile.username);
        console.log('   Full name:', existingProfile.full_name);
        console.log('   Email verified:', existingProfile.email_verified);
        console.log('   Created at:', existingProfile.created_at);
      } else {
        console.log('ℹ️  User does not have a profile yet');
      }
    }

    // Test 4: Test profile creation with sample data
    console.log('\n📋 Test 4: Testing profile creation with sample data...');
    
    const testUserId = user?.id || '00000000-0000-0000-0000-000000000000';
    const testProfileData = {
      id: testUserId,
      username: 'test_user_' + Date.now(),
      full_name: 'Test User',
      bio: 'This is a test profile',
      location: 'EST',
      phone: '+37212345678',
      privacy_settings: {
        show_email: false,
        show_phone: false,
        show_location: true,
      },
      notification_settings: {
        messages: true,
        offers: true,
        listings: true,
        marketing: false,
      },
      email_verified: false,
      phone_verified: false,
      is_verified: false,
      reputation_score: 0,
      last_active_at: new Date().toISOString(),
    };

    console.log('📤 Attempting to create profile with data:', testProfileData);

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert(testProfileData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Profile creation failed:');
      console.error('   Error code:', createError.code);
      console.error('   Error message:', createError.message);
      console.error('   Error details:', createError.details);
      console.error('   Error hint:', createError.hint);
      
      // Provide specific guidance based on error
      if (createError.code === '23505') {
        console.error('\n💡 Solution: Username already exists. Try a different username.');
      } else if (createError.code === '23514') {
        console.error('\n💡 Solution: Check data constraints (username format, required fields, etc.)');
      } else if (createError.code === '42501') {
        console.error('\n💡 Solution: RLS policy issue. Check if user has permission to insert profiles.');
      } else if (createError.code === 'PGRST116') {
        console.error('\n💡 Solution: Profile already exists. Try updating instead of creating.');
      }
    } else {
      console.log('✅ Profile created successfully!');
      console.log('   Profile ID:', newProfile.id);
      console.log('   Username:', newProfile.username);
      
      // Clean up test profile
      console.log('\n🧹 Cleaning up test profile...');
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId);
      
      if (deleteError) {
        console.error('⚠️  Could not clean up test profile:', deleteError.message);
      } else {
        console.log('✅ Test profile cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }

  console.log('\n🏁 Profile creation test completed');
}

// Run the test
testProfileCreation().catch(console.error);