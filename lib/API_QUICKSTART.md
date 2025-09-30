# API Layer - Quick Start Guide

**⚡ Start using loading states in your API calls in 30 seconds**

---

## 🚀 Basic Usage

### 1. Simple API Call

```typescript
import { api } from '@/lib/api';
import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';

function MyComponent() {
  const { isLoading, withLoading } = useLoading();

  const loadData = async () => {
    const { data, error } = await api.get('/api/games', {}, { withLoading });
    
    if (error) {
      console.error(error);
      return;
    }
    
    setGames(data);
  };

  return (
    <>
      <button onClick={loadData}>Load</button>
      <DiceLoader isVisible={isLoading} text="Loading..." />
    </>
  );
}
```

---

## 📋 Common Patterns

### API Requests

```typescript
import { api } from '@/lib/api';

// GET
const { data } = await api.get('/api/games', {}, { withLoading });

// POST
const { data } = await api.post('/api/games', gameData, {}, { withLoading });

// PUT
const { data } = await api.put('/api/games/1', updates, {}, { withLoading });

// DELETE
const { data } = await api.delete('/api/games/1', {}, { withLoading });
```

### BGG API

```typescript
import { searchGamesWithLoading } from '@/lib/bgg/api-with-loading';

const { data } = await searchGamesWithLoading(
  'Catan',
  { gameType: 'boardgame' },
  { withLoading }
);
```

### Supabase Auth

```typescript
import { signInWithEmailLoading } from '@/lib/supabase/api-with-loading';

const { data, error } = await signInWithEmailLoading(
  email,
  password,
  { withLoading }
);
```

### Form Submission

```typescript
import { createFormHandler } from '@/lib/form-handlers';

const handleSubmit = createFormHandler(
  async (data) => {
    const response = await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },
  { withLoading },
  {
    onSuccess: () => alert('Success!'),
    resetOnSuccess: true,
  }
);
```

---

## ⚙️ Configuration

### Loading Delay

```typescript
// Show loading only if request takes > 300ms
await api.get('/api/games', {
  loadingDelay: 300,
}, { withLoading });
```

### Timeout

```typescript
// Set custom timeout
await api.get('/api/games', {
  timeout: 60000, // 60 seconds
}, { withLoading });
```

### Error Handling

```typescript
await api.get('/api/games', {
  onError: (error) => console.error(error),
  retry: true,
  retryAttempts: 3,
}, { withLoading });
```

### Multiple Requests

```typescript
// Single loading indicator for all
await Promise.all([
  api.get('/api/games', {}, { withLoading }),
  api.get('/api/users', {}, { withLoading }),
  api.get('/api/stats', {}, { withLoading }),
]);
```

---

## 🎨 With DiceLoader

```typescript
<DiceLoader isVisible={isLoading} text="Loading games..." />
<DiceLoader isVisible={isLoading} text="Processing..." variant="bounce" />
<DiceLoader isVisible={isLoading} text="Please wait..." variant="spin" />
```

---

## 📦 Available Functions

### API Client (`lib/api`)
- `api.get(path, options, loadingHook)`
- `api.post(path, body, options, loadingHook)`
- `api.put(path, body, options, loadingHook)`
- `api.patch(path, body, options, loadingHook)`
- `api.delete(path, options, loadingHook)`

### BGG API (`lib/bgg/api-with-loading`)
- `searchGamesWithLoading(query, filters, loadingHook, options)`
- `getGameDetailsWithLoading(gameId, loadingHook, options)`
- `getUserCollectionWithLoading(username, loadingHook, options)`
- `batchUpdateGamesWithLoading(gameIds, loadingHook, options)`

### Supabase (`lib/supabase/api-with-loading`)
- `signInWithEmailLoading(email, password, loadingHook, options)`
- `signUpWithProfileLoading(data, loadingHook, options)`
- `signOutLoading(loadingHook, options)`
- `updateProfileLoading(updates, loadingHook, options)`

### Forms (`lib/form-handlers`)
- `createFormHandler(submitFn, loadingHook, options)`
- `createFormEventHandler(submitFn, loadingHook, options)`
- `createFieldValidator(rules)`
- `validators.*` (required, email, minLength, maxLength, etc.)

---

## ⚡ Pro Tips

1. **Always handle errors** - Check for `error` in response
2. **Use 300ms delay** - Prevents loading flash for quick operations
3. **Set appropriate timeouts** - Longer for heavy operations
4. **Use validation** - Form handlers have built-in validation support

---

**Need more details?** See [API_INTEGRATION.md](./API_INTEGRATION.md) for complete examples.

**Ready to code!** 🎉