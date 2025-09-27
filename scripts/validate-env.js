#!/usr/bin/env node

/**
 * Environment validation script
 * Run this script to validate all required environment variables before starting the application
 * Usage: node scripts/validate-env.js
 */

const { validateEnvironment } = require('../lib/env.ts');

console.log('🔍 Validating environment variables...');

try {
  validateEnvironment();
  console.log('✅ All environment variables are valid!');
  process.exit(0);
} catch (error) {
  console.error('❌ Environment validation failed:');
  console.error(error.message);
  process.exit(1);
}
