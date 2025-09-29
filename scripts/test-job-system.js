#!/usr/bin/env node

/**
 * Test Job System Script
 * Tests the job processing system with sample jobs
 */

const { getJobWorker } = require('../lib/jobs/JobWorker');

async function testJobSystem() {
  console.log('🧪 Testing Job System...');

  try {
    const jobWorker = getJobWorker();
    const jobQueue = jobWorker.getJobQueue();

    // Start the worker
    await jobWorker.start();
    console.log('✅ Job worker started');

    // Test 1: Single game sync
    console.log('\n📝 Test 1: Single game sync');
    const syncJobId = await jobQueue.enqueue(
      'bgg_sync',
      {
        gameId: '13', // Catan
        forceUpdate: false,
      },
      'normal'
    );
    console.log(`✅ Enqueued sync job: ${syncJobId}`);

    // Test 2: Bulk sync
    console.log('\n📝 Test 2: Bulk sync');
    const bulkJobId = await jobQueue.enqueue(
      'bgg_bulk_sync',
      {
        gameIds: ['13', '9209', '266192'], // Catan, Ticket to Ride, Wingspan
        batchSize: 2,
        delayBetweenBatches: 1000,
      },
      'high'
    );
    console.log(`✅ Enqueued bulk sync job: ${bulkJobId}`);

    // Test 3: Cache warmup
    console.log('\n📝 Test 3: Cache warmup');
    const cacheJobId = await jobQueue.enqueue(
      'cache_warmup',
      {
        popularGames: true,
        limit: 5,
      },
      'low'
    );
    console.log(`✅ Enqueued cache warmup job: ${cacheJobId}`);

    // Monitor job status
    console.log('\n📊 Monitoring job status...');
    let completedJobs = 0;
    const totalJobs = 3;

    const checkStatus = async () => {
      const stats = await jobQueue.getStats();
      console.log(
        `📈 Job stats: ${stats.pending} pending, ${stats.processing} processing, ${stats.completed} completed, ${stats.failed} failed`
      );

      if (stats.completed >= totalJobs) {
        console.log('✅ All test jobs completed!');
        await jobWorker.stop();
        process.exit(0);
      }
    };

    // Check status every 5 seconds
    const statusInterval = setInterval(checkStatus, 5000);

    // Stop monitoring after 5 minutes
    setTimeout(
      () => {
        clearInterval(statusInterval);
        console.log('⏰ Test timeout reached');
        jobWorker.stop();
        process.exit(0);
      },
      5 * 60 * 1000
    );
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Stopping test...');
  const jobWorker = getJobWorker();
  await jobWorker.stop();
  process.exit(0);
});

testJobSystem().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
