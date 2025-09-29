/**
 * Event System Usage Example
 * Example React component showing how to use the event system
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useEventBus, useBGGEventHandler, useAnalyticsEventHandler } from './EventBusProvider';
import { BGGEvent } from './BGGEvents';

// Example component that uses the event system
export function EventSystemExample() {
  const { emit } = useEventBus();
  const [events, setEvents] = useState<Array<{ type: string; timestamp: string; data: any }>>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    searchEvents: 0,
    cacheEvents: 0,
    errorEvents: 0,
  });

  // Track all BGG events
  useBGGEventHandler((event: BGGEvent) => {
    setEvents(prev => [...prev, {
      type: event.eventType,
      timestamp: event.timestamp,
      data: event.data,
    }].slice(-50)); // Keep only last 50 events

    setStats(prev => ({
      totalEvents: prev.totalEvents + 1,
      searchEvents: event.eventType.includes('search') ? prev.searchEvents + 1 : prev.searchEvents,
      cacheEvents: event.eventType.includes('cache') ? prev.cacheEvents + 1 : prev.cacheEvents,
      errorEvents: event.eventType.includes('error') || event.eventType.includes('failed') ? prev.errorEvents + 1 : prev.errorEvents,
    }));
  });

  // Track analytics events specifically
  useAnalyticsEventHandler((event: BGGEvent) => {
    console.log('Analytics event received:', event.eventType, event.data);
  });

  // Example function to emit a test event
  const emitTestEvent = async () => {
    await emit('test.event', {
      message: 'Hello from React component!',
      timestamp: new Date().toISOString(),
    });
  };

  // Example function to simulate BGG search
  const simulateBGGSearch = async () => {
    const searchEvent = {
      eventType: 'game.searched',
      timestamp: new Date().toISOString(),
      eventId: `test_${Date.now()}`,
      source: 'bgg-service',
      data: {
        query: 'Catan',
        filters: { gameType: 'base-game' },
        results: {
          total: 1,
          itemsCount: 1,
          searchStrategy: 'exact',
        },
        performance: {
          queryTime: 150,
          cacheHit: false,
          apiCalls: 1,
        },
      },
    };

    await emit('game.searched', searchEvent);
  };

  // Example function to simulate cache event
  const simulateCacheEvent = async () => {
    const cacheEvent = {
      eventType: 'cache.hit',
      timestamp: new Date().toISOString(),
      eventId: `test_${Date.now()}`,
      source: 'bgg-cache',
      data: {
        cacheKey: 'search:test:default',
        dataType: 'search',
        age: 5000,
      },
    };

    await emit('cache.hit', cacheEvent);
  };

  // Example function to simulate error event
  const simulateErrorEvent = async () => {
    const errorEvent = {
      eventType: 'bgg.api.error',
      timestamp: new Date().toISOString(),
      eventId: `test_${Date.now()}`,
      source: 'bgg-api',
      data: {
        operation: 'searchGames',
        error: {
          code: 'RATE_LIMIT',
          message: 'Rate limit exceeded',
          userMessage: 'Too many requests. Please wait before trying again.',
        },
        retryable: true,
      },
    };

    await emit('bgg.api.error', errorEvent);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Event System Example</h1>
      
      {/* Statistics */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Event Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalEvents}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.searchEvents}</div>
            <div className="text-sm text-gray-600">Search Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.cacheEvents}</div>
            <div className="text-sm text-gray-600">Cache Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.errorEvents}</div>
            <div className="text-sm text-gray-600">Error Events</div>
          </div>
        </div>
      </div>

      {/* Event Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Event Controls</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={emitTestEvent}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Emit Test Event
          </button>
          <button
            onClick={simulateBGGSearch}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Simulate BGG Search
          </button>
          <button
            onClick={simulateCacheEvent}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Simulate Cache Event
          </button>
          <button
            onClick={simulateErrorEvent}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Simulate Error Event
          </button>
        </div>
      </div>

      {/* Event List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
        <div className="max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No events yet. Click a button above to emit events.</p>
          ) : (
            <div className="space-y-2">
              {events.slice().reverse().map((event, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{event.type}</div>
                      <div className="text-xs text-gray-500">{event.timestamp}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      #{events.length - index}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {JSON.stringify(event.data, null, 2).substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Example of a component that listens to specific events
export function SearchAnalyticsComponent() {
  const [searchStats, setSearchStats] = useState({
    totalSearches: 0,
    averageQueryTime: 0,
    cacheHitRate: 0,
  });

  // Listen to search events
  useBGGEventHandler((event: BGGEvent) => {
    if (event.eventType === 'game.searched') {
      setSearchStats(prev => ({
        totalSearches: prev.totalSearches + 1,
        averageQueryTime: (prev.averageQueryTime + event.data.performance.queryTime) / 2,
        cacheHitRate: event.data.performance.cacheHit ? 
          (prev.cacheHitRate + 1) / 2 : 
          prev.cacheHitRate,
      }));
    }
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Search Analytics</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold">{searchStats.totalSearches}</div>
          <div className="text-sm text-gray-600">Total Searches</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">{Math.round(searchStats.averageQueryTime)}ms</div>
          <div className="text-sm text-gray-600">Avg Query Time</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">{Math.round(searchStats.cacheHitRate * 100)}%</div>
          <div className="text-sm text-gray-600">Cache Hit Rate</div>
        </div>
      </div>
    </div>
  );
}

// Example of a component that listens to error events
export function ErrorMonitoringComponent() {
  const [errors, setErrors] = useState<Array<{ type: string; message: string; timestamp: string }>>([]);

  // Listen to error events
  useBGGEventHandler((event: BGGEvent) => {
    if (event.eventType.includes('error') || event.eventType.includes('failed')) {
      setErrors(prev => [...prev, {
        type: event.eventType,
        message: event.data.error?.message || 'Unknown error',
        timestamp: event.timestamp,
      }].slice(-10)); // Keep only last 10 errors
    }
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Error Monitoring</h3>
      {errors.length === 0 ? (
        <p className="text-green-600 text-sm">No errors detected</p>
      ) : (
        <div className="space-y-2">
          {errors.slice().reverse().map((error, index) => (
            <div key={index} className="bg-red-50 border-l-4 border-red-500 p-2">
              <div className="text-sm font-medium text-red-800">{error.type}</div>
              <div className="text-xs text-red-600">{error.message}</div>
              <div className="text-xs text-red-500">{error.timestamp}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}