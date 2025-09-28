# BGG Service Documentation

## Overview

The BGG Service is a robust, simplified implementation for integrating with the BoardGameGeek (BGG) XML API. It addresses the key issues from the previous implementation:

- **Accurate Type Classification**: Properly distinguishes between base games and expansions using inbound link analysis
- **Improved Search Results**: Better filtering and ranking of search results
- **Robust Error Handling**: Graceful degradation and user-friendly error messages
- **Smart Caching**: Intelligent caching strategy with automatic cleanup

## Architecture

```
BGGService (Main Orchestrator)
├── BGGAPIClient (HTTP requests & rate limiting)
├── CacheManager (In-memory caching)
├── XML Parser (Response parsing & type classification)
└── Search Engine (Query optimization & result ranking)
```

## Key Features

### 1. **Accurate Type Classification**

The service uses a two-step approach to ensure accurate classification:

1. **BGG Search API**: Initial filtering by `type=boardgame` or `type=boardgameexpansion`
2. **Inbound Link Analysis**: Metadata analysis to detect expansions that BGG incorrectly classifies

```typescript
// Example: A game marked as "boardgame" but has inbound expansion links
// will be correctly classified as an expansion
const hasInboundExpansion = inboundLinks.some(
  link =>
    link.type === 'boardgameexpansion' || link.type === 'boardgameintegration'
);
```

### 2. **Smart Search Strategy**

- **Exact Search First**: For queries ≥ 4 characters, tries exact match before fuzzy search
- **Fuzzy Fallback**: Always falls back to fuzzy search for better coverage
- **Type-Aware Filtering**: Automatically filters results based on user preferences

### 3. **Intelligent Caching**

- **Search Results**: 30 minutes TTL with dynamic adjustment based on performance
- **Game Metadata**: 24 hours TTL for frequently accessed data
- **Automatic Cleanup**: Periodic cleanup of expired entries

## Usage Examples

### Basic Search

```typescript
import { bggService } from '@/lib/bgg';

// Search for base games only
const results = await bggService.searchGames('gloomhaven', {
  gameType: 'base-game',
});

// Search for expansions only
const expansions = await bggService.searchGames('gloomhaven', {
  gameType: 'expansion',
});

// Search without type filtering
const allResults = await bggService.searchGames('gloomhaven');
```

### Get Game Details

```typescript
// Get complete game information
const gameDetails = await bggService.getGameDetails('167791');

if (gameDetails) {
  console.log(`Game: ${gameDetails.name}`);
  console.log(`Type: ${gameDetails.isExpansion ? 'Expansion' : 'Base Game'}`);
  console.log(`Players: ${gameDetails.minplayers}-${gameDetails.maxplayers}`);
  console.log(`Play Time: ${gameDetails.playingtime} minutes`);
}
```

### Advanced Filtering

```typescript
// Search with multiple filters
const results = await bggService.searchGames('strategy', {
  gameType: 'base-game',
  minPlayers: 2,
  maxPlayers: 4,
});
```

## Configuration

### Rate Limiting

```typescript
import { DEFAULT_BGG_CONFIG } from '@/lib/bgg';

// Conservative rate limiting to avoid BGG API issues
const config = {
  ...DEFAULT_BGG_CONFIG,
  rateLimitDelay: 1000, // 1 second between requests
  searchTimeout: 15000, // 15 second timeout
};
```

### Cache Settings

```typescript
import { CACHE_CONFIG } from '@/lib/bgg';

// Cache configuration
const cacheSettings = {
  searchTTL: 30 * 60 * 1000, // 30 minutes
  gameDetailsTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxCacheSize: 1000, // Maximum entries
};
```

## Error Handling

The service provides structured error handling with user-friendly messages:

```typescript
try {
  const results = await bggService.searchGames('gloomhaven');
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    // Show retry button with countdown
    console.log('BGG API is busy, retry in 5 seconds');
  } else if (error.code === 'NETWORK_ERROR') {
    // Show network error message
    console.log('Check your internet connection');
  }
}
```

### Error Types

- `RATE_LIMIT`: BGG API rate limit exceeded
- `API_UNAVAILABLE`: BGG API is down or unresponsive
- `NETWORK_ERROR`: Connection issues
- `PARSE_ERROR`: Invalid response from BGG
- `INVALID_RESPONSE`: Malformed data

## Performance Optimizations

### 1. **Adaptive Caching**

- Fast searches get longer cache duration
- Comprehensive results get extended TTL
- Automatic cache size management

### 2. **Batch Processing**

