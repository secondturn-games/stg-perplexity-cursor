/**
 * Job Status API Endpoint
 * GET /api/jobs/status/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { JobQueue } from '@/lib/jobs/JobQueue';
import { SupabaseJobRepository } from '@/lib/jobs/repositories/SupabaseJobRepository';

// Initialize job queue (in production, this would be a singleton)
const jobRepository = new SupabaseJobRepository();
const jobQueue = new JobQueue(
  {
    maxConcurrentJobs: 3,
    retryDelay: 1000,
    maxRetries: 3,
    cleanupInterval: 60 * 60 * 1000, // 1 hour
    jobTimeout: 5 * 60 * 1000, // 5 minutes
  },
  jobRepository
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = await jobQueue.getJob(id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Return job status with relevant information
    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      priority: job.priority,
      createdAt: job.metadata.createdAt,
      updatedAt: job.metadata.updatedAt,
      startedAt: job.metadata.startedAt,
      completedAt: job.metadata.completedAt,
      retryCount: job.metadata.retryCount,
      maxRetries: job.metadata.maxRetries,
      error: job.error,
      result: job.result,
      progress: job.metadata.progress,
    });
  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}
