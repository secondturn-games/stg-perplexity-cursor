# Event-Driven Architecture Foundation

This directory contains a comprehensive event-driven architecture system for the Baltic Board Game Marketplace's BGG integration. The system enables loose coupling, better separation of concerns, and provides a foundation for future scalability.

## 🏗️ Architecture Overview

The event system consists of:

- **EventBus**: Core event handling with type-safe event management
- **BGG Events**: Domain-specific event definitions for BoardGameGeek operations
- **Event Handlers**: Specialized handlers for analytics, caching, and error reporting
- **React Integration**: Context providers and hooks for React components
- **Testing**: Comprehensive test suite for validation

## 📁 File Structure

```
lib/events/
├── EventBus.ts                    # Core event bus implementation
├── BGGEvents.ts                   # BGG-specific event definitions
├── EventBusProvider.tsx           # React context provider and hooks
├── index.ts                       # Centralized exports
├── README.md                      # This documentation
├── test-event-system.ts           # Comprehensive test suite
├── test-bgg-integration.ts        # BGG service integration tests
├── simple-test.ts                 # Quick validation test
├── example-usage.tsx              # React component examples
└── handlers/
    ├── GameAnalyticsHandler.ts    # Analytics tracking
    ├── GameCacheHandler.ts        # Cache management
    └── ErrorReportingHandler.ts   # Error monitoring
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { eventBus, BGGEventFactory } from '@/lib/events';

// Emit an event
await eventBus.emit('game.searched', BGGEventFactory.createGameSearchedEvent(
  'Catan',
  { gameType: 'base-game' },
  searchResults,
  performance
));

// Listen to events
eventBus.on('game.searched', (event) => {
  console.log('Search completed:', event.data.query);
});
```

### React Integration

```tsx
import { EventBusProvider, useBGGEventHandler } from '@/lib/events';

function App() {
  return (
    <EventBusProvider enableDebugLogging={true}>
      <YourComponents />
    </EventBusProvider>
  );
}

function SearchComponent() {
  useBGGEventHandler('game.searched', (event) => {
    console.log('Search event received:', event.data);
  });

  return <div>Search Component</div>;
}
```

## 📊 Event Types

### Search Events
- `game.searched` - Successful game search completed
- `game.search.failed` - Search operation failed

### Game Details Events
- `game.details.fetched` - Game details successfully retrieved
- `game.details.failed` - Game details retrieval failed

### Cache Events
- `game.cached` - Data cached successfully
- `cache.hit` - Cache hit occurred
- `cache.miss` - Cache miss occurred
- `cache.evicted` - Data evicted from cache

### API Events
- `bgg.api.error` - BGG API error occurred
- `bgg.api.rate_limited` - Rate limit exceeded
- `bgg.api.success` - API call successful

### Analytics Events
- `analytics.search` - Search analytics data
- `analytics.game.view` - Game view analytics
- `analytics.performance` - Performance metrics

## 🔧 Event Handlers

### GameAnalyticsHandler
Tracks search patterns, user behavior, and performance metrics.

```typescript
import { gameAnalyticsHandler } from '@/lib/events';

// Get analytics summary
const stats = gameAnalyticsHandler.getAnalyticsSummary();
console.log('Search history:', stats.searchHistory);
```

### GameCacheHandler
Manages cache statistics, optimization suggestions, and eviction tracking.

```typescript
import { gameCacheHandler } from '@/lib/events';

// Get cache statistics
const stats = gameCacheHandler.getCacheStatistics();
console.log('Cache hit rate:', stats.hitRate);
```

### ErrorReportingHandler
Monitors errors, tracks failure patterns, and provides error analytics.

```typescript
import { errorReportingHandler } from '@/lib/events';

// Get error statistics
const stats = errorReportingHandler.getErrorStatistics();
console.log('Total errors:', stats.totalErrors);
```

## 🧪 Testing

### Run Tests

```bash
# Run comprehensive test suite
npx tsx lib/events/test-event-system.ts

# Run simple validation test
npx tsx lib/events/simple-test.ts

# Run BGG integration test
npx tsx lib/events/test-bgg-integration.ts
```

### Test Coverage

- ✅ Basic event emission and handling
- ✅ BGG-specific event types
- ✅ Event handler functionality
- ✅ Memory management and cleanup
- ✅ Error handling and recovery
- ✅ React integration
- ✅ BGG service integration

## 🔄 BGG Service Integration

The BGG service has been updated to emit events at key points:

### Search Operations
- Emits `cache.miss` when cache lookup fails
- Emits `cache.hit` when cache lookup succeeds
- Emits `game.cached` when data is stored in cache
- Emits `game.searched` when search completes successfully
- Emits `game.search.failed` when search fails

### Game Details Operations
- Emits `cache.miss` when game details not in cache
- Emits `cache.hit` when game details found in cache
- Emits `game.cached` when game details are cached
- Emits `game.details.fetched` when details retrieved successfully
- Emits `game.details.failed` when retrieval fails

## 🎯 Benefits

### 1. Loose Coupling
- Services communicate through events, not direct dependencies
- Easy to add new functionality without modifying existing code
- Better testability and maintainability

### 2. Separation of Concerns
- Analytics logic separated from business logic
- Cache management isolated from data retrieval
- Error handling centralized and consistent

### 3. Scalability
- Easy to add new event handlers
- Background processing capabilities
- Event-driven architecture supports microservices

### 4. Observability
- Comprehensive event tracking
- Performance monitoring
- Error analytics and debugging

## 🔧 Configuration

### EventBus Options

```typescript
const eventBus = new EventBus({
  maxHandlers: 1000,              // Maximum number of handlers
  enableErrorHandling: true,       // Enable error handling
  enableMemoryLeakPrevention: true // Enable memory cleanup
});
```

### React Provider Options

```tsx
<EventBusProvider
  enableDebugLogging={true}        // Log all events to console
  enableMemoryMonitoring={true}    // Monitor memory usage
>
  <YourApp />
</EventBusProvider>
```

## 📈 Performance Considerations

### Memory Management
- Automatic cleanup of unused handlers
- Configurable handler limits
- Memory usage monitoring

### Error Handling
- Isolated error handling prevents system crashes
- Error events for debugging and monitoring
- Graceful degradation on handler failures

### Event Batching
- Events are processed asynchronously
- No blocking operations in event handlers
- Efficient memory usage with cleanup

## 🚨 Error Handling

The event system includes comprehensive error handling:

1. **Handler Isolation**: Errors in one handler don't affect others
2. **Error Events**: Failed handlers emit error events for monitoring
3. **Graceful Degradation**: System continues working even with handler failures
4. **Debugging Support**: Detailed error logging and context

## 🔮 Future Enhancements

### Planned Features
- Event persistence for debugging
- Event replay capabilities
- Advanced filtering and routing
- Event versioning and migration
- Distributed event processing

### Integration Opportunities
- Real-time analytics dashboards
- Automated performance optimization
- Predictive caching based on usage patterns
- Advanced error alerting and monitoring

## 📚 Examples

See `example-usage.tsx` for comprehensive React component examples showing:
- Event tracking components
- Analytics dashboards
- Error monitoring displays
- Real-time event visualization

## 🤝 Contributing

When adding new events or handlers:

1. Define event types in `BGGEvents.ts`
2. Create event factory methods
3. Add handlers in the `handlers/` directory
4. Update the test suite
5. Add React hooks if needed
6. Update this documentation

## 📄 License

This event system is part of the Baltic Board Game Marketplace project and follows the same licensing terms.