- Metadata fetched in batches of 15 games
- Reduced API calls for better performance
- Parallel processing where possible

### 3. **Smart Fallbacks**

- Returns expired cache results on API failure
- Graceful degradation for partial failures
- User-friendly error messages

## Monitoring & Debugging

### Cache Statistics

```typescript
const stats = bggService.getCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Hit rate: ${stats.hitRate}%`);
console.log(`Total queries: ${stats.totalQueries}`);
```

### Performance Metrics

```typescript
const efficiency = await bggService.getCacheEfficiency();
console.log(`Memory hit rate: ${efficiency.memoryHitRate}%`);
console.log(`Total memory size: ${efficiency.totalMemorySize}`);
```

### Debug Logging

The service provides comprehensive logging for debugging:

```typescript
// Console output example:
// 🔍 BGG Search: Starting search for "gloomhaven" with filters: {gameType: 'base-game'}
// 🎯 Trying exact search for "gloomhaven"
// ✅ Exact search found 3 results
// 📊 Fetching metadata for 3 top results
// 🔍 Type filtering: 3 -> 2 base games
// ✅ Search completed in 1200ms, found 2 results
```

## Troubleshooting

### Common Issues

#### 1. **No Search Results**

- Check query length (minimum 2 characters)
- Verify BGG API is accessible
- Check browser console for error messages

#### 2. **Slow Performance**

- Check cache hit rates
- Verify network connection
- Consider reducing batch sizes

#### 3. **Type Classification Issues**

- Check console logs for type correction messages
- Verify inbound link analysis is working
- Clear cache if needed

### Debug Commands

```typescript
// Clear all caches
bggService.clearCache();

// Clear specific query cache
bggService.clearCacheForQuery('gloomhaven');

// Get cache keys for debugging
const cacheManager = new CacheManager();
const keys = cacheManager.getMemoryCacheKeys();
console.log('Cache keys:', keys);
```

## Best Practices

### 1. **Query Optimization**

- Use specific game names for best results
- Avoid very short queries (< 3 characters)
- Use type filtering to reduce noise

### 2. **Error Handling**

- Always wrap API calls in try-catch
- Provide user-friendly error messages
- Implement retry logic for rate limits

### 3. **Caching Strategy**

- Don't clear cache unnecessarily
- Monitor cache hit rates
- Adjust TTL based on usage patterns

### 4. **Rate Limiting**

- Respect BGG's API guidelines
- Use conservative delays in production
- Implement exponential backoff for retries

## Future Enhancements

### Planned Features

1. **Database Caching**: Persistent storage for game metadata
2. **Predictive Caching**: Pre-cache popular searches
3. **Advanced Filtering**: Mechanics, categories, player count
4. **Search Analytics**: Track user behavior patterns
5. **Redis Integration**: Distributed caching for scalability

### Performance Improvements

1. **Parallel Processing**: Concurrent API calls where possible
2. **CDN Integration**: Static game data caching
3. **Smart Prefetching**: Anticipate user searches
4. **Response Compression**: Reduce bandwidth usage

## API Reference

### BGGService Methods

#### `searchGames(query, filters?)`

- **query**: Search string (minimum 2 characters)
- **filters**: Optional search filters
- **Returns**: Promise<BGGSearchResult[]>

#### `getGameDetails(gameId)`

- **gameId**: BGG game ID
- **Returns**: Promise<BGGGameDetails | null>

#### `getCacheStats()`

- **Returns**: CacheStats object

#### `clearCache()`

- **Returns**: void

### SearchFilters Interface

```typescript
interface SearchFilters {
  gameType?: 'base-game' | 'expansion';
  minPlayers?: number;
  maxPlayers?: number;
  minRating?: number;
  maxRating?: number;
  mechanics?: string[];
  categories?: string[];
}
```

### BGGSearchResult Interface

```typescript
interface BGGSearchResult {
  id: string;
  name: string;
  yearpublished?: string;
  rank?: string;
  bayesaverage?: string;
  type: 'boardgame' | 'boardgameexpansion';
  thumbnail?: string;
  bggLink: string;
  isExpansion: boolean;
  hasInboundExpansionLink: boolean;
  searchScore: number;
}
```

## Conclusion

This BGG service implementation provides a robust, user-friendly interface to the BoardGameGeek API while addressing the key issues from previous implementations. The focus on accurate type classification, intelligent caching, and comprehensive error handling ensures a reliable and performant user experience.

For questions or issues, refer to the console logs for detailed debugging information, and use the provided monitoring tools to track performance and cache efficiency.
