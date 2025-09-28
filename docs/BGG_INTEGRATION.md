# BoardGameGeek (BGG) API Integration

This document describes the comprehensive BGG API integration for the Second Turn Games marketplace.

## Overview

The BGG integration provides:

- **Rate limiting**: 2 requests/second to respect BGG's API limits
- **XML parsing**: Robust parsing of BGG's XML responses
- **24-hour caching**: Automatic caching in the games table
- **Image processing**: Automatic image download and storage
- **Batch operations**: Efficient bulk game data updates
- **Error handling**: Comprehensive error handling with retry logic
- **TypeScript support**: Full type safety for all BGG data

## Architecture

### Core Components

1. **BGG Client** (`lib/bgg-client.ts`)
   - Main API client with rate limiting
   - XML parsing and data transformation
   - Caching and error handling

2. **API Routes** (`app/api/bgg/[...slug]/route.ts`)
   - RESTful API endpoints
   - Rate limiting per IP
   - Batch operations support

3. **React Hooks** (`hooks/useBGG.ts`)
   - Easy integration with React components
   - State management for API calls
   - Error handling and loading states

4. **Database Integration** (`scripts/migrations/002_bgg_integration.sql`)
   - BGG-specific columns in games table
   - Optimized indexes for BGG data
   - Helper functions for BGG queries

## API Endpoints

### Search Games

```
GET /api/bgg/search?q={query}&exact={boolean}
```

Search for games on BGG.

**Parameters:**

- `q` (required): Search query
- `exact` (optional): Exact match search

**Response:**

```json
{
  "items": [
    {
      "id": "13",
      "name": "Catan",
      "yearpublished": "1995",
      "type": "boardgame"
    }
  ],
  "total": 1
}
```

### Get Game Details

```
GET /api/bgg/game/{gameId}?process_images={boolean}
```

Get detailed information about a specific game.

**Parameters:**

- `gameId` (required): BGG game ID
- `process_images` (optional): Process and store images

**Response:**

```json
{
  "id": "13",
  "title": "Catan",
  "description": "The game of Catan...",
  "year_published": 1995,
  "min_players": 3,
  "max_players": 4,
  "playing_time": 60,
  "bgg_rating": 7.2,
  "bgg_rank": 1,
  "categories": ["Strategy", "Economic"],
  "mechanics": ["Trading", "Dice Rolling"],
  "designers": ["Klaus Teuber"],
  "artists": ["Michael Menzel"],
  "publishers": ["Catan Studio"]
}
```

### Get User Collection

```
GET /api/bgg/collection?username={username}
```

Get a user's game collection.

**Parameters:**

- `username` (required): BGG username

**Response:**

```json
{
  "items": [
    {
      "id": "13",
      "name": "Catan",
      "yearpublished": 1995,
      "owned": true,
      "numplays": 5,
      "comment": "Great game!"
    }
  ],
  "total": 1
}
```

### Batch Update Games

```
POST /api/bgg/batch
```

Update multiple games in batch.

**Request Body:**

```json
{
  "gameIds": ["13", "9209", "266192"]
}
```

**Response:**

```json
{
  "gameIds": ["13", "9209", "266192"],
  "operation": "sync",
  "status": "completed",
  "results": [
    {
      "gameId": "13",
      "status": "success"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "completedAt": "2024-01-01T00:01:00Z"
}
```

### Sync Popular Games

```
GET /api/bgg/sync?type=popular&limit={number}
```

Sync popular games from BGG.

**Parameters:**

- `type`: "popular" for popular games
- `limit` (optional): Number of games to sync (default: 50)

## Usage Examples

### React Hook Usage

```tsx
import { useBGG } from '@/hooks/useBGG';

function GameSearch() {
  const { searchGames, searchState } = useBGG();

  const handleSearch = async (query: string) => {
    try {
      await searchGames(query);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div>
      {searchState.loading && <div>Searching...</div>}
      {searchState.error && <div>Error: {searchState.error.message}</div>}
      {searchState.data && (
        <div>
          {searchState.data.items.map(game => (
            <div key={game.id}>{game.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Direct API Usage

```typescript
import { bggClient } from '@/lib/bgg-client';

// Search games
const searchResults = await bggClient.searchGames('Catan');

// Get game details
const gameDetails = await bggClient.getGameDetails('13');

// Get user collection
const collection = await bggClient.getUserCollection('username');

// Batch update
const batchResult = await bggClient.batchUpdateGames(['13', '9209', '266192']);
```

## Database Schema

### Games Table Extensions

The games table has been extended with BGG-specific columns:

```sql
ALTER TABLE public.games
ADD COLUMN bgg_id INTEGER UNIQUE,
ADD COLUMN bgg_rating DECIMAL(3,2),
ADD COLUMN bgg_rank INTEGER,
ADD COLUMN weight_rating DECIMAL(2,1),
ADD COLUMN age_rating INTEGER,
ADD COLUMN last_bgg_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN designers TEXT[] DEFAULT '{}',
ADD COLUMN artists TEXT[] DEFAULT '{}',
ADD COLUMN publishers TEXT[] DEFAULT '{}',
ADD COLUMN languages TEXT[] DEFAULT '{}';
```

### Helper Functions

Several helper functions are available for querying BGG data:

```sql
-- Get games by BGG rank range
SELECT * FROM get_games_by_bgg_rank(1, 100);

