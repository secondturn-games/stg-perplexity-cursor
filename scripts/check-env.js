#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Run this script to validate your environment variables before deployment
 */

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const optionalVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'BGG_API_URL',
  'MAKECOMMERCE_API_KEY',
  'MAKECOMMERCE_API_URL',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'NEXT_PUBLIC_POSTHOG_HOST',
  'RESEND_API_KEY',
  'MAX_FILE_SIZE',
  'ALLOWED_FILE_TYPES',
];

console.log('🔍 Checking environment variables...\n');

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
    hasErrors = true;
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ⚠️  ${varName}: not set (optional)`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Some required environment variables are missing!');
  console.log('Please set the missing variables and try again.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
  console.log('Your application should work correctly.');
}

console.log('\n💡 To set environment variables in Vercel:');
console.log('1. Go to your Vercel project dashboard');
console.log('2. Click Settings > Environment Variables');
console.log('3. Add the required variables');
console.log('4. Redeploy your application');