/**
 * Background Job Worker
 * Manages the background job processing lifecycle
 */

import { JobWorker as IJobWorker, JobProcessor } from '@/types/jobs.types';
import { JobQueue } from './JobQueue';
import { SupabaseJobRepository } from './repositories/SupabaseJobRepository';
import { BGGSyncProcessor } from './processors/BGGSyncProcessor';
import { BGGBulkSyncProcessor } from './processors/BGGBulkSyncProcessor';
import { CacheWarmupProcessor } from './processors/CacheWarmupProcessor';
import { JobScheduler } from './scheduler/JobScheduler';

export class JobWorker implements IJobWorker {
  private jobQueue: JobQueue;
  private jobScheduler: JobScheduler;
  private isRunning = false;
  private processedJobs = 0;
  private failedJobs = 0;
  private processors: JobProcessor[] = [];

  constructor() {
    // Initialize repository and job queue
    const jobRepository = new SupabaseJobRepository();
    this.jobQueue = new JobQueue(
      {
        maxConcurrentJobs: 3,
        retryDelay: 1000,
        maxRetries: 3,
        cleanupInterval: 60 * 60 * 1000, // 1 hour
        jobTimeout: 5 * 60 * 1000, // 5 minutes
      },
      jobRepository
    );

    // Initialize job scheduler
    this.jobScheduler = new JobScheduler(this.jobQueue);

    // Register processors
    this.registerProcessors();
  }

  /**
   * Start the background worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Job worker is already running');
      return;
    }

    console.log('🚀 Starting background job worker...');

    try {
      // Register all processors with the job queue
      for (const processor of this.processors) {
        this.jobQueue.registerProcessor(processor);
      }

      // Start job processing
      await this.jobQueue.startProcessing();

      // Schedule common BGG jobs
      await this.jobScheduler.scheduleCommonBGGJobs();

      this.isRunning = true;
      console.log('✅ Background job worker started successfully');

      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('❌ Failed to start job worker:', error);
      throw error;
    }
  }

  /**
   * Stop the background worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Job worker is not running');
      return;
    }

    console.log('⏹️ Stopping background job worker...');

    try {
      // Stop job processing
      await this.jobQueue.stopProcessing();

      // Stop scheduled jobs
      this.jobScheduler.stop();

      this.isRunning = false;
      console.log('✅ Background job worker stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping job worker:', error);
      throw error;
    }
  }

  /**
   * Check if worker is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get worker status
   */
  getStatus() {
    const queueStatus = this.jobQueue.getWorkerStatus();

    return {
      running: this.isRunning,
      activeJobs: queueStatus.activeJobs,
      processedJobs: this.processedJobs,
      failedJobs: this.failedJobs,
      maxConcurrentJobs: queueStatus.maxConcurrentJobs,
    };
  }

  /**
   * Register all job processors
   */
  private registerProcessors(): void {
    this.processors = [
      new BGGSyncProcessor(),
      new BGGBulkSyncProcessor(),
      new CacheWarmupProcessor(),
      // Add more processors here as needed
    ];

    console.log(`📝 Registered ${this.processors.length} job processors`);
  }

  /**
   * Set up graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

      try {
        await this.stop();
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      console.error('❌ Uncaught exception:', error);
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }

  /**
   * Get job queue instance (for external access)
   */
  getJobQueue(): JobQueue {
    return this.jobQueue;
  }

  /**
   * Get job scheduler instance (for external access)
   */
  getJobScheduler(): JobScheduler {
    return this.jobScheduler;
  }
}

// Singleton instance
let jobWorkerInstance: JobWorker | null = null;

/**
 * Get the singleton job worker instance
 */
export function getJobWorker(): JobWorker {
  if (!jobWorkerInstance) {
    jobWorkerInstance = new JobWorker();
  }
  return jobWorkerInstance;
}

/**
 * Start the job worker (for use in development or as a separate process)
 */
export async function startJobWorker(): Promise<void> {
  const worker = getJobWorker();
  await worker.start();
}

/**
 * Stop the job worker
 */
export async function stopJobWorker(): Promise<void> {
  const worker = getJobWorker();
  await worker.stop();
}
