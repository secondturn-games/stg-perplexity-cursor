# BGG Service Quick Reference

## 🚀 Quick Start

```typescript
import { bggService } from '@/lib/bgg';

// Basic search
const results = await bggService.searchGames('gloomhaven');

// Filter by type
const baseGames = await bggService.searchGames('gloomhaven', {
  gameType: 'base-game',
});

// Get game details
const game = await bggService.getGameDetails('167791');
```

## 🔍 Search Methods

### `searchGames(query, filters?)`

```typescript
// Search for any game
await bggService.searchGames('catan');

// Search for base games only
await bggService.searchGames('catan', { gameType: 'base-game' });

// Search for expansions only
await bggService.searchGames('catan', { gameType: 'expansion' });
```

### `getGameDetails(gameId)`

```typescript
const game = await bggService.getGameDetails('167791');
if (game) {
  console.log(game.name, game.isExpansion ? 'Expansion' : 'Base Game');
}
```

## ⚙️ Configuration

### Rate Limiting

```typescript
import { DEFAULT_BGG_CONFIG } from '@/lib/bgg';

// Conservative settings (recommended)
const config = {
  rateLimitDelay: 1000, // 1 second between requests
  searchTimeout: 15000, // 15 second timeout
  maxBatchSize: 15, // Max games per batch
};
```

### Cache Settings

```typescript
import { CACHE_CONFIG } from '@/lib/bgg';

// Cache TTLs
const ttl = {
  search: CACHE_CONFIG.SEARCH_TTL, // 30 minutes
  gameDetails: CACHE_CONFIG.GAME_DETAILS_TTL, // 24 hours
  metadata: CACHE_CONFIG.METADATA_TTL, // 7 days
};
```

## 🎯 Type Classification

The service automatically handles base game vs expansion classification:

```typescript
const results = await bggService.searchGames('gloomhaven');

results.forEach(game => {
  if (game.isExpansion) {
    console.log(`${game.name} is an expansion`);
  } else {
    console.log(`${game.name} is a base game`);
  }
});
```

## 📊 Monitoring

### Cache Statistics

```typescript
const stats = bggService.getCacheStats();
console.log(`Hit rate: ${stats.hitRate}%`);
console.log(`Cache size: ${stats.size}`);
```

### Performance Metrics

```typescript
const efficiency = await bggService.getCacheEfficiency();
console.log(`Memory hit rate: ${efficiency.memoryHitRate}%`);
```

## 🛠️ Error Handling

```typescript
try {
  const results = await bggService.searchGames('gloomhaven');
} catch (error) {
  switch (error.code) {
    case 'RATE_LIMIT':
      // Show retry button
      break;
    case 'NETWORK_ERROR':
      // Show network error
      break;
    case 'API_UNAVAILABLE':
      // Show service unavailable
      break;
  }
}
```

## 🧹 Cache Management

```typescript
// Clear all caches
bggService.clearCache();

// Clear specific query
bggService.clearCacheForQuery('gloomhaven');

// Get cache info
const stats = bggService.getCacheStats();
```

## 📝 Data Types

### Search Result

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

### Game Details

```typescript
interface BGGGameDetails {
  id: string;
  name: string;
  yearpublished: string;
  minplayers: string;
  maxplayers: string;
  playingtime: string;
  minage: string;
  description: string;
  thumbnail: string;
  image: string;
  rating: string;
  weight: string;
  rank: string;
  mechanics: string[];
  categories: string[];
  alternateNames: string[];
  versions: BGGGameVersion[];
  type: 'boardgame' | 'boardgameexpansion';
  isExpansion: boolean;
  hasInboundExpansionLink: boolean;
}
```

## 🔧 Debug Commands

```typescript
// Enable debug logging
console.log('Cache stats:', bggService.getCacheStats());

// Check cache contents
const cacheManager = new CacheManager();
const keys = cacheManager.getMemoryCacheKeys();
console.log('Cache keys:', keys);

// Test API connection
const config = bggService.getConfig();
console.log('API config:', config);
```

## 📱 Common Patterns

### Search with Loading State

```typescript
const [results, setResults] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const searchGames = async query => {
  setLoading(true);
  setError(null);

  try {
    const searchResults = await bggService.searchGames(query);
    setResults(searchResults);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Game Selection

```typescript
const [selectedGame, setSelectedGame] = useState(null);

const selectGame = async gameId => {
  const gameDetails = await bggService.getGameDetails(gameId);
  setSelectedGame(gameDetails);
};
```

### Type-Aware Filtering

```typescript
const [gameType, setGameType] = useState('base-game');

const filteredResults = results.filter(game => {
  if (gameType === 'base-game') return !game.isExpansion;
  if (gameType === 'expansion') return game.isExpansion;
  return true;
});
```

## ⚡ Performance Tips

1. **Use Type Filtering**: Always specify `gameType` when possible
2. **Cache Results**: Don't clear cache unnecessarily
3. **Batch Operations**: Fetch metadata in batches
4. **Monitor Hit Rates**: Keep cache hit rate above 70%
5. **Respect Rate Limits**: Don't make rapid successive calls

## 🚨 Troubleshooting

| Issue                  | Solution                         |
| ---------------------- | -------------------------------- |
| No results             | Check query length (min 2 chars) |
| Slow performance       | Check cache hit rates            |
| Type misclassification | Clear cache and retry            |
| API errors             | Check rate limiting settings     |
| Network issues         | Verify internet connection       |

## 📚 Full Documentation

For complete documentation, see [BGG_SERVICE.md](./BGG_SERVICE.md)
