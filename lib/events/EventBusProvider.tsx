/**
 * Event Bus Provider
 * React context provider for event bus access
 */

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { EventBus, EventHandler, eventBus } from './EventBus';
import { BGGEvent } from './BGGEvents';

// Event bus context
interface EventBusContextType {
  eventBus: EventBus;
  emit: <T>(eventName: string, data: T) => Promise<void>;
  on: <T>(eventName: string, handler: EventHandler<T>) => void;
  off: (eventName: string, handler?: EventHandler) => void;
  once: <T>(eventName: string, handler: EventHandler<T>) => void;
  getEventNames: () => string[];
  getHandlerCount: (eventName: string) => number;
  getTotalHandlerCount: () => number;
  hasHandlers: (eventName: string) => boolean;
  getMemoryStats: () => {
    totalHandlers: number;
    eventCount: number;
    averageHandlersPerEvent: number;
  };
}

const EventBusContext = createContext<EventBusContextType | null>(null);

// Event bus provider props
interface EventBusProviderProps {
  children: React.ReactNode;
  eventBus?: EventBus;
  enableDebugLogging?: boolean;
  enableMemoryMonitoring?: boolean;
}

// Event bus provider component
export function EventBusProvider({
  children,
  eventBus: customEventBus,
  enableDebugLogging = false,
  enableMemoryMonitoring = false,
}: EventBusProviderProps) {
  const eventBusRef = useRef<EventBus>(customEventBus || new EventBus());
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

  // Cleanup function
  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    cleanupFunctionsRef.current = [];
  }, []);

  // Setup debug logging
  useEffect(() => {
    if (!enableDebugLogging) {
      return;
    }

    const debugHandler = async (event: BGGEvent) => {
      console.log(`[EventBus] ${event.eventType}:`, event.data);
    };

    // Register debug handler for all BGG events
    const eventTypes = [
      'game.searched',
      'game.search.failed',
      'game.details.fetched',
      'game.details.failed',
      'game.cached',
      'cache.hit',
      'cache.miss',
      'cache.evicted',
      'bgg.api.error',
      'bgg.api.rate_limited',
      'bgg.api.success',
      'analytics.search',
      'analytics.game.view',
      'analytics.performance',
      'collection.fetched',
      'collection.failed',
    ];

    eventTypes.forEach(eventType => {
      eventBusRef.current.on(eventType, debugHandler);
      cleanupFunctionsRef.current.push(() => {
        eventBusRef.current.off(eventType, debugHandler);
      });
    });

    return cleanup;
  }, [enableDebugLogging, cleanup]);

  // Setup memory monitoring
  useEffect(() => {
    if (!enableMemoryMonitoring) {
      return;
    }

    const interval = setInterval(() => {
      const stats = eventBusRef.current.getMemoryStats();
      if (stats.totalHandlers > 100) {
        console.warn('[EventBus] High handler count detected:', stats);
      }
    }, 30000); // Check every 30 seconds

    cleanupFunctionsRef.current.push(() => {
      clearInterval(interval);
    });

    return cleanup;
  }, [enableMemoryMonitoring, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Context value
  const contextValue: EventBusContextType = {
    eventBus: eventBusRef.current,
    emit: useCallback(async (eventName: string, data: any) => {
      await eventBusRef.current.emit(eventName, data);
    }, []),
    on: useCallback((eventName: string, handler: EventHandler) => {
      eventBusRef.current.on(eventName, handler);
    }, []),
    off: useCallback((eventName: string, handler?: EventHandler) => {
      eventBusRef.current.off(eventName, handler);
    }, []),
    once: useCallback((eventName: string, handler: EventHandler) => {
      eventBusRef.current.once(eventName, handler);
    }, []),
    getEventNames: useCallback(() => {
      return eventBusRef.current.getEventNames();
    }, []),
    getHandlerCount: useCallback((eventName: string) => {
      return eventBusRef.current.getHandlerCount(eventName);
    }, []),
    getTotalHandlerCount: useCallback(() => {
      return eventBusRef.current.getTotalHandlerCount();
    }, []),
    hasHandlers: useCallback((eventName: string) => {
      return eventBusRef.current.hasHandlers(eventName);
    }, []),
    getMemoryStats: useCallback(() => {
      return eventBusRef.current.getMemoryStats();
    }, []),
  };

  return (
    <EventBusContext.Provider value={contextValue}>
      {children}
    </EventBusContext.Provider>
  );
}

// Hook to use event bus
export function useEventBus(): EventBusContextType {
  const context = useContext(EventBusContext);
  if (!context) {
    throw new Error('useEventBus must be used within an EventBusProvider');
  }
  return context;
}

// Hook for specific event handling
export function useEventHandler<T>(
  eventName: string,
  handler: EventHandler<T>,
  deps: React.DependencyList = []
) {
  const { on, off } = useEventBus();

  useEffect(() => {
    on(eventName, handler);
    return () => off(eventName, handler);
  }, [eventName, on, off, ...deps]);
}

// Hook for one-time event handling
export function useOnceEventHandler<T>(
  eventName: string,
  handler: EventHandler<T>,
  deps: React.DependencyList = []
) {
  const { once } = useEventBus();

  useEffect(() => {
    once(eventName, handler);
  }, [eventName, once, ...deps]);
}

// Hook for event emission
export function useEventEmitter() {
  const { emit } = useEventBus();
  return emit;
}

// Hook for BGG-specific events
export function useBGGEventHandler<T extends BGGEvent>(
  eventType: T['eventType'],
  handler: EventHandler<T>,
  deps: React.DependencyList = []
) {
  useEventHandler(eventType, handler, deps);
}

// Hook for BGG-specific one-time events
export function useBGGOnceEventHandler<T extends BGGEvent>(
  eventType: T['eventType'],
  handler: EventHandler<T>,
  deps: React.DependencyList = []
) {
  useOnceEventHandler(eventType, handler, deps);
}

// Hook for analytics events
export function useAnalyticsEventHandler(
  handler: EventHandler<BGGEvent>,
  deps: React.DependencyList = []
) {
  const analyticsEvents = [
    'analytics.search',
    'analytics.game.view',
    'analytics.performance',
  ];

  useEffect(() => {
    analyticsEvents.forEach(eventType => {
      eventBus.on(eventType, handler);
    });

    return () => {
      analyticsEvents.forEach(eventType => {
        eventBus.off(eventType, handler);
      });
    };
  }, [handler, ...deps]);
}

// Hook for error events
export function useErrorEventHandler(
  handler: EventHandler<BGGEvent>,
  deps: React.DependencyList = []
) {
  const errorEvents = [
    'game.search.failed',
    'game.details.failed',
    'collection.failed',
    'bgg.api.error',
    'bgg.api.rate_limited',
  ];

  useEffect(() => {
    errorEvents.forEach(eventType => {
      eventBus.on(eventType, handler);
    });

    return () => {
      errorEvents.forEach(eventType => {
        eventBus.off(eventType, handler);
      });
    };
  }, [handler, ...deps]);
}

// Hook for cache events
export function useCacheEventHandler(
  handler: EventHandler<BGGEvent>,
  deps: React.DependencyList = []
) {
  const cacheEvents = [
    'game.cached',
    'cache.hit',
    'cache.miss',
    'cache.evicted',
  ];

  useEffect(() => {
    cacheEvents.forEach(eventType => {
      eventBus.on(eventType, handler);
    });

    return () => {
      cacheEvents.forEach(eventType => {
        eventBus.off(eventType, handler);
      });
    };
  }, [handler, ...deps]);
}

// Export types
export type { EventBusContextType, EventBusProviderProps };
