/**
 * Job Admin API Endpoint
 * GET /api/jobs/admin - Get job statistics and management info
 * POST /api/jobs/admin - Admin actions (cancel jobs, etc.)
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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeDetails = url.searchParams.get('details') === 'true';

    // Get job statistics
    const stats = await jobQueue.getStats();
    const workerStatus = jobQueue.getWorkerStatus();

    const response: any = {
      stats,
      worker: workerStatus,
      timestamp: new Date().toISOString(),
    };

    // Include detailed information if requested
    if (includeDetails) {
      const [pendingJobs, processingJobs, failedJobs] = await Promise.all([
        jobQueue.getJobsByStatus('pending'),
        jobQueue.getJobsByStatus('processing'),
        jobQueue.getJobsByStatus('failed'),
      ]);

      response.details = {
        pendingJobs: pendingJobs.map(job => ({
          id: job.id,
          type: job.type,
          priority: job.priority,
          createdAt: job.metadata.createdAt,
          retryCount: job.metadata.retryCount,
        })),
        processingJobs: processingJobs.map(job => ({
          id: job.id,
          type: job.type,
          priority: job.priority,
          startedAt: job.metadata.startedAt,
        })),
        failedJobs: failedJobs.map(job => ({
          id: job.id,
          type: job.type,
          error: job.error,
          retryCount: job.metadata.retryCount,
          createdAt: job.metadata.createdAt,
        })),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Job admin GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get job admin information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, jobType } = body;

    switch (action) {
      case 'cancel_job':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required for cancel action' },
            { status: 400 }
          );
        }

        const cancelled = await jobQueue.cancelJob(jobId);
        if (!cancelled) {
          return NextResponse.json(
            { error: 'Job not found or cannot be cancelled' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Job cancelled successfully',
          jobId,
        });

      case 'get_jobs_by_type':
        if (!jobType) {
          return NextResponse.json(
            { error: 'Job type is required for get_jobs_by_type action' },
            { status: 400 }
          );
        }

        const jobs = await jobQueue.getJobsByType(jobType);
        return NextResponse.json({
          success: true,
          jobs: jobs.map(job => ({
            id: job.id,
            type: job.type,
            status: job.status,
            priority: job.priority,
            createdAt: job.metadata.createdAt,
            updatedAt: job.metadata.updatedAt,
            retryCount: job.metadata.retryCount,
            error: job.error,
          })),
        });

      case 'get_jobs_by_status':
        const { status } = body;
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for get_jobs_by_status action' },
            { status: 400 }
          );
        }

        const statusJobs = await jobQueue.getJobsByStatus(status);
        return NextResponse.json({
          success: true,
          jobs: statusJobs.map(job => ({
            id: job.id,
            type: job.type,
            status: job.status,
            priority: job.priority,
            createdAt: job.metadata.createdAt,
            updatedAt: job.metadata.updatedAt,
            retryCount: job.metadata.retryCount,
            error: job.error,
          })),
        });

      case 'retry_failed_jobs':
        const failedJobs = await jobQueue.getJobsByStatus('failed');
        let retriedCount = 0;

        for (const job of failedJobs) {
          // Reset job to pending status for retry
          await jobRepository.update(job.id, {
            status: 'pending',
            metadata: {
              ...job.metadata,
              retryCount: 0,
              updatedAt: new Date().toISOString(),
            },
          });
          retriedCount++;
        }

        return NextResponse.json({
          success: true,
          message: `Retried ${retriedCount} failed jobs`,
          retriedCount,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Job admin POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute admin action' },
      { status: 500 }
    );
  }
}
