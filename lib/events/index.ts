/**
 * Event System Exports
 * Centralized exports for the event-driven architecture
 */

// Core event bus
export { EventBus, eventBus } from './EventBus';
export type { EventHandler, EventBusOptions } from './EventBus';

// BGG events
export {
  BGGEventFactory,
  type BGGEvent,
  type BGGEventType,
  type BGGEventData,
  type GameSearchedEvent,
  type GameSearchFailedEvent,
  type GameDetailsFetchedEvent,
  type GameDetailsFailedEvent,
  type GameCachedEvent,
  type CacheHitEvent,
  type CacheMissEvent,
  type CacheEvictedEvent,
  type BGGApiErrorEvent,
  type BGGApiRateLimitedEvent,
  type BGGApiSuccessEvent,
  type SearchAnalyticsEvent,
  type GameViewAnalyticsEvent,
  type PerformanceMetricsEvent,
  type CollectionFetchedEvent,
  type CollectionFailedEvent,
} from './BGGEvents';

// Event handlers
export {
  GameAnalyticsHandler,
  gameAnalyticsHandler,
} from './handlers/GameAnalyticsHandler';
export {
  GameCacheHandler,
  gameCacheHandler,
} from './handlers/GameCacheHandler';
export {
  ErrorReportingHandler,
  errorReportingHandler,
} from './handlers/ErrorReportingHandler';
export type { ErrorReport } from './handlers/ErrorReportingHandler';

// React provider and hooks
export {
  EventBusProvider,
  useEventBus,
  useEventHandler,
  useOnceEventHandler,
  useEventEmitter,
  useBGGEventHandler,
  useBGGOnceEventHandler,
  useAnalyticsEventHandler,
  useErrorEventHandler,
  useCacheEventHandler,
} from './EventBusProvider';
export type {
  EventBusContextType,
  EventBusProviderProps,
} from './EventBusProvider';
