/**
 * Job Enqueue API Endpoint
 * POST /api/jobs/enqueue
 */

import { NextRequest, NextResponse } from 'next/server';
import { JobType, JobPriority } from '@/types/jobs.types';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload, priority = 'normal', metadata = {} } = body;

    // Validate required fields
    if (!type || !payload) {
      return NextResponse.json(
        { error: 'Type and payload are required' },
        { status: 400 }
      );
    }

    // Validate job type
    const validTypes: JobType[] = [
      'bgg_sync',
      'bgg_bulk_sync',
      'cache_warmup',
      'user_collection_sync',
      'search_prefetch',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid job type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities: JobPriority[] = [
      'low',
      'normal',
      'high',
      'critical',
    ];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        {
          error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate payload based on job type
    const validationError = validateJobPayload(type, payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Enqueue the job
    const jobId = await jobQueue.enqueue(type, payload, priority, metadata);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job enqueued successfully',
    });
  } catch (error) {
    console.error('Job enqueue error:', error);
    return NextResponse.json(
      { error: 'Failed to enqueue job' },
      { status: 500 }
    );
  }
}

/**
 * Validate job payload based on job type
 */
function validateJobPayload(type: JobType, payload: any): string | null {
  switch (type) {
    case 'bgg_sync':
      if (!payload.gameId) {
        return 'BGG sync job requires gameId in payload';
      }
      break;

    case 'bgg_bulk_sync':
      if (
        !payload.gameIds ||
        !Array.isArray(payload.gameIds) ||
        payload.gameIds.length === 0
      ) {
        return 'BGG bulk sync job requires gameIds array in payload';
      }
      break;

    case 'cache_warmup':
      // No specific validation required
      break;

    case 'user_collection_sync':
      if (!payload.username) {
        return 'User collection sync job requires username in payload';
      }
      break;

    case 'search_prefetch':
      if (
        !payload.queries ||
        !Array.isArray(payload.queries) ||
        payload.queries.length === 0
      ) {
        return 'Search prefetch job requires queries array in payload';
      }
      break;

    default:
      return `Unknown job type: ${type}`;
  }

  return null;
}
