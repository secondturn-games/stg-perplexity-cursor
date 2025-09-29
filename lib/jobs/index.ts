/**
 * Job Processing System
 * Central export point for all job-related functionality
 */

// Core job system
export { JobQueue } from './JobQueue';
export {
  JobWorker,
  getJobWorker,
  startJobWorker,
  stopJobWorker,
} from './JobWorker';

// Repositories
export { SupabaseJobRepository } from './repositories/SupabaseJobRepository';

// Processors
export { BGGSyncProcessor } from './processors/BGGSyncProcessor';
export { BGGBulkSyncProcessor } from './processors/BGGBulkSyncProcessor';
export { CacheWarmupProcessor } from './processors/CacheWarmupProcessor';

// Scheduler
export { JobScheduler } from './scheduler/JobScheduler';

// Types
export type {
  Job,
  JobStatus,
  JobPriority,
  JobType,
  JobMetadata,
  JobPayload,
  JobQueueConfig,
  JobProcessor,
  JobScheduler as IJobScheduler,
  JobRepository,
  JobWorker as IJobWorker,
  BGGSyncJobPayload,
  BGGBulkSyncJobPayload,
  CacheWarmupJobPayload,
  UserCollectionSyncJobPayload,
  SearchPrefetchJobPayload,
  JobResult,
  BGGSyncJobResult,
  BGGBulkSyncJobResult,
  CacheWarmupJobResult,
  UserCollectionSyncJobResult,
  SearchPrefetchJobResult,
} from '@/types/jobs.types';
