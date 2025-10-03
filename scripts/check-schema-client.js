/**
 * Client-Side Schema Checker
 * 
 * This script checks what columns are available in the profiles table
 * from the client side perspective
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking profiles table schema from client side...\n');

  // List of columns that should exist based on the onboarding flow
  const expectedColumns = [
    'id',
    'username', 
    'full_name',
    'bio',
    'avatar_url',
    'location',
    'phone',
    'reputation_score',
    'is_verified',
    'email_verified', 
    'phone_verified',
    'last_active_at',
    'privacy_settings',
    'notification_settings',
    'created_at',
    'updated_at'
  ];

  console.log('📋 Expected columns for onboarding:');
  expectedColumns.forEach(col => console.log(`  - ${col}`));
  console.log('');

  // Test each column by trying to select it
  const availableColumns = [];
  const missingColumns = [];

  for (const column of expectedColumns) {
    try {
      const { error } = await supabase
        .from('profiles')
        .select(column)
        .limit(0); // Just test the query, don't fetch data

      if (error) {
        if (error.code === '42703') {
          // Column doesn't exist
          missingColumns.push(column);
          console.log(`❌ Missing: ${column}`);
        } else {
          // Other error (might be RLS or other issue)
          console.log(`⚠️  ${column}: ${error.message} (${error.code})`);
          availableColumns.push(column);
        }
      } else {
        // Column exists
        availableColumns.push(column);
        console.log(`✅ Found: ${column}`);
      }
    } catch (err) {
      console.log(`❌ Error testing ${column}:`, err.message);
      missingColumns.push(column);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Available columns: ${availableColumns.length}`);
  console.log(`❌ Missing columns: ${missingColumns.length}`);

  if (missingColumns.length > 0) {
    console.log('\n❌ Missing columns:');
    missingColumns.forEach(col => console.log(`  - ${col}`));
    console.log('\n💡 Run the fix script to add these columns:');
    console.log('   scripts/fix-all-profile-columns.sql');
  } else {
    console.log('\n🎉 All required columns are available!');
  }

  // Test a sample profile creation with available columns
  console.log('\n🧪 Testing profile creation with available columns...');
  
  const testData = {
    id: '00000000-0000-0000-0000-000000000000',
    username: 'test_user_' + Date.now(),
    full_name: 'Test User',
  };

  // Only add columns that are available
  if (availableColumns.includes('bio')) testData.bio = 'Test bio';
  if (availableColumns.includes('location')) testData.location = 'EST';
  if (availableColumns.includes('phone')) testData.phone = '+37212345678';
  if (availableColumns.includes('privacy_settings')) {
    testData.privacy_settings = { show_email: false, show_phone: false, show_location: true };
  }
  if (availableColumns.includes('notification_settings')) {
    testData.notification_settings = { messages: true, offers: true, listings: true, marketing: false };
  }

  console.log('📤 Test data:', testData);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.log('❌ Profile creation test failed:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', error.details);
    } else {
      console.log('✅ Profile creation test successful!');
      
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', testData.id);
      console.log('🧹 Test data cleaned up');
    }
  } catch (err) {
    console.log('❌ Unexpected error during test:', err.message);
  }
}

// Run the check
checkSchema().catch(console.error);