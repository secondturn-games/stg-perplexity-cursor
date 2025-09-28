/**
 * BGG API Routes
 * Handles all BGG-related API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { bggClient } from '@/lib/bgg-client';
import { BGGError, type SearchFilters } from '@/types/bgg.types';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30; // 30 requests per minute per IP

  const key = `rate_limit:${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Main API handler
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { slug } = await params;
    const [endpoint, ...args] = slug;
    const searchParams = request.nextUrl.searchParams;

    switch (endpoint) {
      case 'search':
        return await handleSearch(searchParams);

      case 'game':
        return await handleGameDetails(args[0] || '', searchParams);

      case 'collection':
        return await handleCollection(searchParams);

      case 'batch':
        return await handleBatchUpdate(searchParams);

      case 'sync':
        return await handleSync(searchParams);

      case 'cache-stats':
        return await handleCacheStats();

      default:
        return NextResponse.json(
          { error: 'Invalid endpoint' },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('BGG API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for batch operations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { slug } = await params;
    const [endpoint] = slug;
    const body = await request.json();

    switch (endpoint) {
      case 'batch':
        return await handleBatchUpdatePost(body);

      case 'sync':
        return await handleSyncPost(body);

      case 'clear-cache':
        return await handleClearCache();

      default:
        return NextResponse.json(
          { error: 'Invalid endpoint' },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('BGG API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle game search
 */
async function handleSearch(searchParams: URLSearchParams) {
  const query = searchParams.get('q');
  const gameType = searchParams.get('gameType') as
    | 'base-game'
    | 'expansion'
    | 'accessory'
    | 'all'
    | null;
  const exactMatch = searchParams.get('exactMatch') === 'true';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    const filters: SearchFilters = {
      gameType: gameType || 'all',
      exactMatch,
    };

    const results = await bggClient.searchGames(query, filters);
    return NextResponse.json(results);
  } catch (error) {
    return handleBGGError(error);
  }
}

/**
 * Handle game details
 */
async function handleGameDetails(
  gameId: string,
  searchParams: URLSearchParams
) {
  if (!gameId) {
    return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
  }

  try {
    console.log(`🔍 Getting game details for ID: ${gameId}`);
    const gameDetails = await bggClient.getGameDetails(gameId);
    console.log(`✅ Successfully got game details for ID: ${gameId}`);

    // Process images if requested
    // Image processing would be handled here if needed

    return NextResponse.json(gameDetails);
  } catch (error) {
    console.error(`❌ Error getting game details for ID ${gameId}:`, error);
    return handleBGGError(error);
  }
}

/**
 * Handle user collection
 */
async function handleCollection(searchParams: URLSearchParams) {
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'Username parameter is required' },
      { status: 400 }
    );
  }

  try {
    const collection = await bggClient.getUserCollection(username);
    return NextResponse.json(collection);
  } catch (error) {
    return handleBGGError(error);
  }
}

/**
 * Handle batch update (GET)
 */
async function handleBatchUpdate(searchParams: URLSearchParams) {
  const gameIds = searchParams.get('game_ids');

  if (!gameIds) {
    return NextResponse.json(
      { error: 'game_ids parameter is required' },
      { status: 400 }
    );
  }

  const ids = gameIds.split(',').filter(id => id.trim());
  if (ids.length === 0) {
    return NextResponse.json(
      { error: 'At least one game ID is required' },
      { status: 400 }
    );
  }

  try {
    // Batch update would be handled here if needed
    return NextResponse.json({ message: 'Batch update not implemented yet' });
  } catch (error) {
    return handleBGGError(error);
  }
}

/**
 * Handle batch update (POST)
 */
async function handleBatchUpdatePost(body: any) {
  const { gameIds } = body;

  if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
    return NextResponse.json(
      { error: 'gameIds array is required' },
      { status: 400 }
    );
  }

  try {
    // Batch update would be handled here if needed
    return NextResponse.json({ message: 'Batch update not implemented yet' });
  } catch (error) {
    return handleBGGError(error);
  }
}

/**
 * Handle sync operation
 */
