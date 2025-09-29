/**
 * BGG Health Endpoint
 * Provides circuit breaker status and system health monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { bggClient } from '@/lib/bgg-client';
import { eventBus } from '@/lib/events/EventBus';
import { BGGEventFactory } from '@/lib/events/BGGEvents';

// Health check cache (in production, use Redis or similar)
const healthCache = new Map<string, any>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Get circuit breaker status from BGG service
 */
async function getCircuitBreakerStatus() {
  try {
    // Get circuit breaker status from BGGAPIClient
    const apiClient = (bggClient as any).apiClient;
    if (apiClient && typeof apiClient.getCircuitBreakerStatus === 'function') {
      return apiClient.getCircuitBreakerStatus();
    }

    // Fallback if circuit breaker is not available
    return {
      healthy: true,
      state: 'CLOSED',
      lastError: undefined,
      errorRate: 0,
      recommendations: ['Circuit breaker not initialized'],
    };
  } catch (error) {
    return {
      healthy: false,
      state: 'UNKNOWN',
      lastError: error instanceof Error ? error.message : 'Unknown error',
      errorRate: 1,
      recommendations: ['Failed to get circuit breaker status'],
    };
  }
}

/**
 * Get circuit breaker metrics
 */
async function getCircuitBreakerMetrics() {
  try {
    const apiClient = (bggClient as any).apiClient;
    if (apiClient && typeof apiClient.getCircuitBreakerMetrics === 'function') {
      return apiClient.getCircuitBreakerMetrics();
    }

    return {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      failureRate: 0,
      lastFailureTime: undefined,
      lastSuccessTime: undefined,
      stateChangeTime: new Date().toISOString(),
      stateDuration: 0,
      halfOpenRequests: 0,
    };
  } catch (error) {
    return {
      state: 'UNKNOWN',
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      failureRate: 0,
      lastFailureTime: undefined,
      lastSuccessTime: undefined,
      stateChangeTime: new Date().toISOString(),
      stateDuration: 0,
      halfOpenRequests: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test BGG API connectivity
 */
async function testBGGConnectivity(): Promise<{
  healthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // Try a simple search to test connectivity
    const results = await bggClient.searchGames('test', {
      gameType: 'base-game',
    });
    const responseTime = Date.now() - startTime;

    return {
      healthy: true,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      healthy: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get system health status
 */
async function getSystemHealth() {
  const cacheKey = 'system_health';
  const cached = healthCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const [circuitBreakerStatus, circuitBreakerMetrics, connectivityTest] =
    await Promise.all([
      getCircuitBreakerStatus(),
      getCircuitBreakerMetrics(),
      testBGGConnectivity(),
    ]);

  const health = {
    timestamp: new Date().toISOString(),
    overall: {
      healthy: circuitBreakerStatus.healthy && connectivityTest.healthy,
      status:
        circuitBreakerStatus.healthy && connectivityTest.healthy
          ? 'healthy'
          : 'degraded',
    },
    circuitBreaker: {
      status: circuitBreakerStatus,
      metrics: circuitBreakerMetrics,
    },
    connectivity: connectivityTest,
    recommendations: [
      ...circuitBreakerStatus.recommendations,
      ...(connectivityTest.healthy
        ? []
        : ['BGG API connectivity issues detected']),
    ],
  };

  // Cache the result
  healthCache.set(cacheKey, {
    data: health,
    timestamp: Date.now(),
  });

  return health;
}

/**
 * GET /api/bgg/health
 * Returns comprehensive health status
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';
    const includeMetrics = url.searchParams.get('metrics') === 'true';

    const health = await getSystemHealth();

    // Emit health check event
    await eventBus.emit('bgg.health.check', {
      eventType: 'bgg.health.check',
      timestamp: new Date().toISOString(),
      eventId: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'bgg-health-endpoint',
      data: {
        healthy: health.overall.healthy,
        status: health.overall.status,
        circuitBreakerState: health.circuitBreaker.status.state,
        connectivityHealthy: health.connectivity.healthy,
      },
    });

    if (detailed) {
      return NextResponse.json({
        ...health,
        details: {
          circuitBreaker: {
            ...health.circuitBreaker,
            ...(includeMetrics
              ? { detailedMetrics: health.circuitBreaker.metrics }
              : {}),
          },
          connectivity: {
            ...health.connectivity,
            ...(includeMetrics ? { detailedTest: true } : {}),
          },
        },
      });
    }

    // Return simplified health status
    return NextResponse.json({
      healthy: health.overall.healthy,
      status: health.overall.status,
      timestamp: health.timestamp,
      circuitBreaker: health.circuitBreaker.status.state,
      connectivity: health.connectivity.healthy,
      recommendations: health.recommendations,
    });
  } catch (error) {
    console.error('Health check failed:', error);

    // Emit health check error event
    await eventBus.emit('bgg.health.error', {
      eventType: 'bgg.health.error',
      timestamp: new Date().toISOString(),
      eventId: `health_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'bgg-health-endpoint',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    return NextResponse.json(
      {
        healthy: false,
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bgg/health/reset
 * Reset circuit breaker (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // In production, add proper authentication/authorization
    const body = await request.json();

    if (body.action === 'reset_circuit_breaker') {
      const apiClient = (bggClient as any).apiClient;
      if (apiClient && typeof apiClient.resetCircuitBreaker === 'function') {
        apiClient.resetCircuitBreaker();

        // Emit reset event
        await eventBus.emit('bgg.circuit_breaker.reset', {
          eventType: 'bgg.circuit_breaker.reset',
          timestamp: new Date().toISOString(),
          eventId: `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'bgg-health-endpoint',
          data: {
            resetBy: 'health_endpoint',
            timestamp: new Date().toISOString(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Circuit breaker reset successfully',
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Circuit breaker reset not available',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Health reset failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Health reset failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
