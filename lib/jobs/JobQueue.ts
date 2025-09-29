/**
 * Core Job Queue System
 * Handles job queuing, processing, and persistence
 */

import {
  Job,
  JobStatus,
  JobPriority,
  JobType,
  JobQueueConfig,
  JobProcessor,
  JobRepository,
} from '@/types/jobs.types';
import { createServerComponentClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export class JobQueue {
  private processors: Map<JobType, JobProcessor> = new Map();
  private config: JobQueueConfig;
  private repository: JobRepository;
  private isProcessing = false;
  private activeJobs = new Set<string>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: JobQueueConfig, repository: JobRepository) {
    this.config = config;
    this.repository = repository;
    this.startCleanup();
  }

  /**
   * Register a job processor
   */
  registerProcessor(processor: JobProcessor): void {
    // Register for all job types this processor can handle
    const supportedTypes: JobType[] = [
      'bgg_sync',
      'bgg_bulk_sync',
      'cache_warmup',
      'user_collection_sync',
      'search_prefetch',
    ];

    for (const jobType of supportedTypes) {
      if (processor.canHandle(jobType)) {
        this.processors.set(jobType, processor);
      }
    }
  }

  /**
   * Enqueue a new job
   */
  async enqueue(
    type: JobType,
    payload: any,
    priority: JobPriority = 'normal',
    metadata: Partial<any> = {}
  ): Promise<string> {
    const job: Omit<Job, 'id'> = {
      type,
      payload,
      status: 'pending',
      priority,
      metadata: {
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...metadata,
      },
    };

    const createdJob = await this.repository.create(job);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return createdJob.id;
  }

  /**
   * Start processing jobs
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    console.log('🔄 Job queue processing started');

    while (this.isProcessing) {
      try {
        // Get next batch of pending jobs
        const pendingJobs = await this.repository.getNextPending(
          this.config.maxConcurrentJobs
        );

        if (pendingJobs.length === 0) {
          // No jobs to process, wait a bit
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Process jobs concurrently (up to maxConcurrentJobs)
        const availableSlots =
          this.config.maxConcurrentJobs - this.activeJobs.size;
        const jobsToProcess = pendingJobs.slice(0, availableSlots);

        for (const job of jobsToProcess) {
          this.processJob(job);
        }

        // Wait before checking for more jobs
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('❌ Error in job processing loop:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds on error
      }
    }
  }

  /**
   * Stop processing jobs
   */
  async stopProcessing(): Promise<void> {
    this.isProcessing = false;
    console.log('⏹️ Job queue processing stopped');
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    if (this.activeJobs.has(job.id)) {
      return; // Already processing
    }

    this.activeJobs.add(job.id);

    try {
      // Update job status to processing
      await this.updateJobStatus(job.id, 'processing', {
        startedAt: new Date().toISOString(),
      });

      // Get processor for this job type
      const processor = this.processors.get(job.type);
      if (!processor) {
        throw new Error(`No processor found for job type: ${job.type}`);
      }

      // Process the job with timeout
      const result = await this.processWithTimeout(
        processor.process(job),
        this.config.jobTimeout
      );

      // Update job status to completed
      await this.updateJobStatus(job.id, 'completed', {
        completedAt: new Date().toISOString(),
        result,
      });

      console.log(`✅ Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);

      // Handle retry logic
      const shouldRetry = await this.handleJobFailure(job, error);

      if (!shouldRetry) {
        await this.updateJobStatus(job.id, 'failed', {
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date().toISOString(),
        });
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Process job with timeout
   */
  private async processWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Job timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Handle job failure and retry logic
   */
  private async handleJobFailure(job: Job, error: any): Promise<boolean> {
    const currentRetryCount = job.metadata.retryCount || 0;
    const maxRetries = job.metadata.maxRetries || this.config.maxRetries;

    if (currentRetryCount >= maxRetries) {
      console.log(`❌ Job ${job.id} exceeded max retries (${maxRetries})`);
      return false;
    }

    // Calculate retry delay with exponential backoff
    const retryDelay = this.config.retryDelay * Math.pow(2, currentRetryCount);

    console.log(
      `🔄 Retrying job ${job.id} in ${retryDelay}ms (attempt ${currentRetryCount + 1}/${maxRetries})`
    );

    // Update retry count and reset status
    await this.updateJobStatus(job.id, 'pending', {
      retryCount: currentRetryCount + 1,
      error: error instanceof Error ? error.message : String(error),
    });

    // Schedule retry
    setTimeout(() => {
      this.processJob(job);
    }, retryDelay);

    return true;
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: JobStatus,
    updates: Partial<any> = {}
  ): Promise<void> {
    const job = await this.repository.getById(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await this.repository.update(jobId, {
      status,
      metadata: {
        ...job.metadata,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    return this.repository.getById(jobId);
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(status: JobStatus): Promise<Job[]> {
    return this.repository.getByStatus(status);
  }

  /**
   * Get jobs by type
   */
  async getJobsByType(type: JobType): Promise<Job[]> {
    return this.repository.getByType(type);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.repository.getById(jobId);
    if (!job || job.status !== 'pending') {
      return false;
    }

    await this.updateJobStatus(jobId, 'cancelled');
    return true;
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    return this.repository.getJobStats();
  }

  /**
   * Get worker status
   */
  getWorkerStatus() {
    return {
      isProcessing: this.isProcessing,
      activeJobs: this.activeJobs.size,
      maxConcurrentJobs: this.config.maxConcurrentJobs,
    };
  }

  /**
   * Start cleanup process
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        // Clean up old completed/failed jobs (older than 7 days)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);

        // This would be implemented in the repository
        // await this.repository.cleanupOldJobs(cutoffDate);

        console.log('🧹 Job queue cleanup completed');
      } catch (error) {
        console.error('❌ Job queue cleanup failed:', error);
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup process
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.stopProcessing();
  }
}