async function handleSync(searchParams: URLSearchParams) {
  const type = searchParams.get('type');

  if (!type) {
    return NextResponse.json(
      { error: 'Type parameter is required' },
      { status: 400 }
    );
  }

  try {
    switch (type) {
      case 'popular':
        return await syncPopularGames();

      case 'recent':
        return await syncRecentGames();

      default:
        return NextResponse.json(
          { error: 'Invalid sync type' },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleBGGError(error);
  }
}

/**
 * Handle sync operation (POST)
 */
async function handleSyncPost(body: any) {
  const { type, options = {} } = body;

  if (!type) {
    return NextResponse.json({ error: 'Type is required' }, { status: 400 });
  }

  try {
    switch (type) {
      case 'popular':
        return await syncPopularGames(options);

      case 'recent':
        return await syncRecentGames(options);

      case 'custom':
        return await syncCustomGames(options);

      default:
        return NextResponse.json(
          { error: 'Invalid sync type' },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleBGGError(error);
  }
}

/**
 * Sync popular games
 */
async function syncPopularGames(options: any = {}) {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  // Popular game IDs (you can expand this list)
  const popularGameIds = [
    '13', // Catan
    '9209', // Ticket to Ride
    '266192', // Wingspan
    '174430', // Gloomhaven
    '161936', // Pandemic Legacy: Season 1
    '224517', // Azul
    '167791', // Terraforming Mars
    '266810', // Wingspan: European Expansion
    '266192', // Wingspan
    '30549', // Power Grid
  ];

  const gameIds = popularGameIds.slice(offset, offset + limit);
  // Batch update would be handled here if needed
  const batchResult = { message: 'Batch update not implemented yet' };

  return NextResponse.json({
    type: 'popular',
    batchResult,
    synced: gameIds.length,
  });
}

/**
 * Sync recent games
 */
async function syncRecentGames(options: any = {}) {
  // This would typically query BGG for recently added/updated games
  // For now, we'll return a placeholder
  return NextResponse.json({
    type: 'recent',
    message: 'Recent games sync not implemented yet',
  });
}

/**
 * Sync custom games
 */
async function syncCustomGames(options: any) {
  const { gameIds } = options;

  if (!gameIds || !Array.isArray(gameIds)) {
    return NextResponse.json(
      { error: 'gameIds array is required' },
      { status: 400 }
    );
  }

  // Batch update would be handled here if needed
  const batchResult = { message: 'Batch update not implemented yet' };

  return NextResponse.json({
    type: 'custom',
    batchResult,
    synced: gameIds.length,
  });
}

/**
 * Handle cache statistics
 */
async function handleCacheStats() {
  try {
    const stats = bggClient.getCacheStats();
    const adaptive = bggClient.getAdaptiveCacheStats();

    return NextResponse.json({
      cache: stats,
      adaptive,
    });
  } catch (error) {
    return handleBGGError(error);
  }
}

/**
 * Handle cache clearing
 */
async function handleClearCache() {
  try {
    bggClient.clearCache();
    return NextResponse.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    return handleBGGError(error);
  }
}

/**
 * Handle BGG errors
 */
function handleBGGError(error: any): NextResponse {
  let bggError: BGGError;

  if (error instanceof BGGError) {
    bggError = error;
  } else {
    bggError = new BGGError(
      'BGG_ERROR',
      error.message || 'Unknown error',
      error
    );
  }

  console.error('BGG API Error:', bggError);

  // Determine appropriate HTTP status based on error type
  let status = 500;
  if (bggError.code === 'RATE_LIMIT') {
    status = 429;
  } else if (
    bggError.code === 'NETWORK_ERROR' ||
    bggError.code === 'TIMEOUT_ERROR'
  ) {
    status = 503;
  } else if (bggError.code === 'API_UNAVAILABLE') {
    status = 503;
  } else if (bggError.code === 'VALIDATION_ERROR') {
    status = 400;
  }

  return NextResponse.json(
    {
      error: {
        message: bggError.userMessage || bggError.message,
        code: bggError.code,
        retryAfter: bggError.retryAfter,
        details:
          process.env.NODE_ENV === 'development' ? bggError.details : undefined,
      },
    },
    {
      status,
      ...(bggError.retryAfter && {
        headers: {
          'Retry-After': bggError.retryAfter.toString(),
        },
      }),
    }
  );
}
