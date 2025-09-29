/**
 * Supabase Job Repository
 * Implements job persistence using Supabase
 */

import { createServerComponentClient } from '@/lib/supabase';
import {
  Job,
  JobStatus,
  JobType,
  JobRepository,
  JobMetadata,
  JobPayload,
} from '@/types/jobs.types';

export class SupabaseJobRepository implements JobRepository {
  private supabase = createServerComponentClient();

  async create(job: Omit<Job, 'id'>): Promise<Job> {
    const { data, error } = await this.supabase
      .from('jobs')
      .insert({
        type: job.type,
        payload: job.payload,
        status: job.status,
        priority: job.priority,
        metadata: job.metadata,
        result: job.result,
        error: job.error || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return {
      ...data,
      metadata: data.metadata as JobMetadata,
      payload: data.payload as JobPayload,
      result: data.result as any,
    } as Job;
  }

  async getById(id: string): Promise<Job | null> {
    const { data, error } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get job: ${error.message}`);
    }

    return {
      ...data,
      metadata: data.metadata as JobMetadata,
      payload: data.payload as JobPayload,
      result: data.result as any,
    } as Job;
  }

  async getByStatus(status: JobStatus): Promise<Job[]> {
    const { data, error } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get jobs by status: ${error.message}`);
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

  async getByType(type: JobType): Promise<Job[]> {
    const { data, error } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get jobs by type: ${error.message}`);
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

  async update(id: string, updates: Partial<Job>): Promise<Job> {
    const { data, error } = await this.supabase
      .from('jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }

    return {
      ...data,
      metadata: data.metadata as JobMetadata,
      payload: data.payload as JobPayload,
      result: data.result as any,
    } as Job;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('jobs').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }

    return true;
  }

  async getNextPending(limit: number = 10): Promise<Job[]> {
    const { data, error } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false }) // Critical first
      .order('created_at', { ascending: true }) // Then by creation time
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get next pending jobs: ${error.message}`);
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

  async getJobStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    byType: Record<JobType, number>;
  }> {
    // Get total counts by status
    const { data: statusData, error: statusError } = await this.supabase
      .from('jobs')
      .select('status')
      .in('status', ['pending', 'processing', 'completed', 'failed']);

    if (statusError) {
      throw new Error(`Failed to get job status stats: ${statusError.message}`);
    }

    // Get counts by type
    const { data: typeData, error: typeError } = await this.supabase
      .from('jobs')
      .select('type, status')
      .in('status', ['pending', 'processing', 'completed', 'failed']);

    if (typeError) {
      throw new Error(`Failed to get job type stats: ${typeError.message}`);
    }

    // Process status counts
    const statusCounts = statusData.reduce(
      (acc, job) => {
        acc[job.status as JobStatus] = (acc[job.status as JobStatus] || 0) + 1;
        return acc;
      },
      {} as Record<JobStatus, number>
    );

    // Process type counts
    const typeCounts = typeData.reduce(
      (acc, job) => {
        if (!acc[job.type as JobType]) {
          acc[job.type as JobType] = 0;
        }
        acc[job.type as JobType]++;
        return acc;
      },
      {} as Record<JobType, number>
    );

    return {
      total: statusData.length,
      pending: statusCounts.pending || 0,
      processing: statusCounts.processing || 0,
      completed: statusCounts.completed || 0,
      failed: statusCounts.failed || 0,
      byType: typeCounts,
    };
  }

  async cleanupOldJobs(cutoffDate: Date): Promise<number> {
    const { data, error } = await this.supabase
      .from('jobs')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw new Error(`Failed to cleanup old jobs: ${error.message}`);
    }

    return data?.length || 0;
  }
}
