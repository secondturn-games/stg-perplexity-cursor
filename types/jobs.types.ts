/**
 * Job Processing System Types
 * Defines interfaces and types for the background job processing system
 */

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';
export type JobType =
  | 'bgg_sync'
  | 'bgg_bulk_sync'
  | 'cache_warmup'
  | 'user_collection_sync'
  | 'search_prefetch';

export interface JobMetadata {
  userId?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  progress?: number;
  tags?: string[];
  [key: string]: any;
}

export interface JobPayload {
  [key: string]: any;
}

export interface Job {
  id: string;
  type: JobType;
  payload: JobPayload;
  status: JobStatus;
  priority: JobPriority;
  metadata: JobMetadata;
  result?: any;
  error?: string;
}

export interface JobQueueConfig {
  maxConcurrentJobs: number;
  retryDelay: number;
  maxRetries: number;
  cleanupInterval: number;
  jobTimeout: number;
}

export interface JobProcessor {
  process(job: Job): Promise<any>;
  canHandle(jobType: JobType): boolean;
  getPriority?(job: Job): JobPriority;
}

export interface JobScheduler {
  schedule(job: Omit<Job, 'id' | 'status' | 'metadata'>): Promise<string>;
  scheduleRecurring(
    cronExpression: string,
    job: Omit<Job, 'id' | 'status' | 'metadata'>
  ): Promise<string>;
  cancel(jobId: string): Promise<boolean>;
  getScheduledJobs(): Promise<Job[]>;
}

export interface JobRepository {
  create(job: Omit<Job, 'id'>): Promise<Job>;
  getById(id: string): Promise<Job | null>;
  getByStatus(status: JobStatus): Promise<Job[]>;
  getByType(type: JobType): Promise<Job[]>;
  update(id: string, updates: Partial<Job>): Promise<Job>;
  delete(id: string): Promise<boolean>;
  getNextPending(limit?: number): Promise<Job[]>;
  getJobStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    byType: Record<JobType, number>;
  }>;
}

export interface JobWorker {
  start(): Promise<void>;
  stop(): Promise<void>;
  getIsRunning(): boolean;
  getStatus(): {
    running: boolean;
    activeJobs: number;
    processedJobs: number;
    failedJobs: number;
  };
}

// BGG-specific job types
export interface BGGSyncJobPayload {
  gameId: string;
  forceUpdate?: boolean;
  includeDetails?: boolean;
}

export interface BGGBulkSyncJobPayload {
  gameIds: string[];
  batchSize?: number;
  delayBetweenBatches?: number;
}

export interface CacheWarmupJobPayload {
  gameIds?: string[];
  searchQueries?: string[];
  popularGames?: boolean;
  limit?: number;
}

export interface UserCollectionSyncJobPayload {
  username: string;
  forceUpdate?: boolean;
}

export interface SearchPrefetchJobPayload {
  queries: string[];
  filters?: Record<string, any>;
}

// Job result types
export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface BGGSyncJobResult extends JobResult {
  gameId: string;
  gameData?: any;
  cached: boolean;
  apiCalls: number;
}

export interface BGGBulkSyncJobResult extends JobResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  gameIds: string[];
  results: BGGSyncJobResult[];
}

export interface CacheWarmupJobResult extends JobResult {
  warmedItems: number;
  cacheHitRate: number;
  totalApiCalls: number;
}

export interface UserCollectionSyncJobResult extends JobResult {
  username: string;
  collectionSize: number;
  newGames: number;
  updatedGames: number;
}

export interface SearchPrefetchJobResult extends JobResult {
  queriesProcessed: number;
  resultsCached: number;
  totalApiCalls: number;
}
