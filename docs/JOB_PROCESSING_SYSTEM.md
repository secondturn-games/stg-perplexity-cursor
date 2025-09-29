# Background Job Processing System

This document describes the background job processing system implemented for the Second Turn Games marketplace to handle heavy BGG operations without blocking user requests.

## Overview

The job processing system provides:

- **Asynchronous Processing**: Heavy operations run in the background
- **Rate Limit Compliance**: Respects BGG's 2 requests/second limit
- **Retry Logic**: Automatic retry with exponential backoff
- **Job Persistence**: Jobs are stored in Supabase for reliability
- **Monitoring**: Comprehensive job status tracking and statistics
- **Scheduling**: Recurring job support with cron-like syntax

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Routes    │───▶│   Job Queue     │───▶│   Processors    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Supabase      │
                       │   (Persistence) │
                       └─────────────────┘
```

## Components

### 1. Core System

- **`JobQueue`**: Main job processing engine
- **`JobWorker`**: Background worker process manager
- **`SupabaseJobRepository`**: Database persistence layer

### 2. Job Processors

- **`BGGSyncProcessor`**: Individual game synchronization
- **`BGGBulkSyncProcessor`**: Batch game synchronization
- **`CacheWarmupProcessor`**: Cache warming for popular games

### 3. Scheduling

- **`JobScheduler`**: Recurring job management
- **Cron-like syntax**: For scheduling recurring tasks

### 4. API Endpoints

- **`POST /api/jobs/enqueue`**: Enqueue new jobs
- **`GET /api/jobs/status/[id]`**: Check job status
- **`GET /api/jobs/admin`**: Job statistics and management

## Job Types

### BGG Sync Jobs

#### `bgg_sync`

Synchronizes a single game with BGG.

**Payload:**

```json
{
  "gameId": "13",
  "forceUpdate": false,
  "includeDetails": true
}
```

#### `bgg_bulk_sync`

Synchronizes multiple games in batches.

**Payload:**

```json
{
  "gameIds": ["13", "9209", "266192"],
  "batchSize": 3,
  "delayBetweenBatches": 2000
}
```

### Cache Jobs

#### `cache_warmup`

Warms up cache with popular games and search queries.

**Payload:**

```json
{
  "popularGames": true,
  "limit": 50,
  "gameIds": ["13", "9209"],
  "searchQueries": ["catan", "wingspan"]
}
```

## Usage Examples

### 1. Enqueue a Single Game Sync

```typescript
import { getJobWorker } from '@/lib/jobs';

const jobWorker = getJobWorker();
const jobId = await jobWorker.getJobQueue().enqueue(
  'bgg_sync',
  {
    gameId: '13',
    forceUpdate: false,
  },
  'normal'
);
```

### 2. Enqueue Bulk Sync

```typescript
const jobId = await jobWorker.getJobQueue().enqueue(
  'bgg_bulk_sync',
  {
    gameIds: ['13', '9209', '266192'],
    batchSize: 3,
    delayBetweenBatches: 2000,
  },
  'high'
);
```

### 3. Schedule Recurring Jobs

```typescript
const scheduler = jobWorker.getJobScheduler();

// Daily cache warmup at 2 AM
await scheduler.scheduleRecurring('0 2 * * *', {
  type: 'cache_warmup',
  payload: { popularGames: true, limit: 50 },
  priority: 'low',
});
```

### 4. Check Job Status

```typescript
const job = await jobWorker.getJobQueue().getJob(jobId);
console.log(`Job ${jobId} status: ${job.status}`);
```

## API Usage

### Enqueue Job

```bash
curl -X POST http://localhost:3000/api/jobs/enqueue \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bgg_sync",
    "payload": {"gameId": "13"},
    "priority": "normal"
  }'
```

### Check Job Status

```bash
curl http://localhost:3000/api/jobs/status/{jobId}
```

### Get Job Statistics

```bash
curl http://localhost:3000/api/jobs/admin?details=true
```

## Database Schema

The job system uses two main tables:

### `jobs` Table

- `id`: UUID primary key
- `type`: Job type (bgg_sync, cache_warmup, etc.)
- `payload`: Job-specific data (JSONB)
- `status`: Current status (pending, processing, completed, failed)
- `priority`: Job priority (low, normal, high, critical)
- `metadata`: Job metadata including retry counts
- `result`: Job execution result
- `error`: Error message if failed

### `job_history` Table

- Audit log for job status changes
- Useful for debugging and monitoring

## Configuration

### Job Queue Config

```typescript
const config = {
  maxConcurrentJobs: 3, // Max jobs running simultaneously
  retryDelay: 1000, // Base retry delay (ms)
  maxRetries: 3, // Max retry attempts
  cleanupInterval: 3600000, // Cleanup interval (ms)
  jobTimeout: 300000, // Job timeout (ms)
};
```

### Rate Limiting

The system respects BGG's rate limits:

- **2 requests/second** maximum
- **Batch processing** with delays between batches
- **Exponential backoff** for retries

## Monitoring

### Job Statistics

```typescript
const stats = await jobQueue.getStats();
console.log(`Total: ${stats.total}, Pending: ${stats.pending}`);
```

### Worker Status

```typescript
const status = jobWorker.getStatus();
console.log(`Running: ${status.running}, Active: ${status.activeJobs}`);
```

## Development

### Start Job Worker

```bash
# Development
npm run dev:jobs

# Production
node scripts/start-job-worker.js
```

### Test Job System

```bash
node scripts/test-job-system.js
```

### Database Migration

```sql
-- Run in Supabase SQL Editor
\i scripts/migrations/003_job_processing_system.sql
```

## Production Deployment

### 1. Database Setup

Run the migration script in your Supabase project:

```sql
\i scripts/migrations/003_job_processing_system.sql
```

### 2. Environment Variables

Ensure these are set in your production environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Start Job Worker

Deploy the job worker as a separate process:

```bash
# Using PM2
pm2 start scripts/start-job-worker.js --name "job-worker"

# Using Docker
docker run -d --name job-worker your-app:latest node scripts/start-job-worker.js
```

### 4. Monitoring

Set up monitoring for:

- Job queue length
- Failed job rate
- Processing time
- Worker health

## Troubleshooting

### Common Issues

1. **Jobs not processing**: Check if job worker is running
2. **High failure rate**: Check BGG API status and rate limits
3. **Slow processing**: Adjust batch sizes and delays
4. **Memory issues**: Reduce maxConcurrentJobs

### Debug Commands

```bash
# Check job statistics
curl http://localhost:3000/api/jobs/admin

# Check specific job
curl http://localhost:3000/api/jobs/status/{jobId}

# Retry failed jobs
curl -X POST http://localhost:3000/api/jobs/admin \
  -d '{"action": "retry_failed_jobs"}'
```

## Performance Considerations

### Optimization Tips

1. **Batch Size**: Adjust based on BGG rate limits
2. **Concurrent Jobs**: Balance between speed and resource usage
3. **Cache Strategy**: Use cache warmup for popular games
4. **Retry Logic**: Tune retry delays for your use case

### Monitoring Metrics

- Job completion rate
- Average processing time
- Queue length
- Error rate
- Cache hit rate

## Future Enhancements

1. **Priority Queues**: Separate queues for different priorities
2. **Job Dependencies**: Chain jobs together
3. **Dead Letter Queue**: Handle permanently failed jobs
4. **Job Scheduling UI**: Web interface for job management
5. **Advanced Retry Strategies**: Custom retry logic per job type
6. **Job Analytics**: Detailed performance metrics
7. **Auto-scaling**: Dynamic worker scaling based on queue length
