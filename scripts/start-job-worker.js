#!/usr/bin/env node

/**
 * Start Job Worker Script
 * Starts the background job processing worker
 */

const { startJobWorker } = require('../lib/jobs/JobWorker');

async function main() {
  console.log('🚀 Starting Second Turn Games Job Worker...');

  try {
    await startJobWorker();
    console.log('✅ Job worker started successfully');

    // Keep the process running
    process.stdin.resume();
  } catch (error) {
    console.error('❌ Failed to start job worker:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down job worker...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down job worker...');
  process.exit(0);
});

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
