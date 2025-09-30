# DiceLoader - Complete Quick Reference

**🎲 Everything you need to know about the 2D Dice Loading Animation system**

---

## 🚀 Quick Start (30 seconds)

```tsx
import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';

function MyComponent() {
  const { isLoading, withLoading } = useLoading();

  const loadData = async () => {
    await withLoading(async () => {
      const response = await fetch('/api/data');
      const data = await response.json();
      setData(data);
    });
  };

  return (
    <>
      <button onClick={loadData}>Load</button>
      <DiceLoader isVisible={isLoading} text='Loading...' />
    </>
  );
}
```

---

## 📦 What's Available

### Components

```tsx
import { DiceLoader } from '@/components/ui';
import {
  ProtectedRoute,
  SuspenseWrapper,
  PageLoader,
} from '@/components/layout';
```

### Hooks

```tsx
import {
  useLoading,
  useLoadingWithTimeout,
  useLoadingNoTimeout,
} from '@/hooks/useLoading';
```

### API Utilities

```tsx
import { api } from '@/lib/api';
import {
  searchGamesWithLoading,
  getGameDetailsWithLoading,
} from '@/lib/bgg/api-with-loading';
import {
  signInWithEmailLoading,
  updateProfileLoading,
} from '@/lib/supabase/api-with-loading';
import { createFormHandler } from '@/lib/form-handlers';
```

---

## 🎨 DiceLoader Variants

```tsx
// Roll - Default, general purpose
<DiceLoader isVisible={isLoading} text="Loading..." variant="roll" />

// Bounce - Interactive operations
<DiceLoader isVisible={isLoading} text="Processing..." variant="bounce" />

// Spin - Background operations
<DiceLoader isVisible={isLoading} text="Searching..." variant="spin" />
```

---

## 📋 Common Patterns

### 1. Simple API Call

```tsx
const { isLoading, withLoading } = useLoading();

const loadData = async () => {
  const { data, error } = await api.get('/api/games', {}, { withLoading });
  if (data) setGames(data);
};

<DiceLoader isVisible={isLoading} text='Loading...' />;
```

### 2. BGG Search

```tsx
const { data } = await searchGamesWithLoading(
  'Catan',
  { gameType: 'base-game' },
  { withLoading }
);
```

### 3. Form Submission

```tsx
const handleSubmit = createFormHandler(
  async formData => {
    return fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },
  { withLoading },
  { onSuccess: () => alert('Sent!') }
);
```

### 4. Protected Page

```tsx
<ProtectedRoute loadingText='Verifying...'>
  <YourContent />
</ProtectedRoute>
```

### 5. Page Loading (loading.tsx)

```tsx
// app/your-page/loading.tsx
import DiceLoader from '@/components/ui/DiceLoader';

export default function Loading() {
  return <DiceLoader isVisible={true} text='Loading...' />;
}
```

---

## 🎯 When to Use What

### DiceLoader Component

- Manual loading control
- Custom loading scenarios
- Specific loading messages

### useLoading Hook

- API calls
- Form submissions
- Async operations
- Multiple concurrent operations

### Page-level loading.tsx

- Next.js App Router automatic loading
- Server component loading
- Route segment loading

### ProtectedRoute

- Authentication required pages
- Email verification
- Access control

### SuspenseWrapper

- Async component boundaries
- Streaming components
- Independent loading sections

---

## ⚙️ Configuration Options

### useLoading Hook

```tsx
const { isLoading, withLoading } = useLoading({
  defaultTimeout: 30000, // 30 seconds
  onTimeout: () => alert('Timeout'),
  onError: error => console.error(error),
  hideOnError: true,
});
```

### API Requests

```tsx
await api.get(
  '/endpoint',
  {
    loadingDelay: 300, // Show after 300ms
    timeout: 30000, // 30 seconds
    retry: true, // Enable retry
    retryAttempts: 3, // 3 attempts
    onError: error => {}, // Error handler
  },
  { withLoading }
);
```

### Form Handlers

