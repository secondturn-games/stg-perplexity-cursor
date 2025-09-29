/**
 * Event Bus System
 * Core event bus implementation with type-safe event handling
 */

export type EventHandler<T = any> = (data: T) => Promise<void> | void;

export interface EventBusOptions {
  maxHandlers?: number;
  enableErrorHandling?: boolean;
  enableMemoryLeakPrevention?: boolean;
}

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private options: Required<EventBusOptions>;
  private handlerCount: number = 0;

  constructor(options: EventBusOptions = {}) {
    this.options = {
      maxHandlers: options.maxHandlers ?? 1000,
      enableErrorHandling: options.enableErrorHandling ?? true,
      enableMemoryLeakPrevention: options.enableMemoryLeakPrevention ?? true,
    };
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<T>(eventName: string, data: T): Promise<void> {
    const handlers = this.handlers.get(eventName);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises: Promise<void>[] = [];

    for (const handler of handlers) {
      if (this.options.enableErrorHandling) {
        promises.push(this.safeExecuteHandler(handler, data, eventName));
      } else {
        const result = handler(data);
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * Register an event handler
   */
  on<T>(eventName: string, handler: EventHandler<T>): void {
    if (this.handlerCount >= this.options.maxHandlers) {
      console.warn(
        `EventBus: Maximum handler limit (${this.options.maxHandlers}) reached. Cannot register more handlers.`
      );
      return;
    }

    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)!.add(handler);
    this.handlerCount++;

    if (this.options.enableMemoryLeakPrevention) {
      this.scheduleCleanup();
    }
  }

  /**
   * Unregister an event handler
   */
  off(eventName: string, handler?: EventHandler): void {
    const handlers = this.handlers.get(eventName);
    if (!handlers) {
      return;
    }

    if (handler) {
      // Remove specific handler
      if (handlers.delete(handler)) {
        this.handlerCount--;
      }
    } else {
      // Remove all handlers for this event
      this.handlerCount -= handlers.size;
      handlers.clear();
    }

    // Clean up empty event sets
    if (handlers.size === 0) {
      this.handlers.delete(eventName);
    }
  }

  /**
   * Register a one-time event handler
   */
  once<T>(eventName: string, handler: EventHandler<T>): void {
    const onceHandler = async (data: T) => {
      await handler(data);
      this.off(eventName, onceHandler);
    };

    this.on(eventName, onceHandler);
  }

  /**
   * Get all registered event names
   */
  getEventNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get handler count for a specific event
   */
  getHandlerCount(eventName: string): number {
    return this.handlers.get(eventName)?.size ?? 0;
  }

  /**
   * Get total handler count
   */
  getTotalHandlerCount(): number {
    return this.handlerCount;
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.handlerCount = 0;
  }

  /**
   * Check if event has handlers
   */
  hasHandlers(eventName: string): boolean {
    return (
      this.handlers.has(eventName) && this.handlers.get(eventName)!.size > 0
    );
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    totalHandlers: number;
    eventCount: number;
    averageHandlersPerEvent: number;
  } {
    const eventCount = this.handlers.size;
    const averageHandlersPerEvent =
      eventCount > 0 ? this.handlerCount / eventCount : 0;

    return {
      totalHandlers: this.handlerCount,
      eventCount,
      averageHandlersPerEvent: Math.round(averageHandlersPerEvent * 100) / 100,
    };
  }

  /**
   * Safely execute a handler with error handling
   */
  private async safeExecuteHandler<T>(
    handler: EventHandler<T>,
    data: T,
    eventName: string
  ): Promise<void> {
    try {
      const result = handler(data);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      console.error(
        `EventBus: Error in handler for event "${eventName}":`,
        error
      );

      // Emit error event for debugging
      this.emit('eventbus:error', {
        eventName,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }).catch(() => {
        // Ignore errors in error handling to prevent infinite loops
      });
    }
  }

  /**
   * Schedule cleanup for memory leak prevention
   */
  private scheduleCleanup(): void {
    if (!this.options.enableMemoryLeakPrevention) {
      return;
    }

    // Clean up every 5 minutes
    setTimeout(
      () => {
        this.performCleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Perform memory cleanup
   */
  private performCleanup(): void {
    // Remove empty event sets
    for (const [eventName, handlers] of this.handlers.entries()) {
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    }

    // Log memory stats if debug is enabled
    if (process.env.NODE_ENV === 'development') {
      const stats = this.getMemoryStats();
      console.debug('EventBus: Memory cleanup completed', stats);
    }
  }
}

// Global event bus instance
export const eventBus = new EventBus({
  maxHandlers: 1000,
  enableErrorHandling: true,
  enableMemoryLeakPrevention: true,
});