-- Search games by designer
SELECT * FROM search_games_by_designer('Klaus Teuber');

-- Get games by category
SELECT * FROM get_games_by_category('Strategy');

-- Get games by mechanic
SELECT * FROM get_games_by_mechanic('Trading');

-- Get popular games
SELECT * FROM get_popular_games(50);

-- Get recently synced games
SELECT * FROM get_recently_synced_games(24);
```

## Rate Limiting

The integration implements strict rate limiting:

- **2 requests per second** to BGG API
- **30 requests per minute** per IP for our API
- **Automatic queuing** of requests
- **Exponential backoff** for retries

## Caching Strategy

### In-Memory Cache

- **24-hour TTL** for all cached data
- **LRU eviction** when cache is full
- **Automatic invalidation** of expired entries

### Database Cache

- **Automatic storage** of game details in games table
- **Last sync tracking** for cache invalidation
- **Batch updates** for efficient data management

## Image Processing

### Automatic Processing

- **Download** images from BGG
- **Resize** and optimize for web
- **Store** in Supabase Storage
- **Update** database with processed URLs

### Storage Structure

```
game-images/
├── games/
│   ├── {gameId}/
│   │   ├── main.jpg
│   │   └── thumbnail.jpg
```

## Error Handling

### Error Types

- **API Errors**: BGG API failures
- **Network Errors**: Connection issues
- **Parsing Errors**: XML parsing failures
- **Rate Limit Errors**: Too many requests

### Retry Logic

- **3 retry attempts** with exponential backoff
- **Base delay**: 1 second
- **Max delay**: 10 seconds
- **Backoff multiplier**: 2x

## Testing

### Test Script

Run the test script to verify integration:

```bash
node scripts/test-bgg-integration.js
```

### Test Page

Visit `/test-bgg` to use the interactive test interface.

### Popular Games Test

The integration is tested with these popular games:

- **Catan** (ID: 13)
- **Ticket to Ride** (ID: 9209)
- **Wingspan** (ID: 266192)

## Configuration

### Environment Variables

```env
# BGG API Configuration
BGG_API_URL=https://www.boardgamegeek.com/xmlapi2
BGG_RATE_LIMIT=2
BGG_CACHE_TTL=86400000

# Image Processing
BGG_IMAGE_PROCESSING=true
BGG_MAX_IMAGE_SIZE=5242880
BGG_IMAGE_QUALITY=0.8
```

### Client Configuration

```typescript
const config = {
  baseUrl: 'https://www.boardgamegeek.com/xmlapi2',
  rateLimit: {
    requestsPerSecond: 2,
  },
  cache: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 1000,
  },
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
};
```

## Monitoring

### Logging

- **API calls** are logged with timestamps
- **Errors** are logged with full context
- **Rate limiting** events are tracked
- **Cache hits/misses** are monitored

### Metrics

- **Request count** per endpoint
- **Response times** for API calls
- **Error rates** by operation type
- **Cache hit ratio**

## Security

### Rate Limiting

- **Per-IP limits** prevent abuse
- **Global rate limits** respect BGG's limits
- **Request queuing** ensures fair access

### Data Validation

- **Input sanitization** for all parameters
- **Output validation** for API responses
- **Type checking** with TypeScript

## Performance

### Optimizations

- **Connection pooling** for database queries
- **Batch operations** for multiple games
- **Lazy loading** of images
- **Efficient indexing** for BGG data

### Caching

- **Multi-level caching** (memory + database)
- **Smart invalidation** based on sync times
- **Compressed storage** for images

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**
   - Wait for rate limit to reset
   - Check for duplicate requests
   - Implement request queuing

2. **XML Parsing Errors**
   - Check BGG API response format
   - Verify XML structure
   - Handle malformed responses

3. **Image Processing Failures**
   - Check image URL validity
   - Verify storage permissions
   - Handle large file sizes

4. **Database Sync Issues**
   - Check database connectivity
   - Verify table schema
   - Handle constraint violations

### Debug Mode

Enable debug logging by setting:

```env
DEBUG_BGG=true
```

This will log detailed information about:

- API requests and responses
- Cache operations
- Image processing steps
- Database operations

## Future Enhancements

### Planned Features

- **Real-time sync** with BGG updates
- **Advanced filtering** and search
- **User collection analysis**
- **Game recommendation engine**
- **Price tracking** integration
- **Review aggregation**

### Performance Improvements

- **Redis caching** for better performance
- **CDN integration** for images
- **Background sync** jobs
- **Incremental updates**

## Support

For issues or questions about the BGG integration:

1. Check the troubleshooting section
2. Review the test results
3. Check the application logs
4. Contact the development team

---

**Note**: This integration respects BGG's terms of service and implements appropriate rate limiting to avoid overloading their servers.