```tsx
createFormHandler(
  submitFn,
  { withLoading },
  {
    validate: data => {
      /* validation */
    },
    onSuccess: () => {
      /* success */
    },
    onError: error => {
      /* error */
    },
    resetOnSuccess: true,
  }
);
```

---

## 📍 File Locations

```
components/
  ui/
    DiceLoader.tsx              ← Main component
    DiceLoader.module.css       ← Animations
    DiceLoader.README.md        ← Component docs

  layout/
    NavigationLoader.tsx        ← Client nav loading
    ProtectedRoute.tsx          ← Auth protection
    SuspenseWrapper.tsx         ← Suspense integration
    PageLoader.tsx              ← Route-aware loader

  marketplace/
    ListingForm.tsx             ← Create/edit listings
    ListingDetail.tsx           ← View listings
    MarketplaceSearch.tsx       ← Search marketplace
    ProfileUpdateForm.tsx       ← Update profile

hooks/
  useLoading.ts                 ← Loading state hook
  useLoading.README.md          ← Hook docs

lib/
  api.ts                        ← Unified API client
  form-handlers.ts              ← Form utilities
  bgg/
    api-with-loading.ts         ← BGG integration
  supabase/
    api-with-loading.ts         ← Supabase integration

app/
  loading.tsx                   ← Root loading
  auth/loading.tsx              ← Auth loading
  dashboard/loading.tsx         ← Dashboard loading
  profile/loading.tsx           ← Profile loading
  marketplace/
    loading.tsx                 ← Marketplace loading
    listings/
      new/loading.tsx           ← New listing loading
      [id]/loading.tsx          ← Detail loading
    my-listings/loading.tsx     ← User listings loading
```

---

## 🎯 Loading Messages Reference

### Marketplace

- "Loading marketplace..."
- "Searching marketplace..."
- "Loading listing details..."
- "Preparing listing form..."
- "Loading your listings..."
- "Creating listing..."
- "Updating listing..."

### BGG Integration

- "Searching BoardGameGeek..."
- "Loading game information..."
- "Loading game data..."

### User Operations

- "Loading profile..."
- "Loading your profile..."
- "Updating your profile..."
- "Uploading avatar..."
- "Uploading images..."

### Authentication

- "Loading authentication..."
- "Loading sign in..."
- "Loading sign up..."
- "Verifying authentication..."
- "Verifying email..."

### Actions

- "Adding to cart..."
- "Saving listing..."
- "Deleting listing..."
- "Processing..."

---

## ⚡ Performance Tips

1. **Use 300ms delay** - Prevents flashing

```tsx
{
  loadingDelay: 300;
}
```

2. **Set appropriate timeouts**

```tsx
{
  timeout: 60000;
} // For heavy operations
```

3. **Handle concurrent calls**

```tsx
await Promise.all([
  api.get('/a', {}, { withLoading }),
  api.get('/b', {}, { withLoading }),
]); // Single loading indicator
```

4. **Use route-aware loaders**

```tsx
<PageLoader /> // Auto-determines message
```

---

## 🆘 Troubleshooting

**Loading doesn't show?**

- Check if request takes > 300ms
- Verify isLoading is true
- Check loadingDelay configuration

**Loading doesn't hide?**

- Ensure withLoading wraps async function
- Check for errors in operation
- Verify timeout is set
- Use reset() to force clear

**Multiple loaders showing?**

- Use single useLoading instance per page
- Loading counter handles multiple operations

---

## 📖 Documentation

- **Component**: `components/ui/DiceLoader.README.md`
- **Hook**: `hooks/useLoading.README.md`
- **API**: `lib/API_INTEGRATION.md`
- **Pages**: `PAGE_LEVEL_LOADING_GUIDE.md`

---

## 🎉 You're Ready!

Everything is implemented and ready to use:

✅ Beautiful dice animations  
✅ Smart loading state management  
✅ Complete API integration  
✅ Full marketplace functionality  
✅ Page-level loading everywhere  
✅ Comprehensive documentation  
✅ Production-ready code

**Start building with confidence!** 🚀

---

**Need help?** Check the full documentation in the respective README files.
