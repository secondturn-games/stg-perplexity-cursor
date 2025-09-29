/**
 * Job Scheduler
 * Handles scheduling of recurring jobs and cron-like functionality
 */

import {
  Job,
  JobType,
  JobPriority,
  JobScheduler as IJobScheduler,
  JobMetadata,
  JobPayload,
} from '@/types/jobs.types';
import { JobQueue } from '../JobQueue';
import { SupabaseJobRepository } from '../repositories/SupabaseJobRepository';
import { createServerComponentClient } from '@/lib/supabase';

export class JobScheduler implements IJobScheduler {
  private jobQueue: JobQueue;
  private supabase = createServerComponentClient();
  private scheduledJobs = new Map<string, NodeJS.Timeout>();

  constructor(jobQueue: JobQueue) {
    this.jobQueue = jobQueue;
  }

  /**
   * Schedule a one-time job
   */
  async schedule(
    job: Omit<Job, 'id' | 'status' | 'metadata'>
  ): Promise<string> {
    const jobId = await this.jobQueue.enqueue(
      job.type,
      job.payload,
      job.priority,
      {
        scheduled: true,
        scheduledAt: new Date().toISOString(),
      }
    );

    console.log(`📅 Scheduled job ${jobId} of type ${job.type}`);
    return jobId;
  }

  /**
   * Schedule a recurring job using cron-like syntax
   */
  async scheduleRecurring(
    cronExpression: string,
    job: Omit<Job, 'id' | 'status' | 'metadata'>
  ): Promise<string> {
    const scheduleId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Parse cron expression and create interval
    const interval = this.parseCronExpression(cronExpression);

    if (!interval) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Create recurring job
    const recurringJob = {
      ...job,
      metadata: {
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scheduled: true,
        recurring: true,
        cronExpression,
        scheduleId,
        nextRun: this.getNextRunTime(cronExpression),
      },
    };

    // Schedule the first run
    const jobId = await this.schedule(recurringJob);

    // Set up recurring execution
    const timeout = setInterval(async () => {
      try {
        await this.schedule(recurringJob);
        console.log(`🔄 Executed recurring job ${scheduleId}`);
      } catch (error) {
        console.error(
          `❌ Failed to execute recurring job ${scheduleId}:`,
          error
        );
      }
    }, interval);

    this.scheduledJobs.set(scheduleId, timeout);
    console.log(
      `📅 Scheduled recurring job ${scheduleId} with cron: ${cronExpression}`
    );

    return scheduleId;
  }

  /**
   * Cancel a scheduled job
   */
  async cancel(jobId: string): Promise<boolean> {
    // Check if it's a recurring job
    if (this.scheduledJobs.has(jobId)) {
      const timeout = this.scheduledJobs.get(jobId);
      if (timeout) {
        clearInterval(timeout);
        this.scheduledJobs.delete(jobId);
        console.log(`❌ Cancelled recurring job ${jobId}`);
        return true;
      }
    }

    // Cancel one-time job
    return await this.jobQueue.cancelJob(jobId);
  }

  /**
   * Get all scheduled jobs
   */
  async getScheduledJobs(): Promise<Job[]> {
    const { data, error } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .eq('metadata->>scheduled', 'true')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get scheduled jobs: ${error.message}`);
    }

    return data.map(
      job =>
        ({
          ...job,
          metadata: job.metadata as JobMetadata,
          payload: job.payload as JobPayload,
          result: job.result as any,
        }) as Job
    );
  }

  /**
   * Schedule common BGG jobs
   */
  async scheduleCommonBGGJobs(): Promise<void> {
    console.log('📅 Scheduling common BGG jobs...');

    // Daily cache warmup at 2 AM
    await this.scheduleRecurring('0 2 * * *', {
      type: 'cache_warmup',
      payload: {
        popularGames: true,
        limit: 50,
      },
      priority: 'low',
    });

    // Weekly bulk sync of popular games at 3 AM on Sundays
    await this.scheduleRecurring('0 3 * * 0', {
      type: 'bgg_bulk_sync',
      payload: {
        gameIds: [
          '13',
          '9209',
          '266192',
          '174430',
          '161936',
          '224517',
          '167791',
          '30549',
          '266810',
          '230802',
        ],
        batchSize: 3,
        delayBetweenBatches: 3000,
      },
      priority: 'normal',
    });

    // Hourly search prefetch for common queries
    await this.scheduleRecurring('0 * * * *', {
      type: 'search_prefetch',
      payload: {
        queries: ['catan', 'ticket to ride', 'wingspan', 'pandemic', 'azul'],
        filters: { gameType: 'all' },
      },
      priority: 'low',
    });

    console.log('✅ Common BGG jobs scheduled');
  }

  /**
   * Parse cron expression and return interval in milliseconds
   */
  private parseCronExpression(cronExpression: string): number | null {
    const parts = cronExpression.split(' ');

    if (parts.length !== 5) {
      return null;
    }

    const [minute, hour, day, month, weekday] = parts;

    // Simple cron parser for common patterns
    if (
      minute === '0' &&
      hour === '2' &&
      day === '*' &&
      month === '*' &&
      weekday === '*'
    ) {
      return 24 * 60 * 60 * 1000; // Daily at 2 AM
    }

    if (
      minute === '0' &&
      hour === '3' &&
      day === '*' &&
      month === '*' &&
      weekday === '0'
    ) {
      return 7 * 24 * 60 * 60 * 1000; // Weekly on Sunday at 3 AM
    }

    if (
      minute === '0' &&
      hour === '*' &&
      day === '*' &&
      month === '*' &&
      weekday === '*'
    ) {
      return 60 * 60 * 1000; // Hourly
    }

    // For more complex cron expressions, you'd need a proper cron parser
    // For now, return null for unsupported patterns
    return null;
  }

  /**
   * Get next run time for cron expression
   */
  private getNextRunTime(cronExpression: string): string {
    const now = new Date();
    const interval = this.parseCronExpression(cronExpression);

    if (!interval) {
      return now.toISOString();
    }

    const nextRun = new Date(now.getTime() + interval);
    return nextRun.toISOString();
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    for (const [scheduleId, timeout] of this.scheduledJobs) {
      clearInterval(timeout);
      console.log(`⏹️ Stopped scheduled job ${scheduleId}`);
    }
    this.scheduledJobs.clear();
  }
}
