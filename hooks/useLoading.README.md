# useLoading Hook

A powerful, TypeScript-first React hook for managing loading states with automatic timeout protection, error handling, and seamless DiceLoader integration.

## 🎯 Overview

The `useLoading` hook provides a clean, declarative way to manage loading states in your React components. It includes built-in timeout protection, error handling, and is designed to work seamlessly with the DiceLoader component.

## ✨ Features

- ✅ **TypeScript First**: Full type safety with comprehensive interfaces
- ✅ **Automatic Timeout Protection**: Prevents infinite loading states
- ✅ **Error Handling**: Built-in error handling with customizable callbacks
- ✅ **Loading Counter**: Supports multiple concurrent operations
- ✅ **DiceLoader Integration**: Works seamlessly with the DiceLoader component
- ✅ **Flexible API**: Multiple usage patterns for different scenarios
- ✅ **Memory Safe**: Automatic cleanup on unmount
- ✅ **Zero Dependencies**: Built with React hooks only

## 📦 Installation

The hook is already available in the project:

```typescript
import { useLoading } from '@/hooks/useLoading';
// or with specialized versions
import { useLoadingWithTimeout, useLoadingNoTimeout } from '@/hooks/useLoading';
```

## 🚀 Basic Usage

### Simple Loading State

```tsx
import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';

function MyComponent() {
  const { isLoading, showLoading, hideLoading } = useLoading();

  const handleClick = () => {
    showLoading();
    // Do some work...
    setTimeout(hideLoading, 2000);
  };

  return (
    <>
      <button onClick={handleClick}>Start</button>
      <DiceLoader isVisible={isLoading} text='Processing...' />
    </>
  );
}
```

### With API Calls (Recommended)

```tsx
import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';

function GamesList() {
  const { isLoading, withLoading } = useLoading();
  const [games, setGames] = useState([]);

  const fetchGames = async () => {
    await withLoading(async () => {
      const response = await fetch('/api/games');
      const data = await response.json();
      setGames(data);
    });
  };

  return (
    <>
      <button onClick={fetchGames}>Load Games</button>
      <DiceLoader isVisible={isLoading} text='Fetching games...' />
      {/* Render games... */}
    </>
  );
}
```

## 📋 API Reference

### `useLoading(options?)`

Main hook for loading state management.

#### Parameters

```typescript
interface UseLoadingOptions {
  /**
   * Default timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  defaultTimeout?: number;

  /**
   * Callback fired when timeout occurs
   */
  onTimeout?: () => void;

  /**
   * Callback fired when error occurs in withLoading
   */
  onError?: (error: Error) => void;

  /**
   * Automatically hide loading on error
   * @default true
   */
  hideOnError?: boolean;
}
```

#### Returns

```typescript
interface UseLoadingReturn {
  /**
   * Current loading state
   */
  isLoading: boolean;

  /**
   * Show loading indicator
   */
  showLoading: () => void;

  /**
   * Hide loading indicator
   */
  hideLoading: () => void;

  /**
   * Wrap async function with automatic loading management
   */
  withLoading: <T>(
    fn: () => Promise<T>,
    options?: {
      timeout?: number;
      onError?: (error: Error) => void;
      hideOnError?: boolean;
    }
  ) => Promise<T>;

  /**
   * Reset loading state and clear timeouts
   */
  reset: () => void;
}
```

## 💡 Usage Patterns

### Pattern 1: Basic Show/Hide

```tsx
const { isLoading, showLoading, hideLoading } = useLoading();

const doSomething = () => {
  showLoading();
  try {
    // Your code...
  } finally {
    hideLoading();
  }
};
```

### Pattern 2: WithLoading Wrapper (Recommended)

```tsx
const { isLoading, withLoading } = useLoading();

const fetchData = async () => {
  await withLoading(async () => {
    const data = await apiCall();
    processData(data);
  });
};
```

### Pattern 3: Multiple Operations

```tsx
const { isLoading, withLoading } = useLoading();

const runMultiple = async () => {
  // Loading stays visible until all complete
  await Promise.all([
    withLoading(() => operation1()),
    withLoading(() => operation2()),
    withLoading(() => operation3()),
  ]);
};
```

### Pattern 4: Custom Timeout

```tsx
const { isLoading, withLoading } = useLoading({
  defaultTimeout: 10000, // 10 seconds
  onTimeout: () => {
    alert('Request timed out');
  },
});

// Or per-call timeout
await withLoading(
  async () => {
    // Long operation
  },
  { timeout: 20000 } // 20 seconds for this specific call
);
```

### Pattern 5: Error Handling

```tsx
const { isLoading, withLoading } = useLoading({
  onError: error => {
    console.error('Global error handler:', error);
    showNotification(error.message);
  },
  hideOnError: true, // Auto-hide loading on error
});

try {
  await withLoading(async () => {
    await riskyOperation();
  });
} catch (error) {
  // Handle error in component
}
```

### Pattern 6: No Timeout

```tsx
import { useLoadingNoTimeout } from '@/hooks/useLoading';

const { isLoading, showLoading, hideLoading } = useLoadingNoTimeout();

// Complete manual control, no automatic timeout
```

## 🎨 Integration with DiceLoader

The hook is designed to work seamlessly with the DiceLoader component:

```tsx
import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';

function MyPage() {
  const { isLoading, withLoading } = useLoading();

  const loadData = async () => {
    await withLoading(async () => {
      // Fetch and process data
    });
  };

  return (
    <>
      <button onClick={loadData}>Load</button>

      {/* Different animation variants */}
      <DiceLoader isVisible={isLoading} text='Loading...' variant='roll' />

      {/* or */}
      <DiceLoader isVisible={isLoading} text='Processing...' variant='bounce' />

      {/* or */}
      <DiceLoader isVisible={isLoading} text='Please wait...' variant='spin' />
    </>
  );
}
```

## 🔄 Advanced Usage

### Form Submission

```tsx
function ContactForm() {
  const { isLoading, withLoading } = useLoading();
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await withLoading(async () => {
        const response = await fetch('/api/contact', {
          method: 'POST',
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Submission failed');
        }

        // Success handling...
      });
    } catch (error) {
      // Error handling...
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type='submit' disabled={isLoading}>
        Submit
      </button>
      <DiceLoader isVisible={isLoading} text='Submitting...' />
    </form>
  );
}
```

### Multiple Sequential Operations

```tsx
function DataMigration() {
  const { isLoading, withLoading } = useLoading({
    defaultTimeout: 60000, // 1 minute
  });

  const runMigration = async () => {
    await withLoading(async () => {
      // Step 1
      await backupData();

      // Step 2
      await transformData();

      // Step 3
      await validateData();

      // Step 4
      await commitChanges();
    });
  };

  return (
    <>
      <button onClick={runMigration}>Start Migration</button>
      <DiceLoader
        isVisible={isLoading}
        text='Migrating data...'
        variant='spin'
      />
    </>
  );
}
```

### Conditional Loading States

```tsx
function Dashboard() {
  const { isLoading, withLoading } = useLoading();
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const loadDashboard = async () => {
    await withLoading(async () => {
      setLoadingMessage('Fetching user data...');
      const user = await fetchUser();

      setLoadingMessage('Loading analytics...');
      const analytics = await fetchAnalytics();

      setLoadingMessage('Preparing dashboard...');
      await prepareDashboard(user, analytics);
    });
  };

  return (
    <>
      <button onClick={loadDashboard}>Load Dashboard</button>
      <DiceLoader isVisible={isLoading} text={loadingMessage} />
    </>
  );
}
```

## ⚙️ Configuration Examples

### Short Timeout for Quick Operations

```tsx
const { isLoading, withLoading } = useLoading({
  defaultTimeout: 5000, // 5 seconds
  onTimeout: () => {
    showNotification('Operation timed out. Please try again.');
  },
});
```

### Long Timeout for Heavy Operations

```tsx
const { isLoading, withLoading } = useLoading({
  defaultTimeout: 120000, // 2 minutes
  onTimeout: () => {
    showNotification('Processing is taking longer than expected...');
  },
});
```

### Global Error Handler

```tsx
const { isLoading, withLoading } = useLoading({
  onError: error => {
    // Log to error tracking service
    trackError(error);

    // Show user-friendly message
    showNotification('Something went wrong. Please try again.');
  },
  hideOnError: true,
});
```

## 🧪 Testing

### Unit Test Example

```typescript
import { renderHook, act } from '@testing-library/react';
import { useLoading } from '@/hooks/useLoading';

describe('useLoading', () => {
  it('should start with loading false', () => {
    const { result } = renderHook(() => useLoading());
    expect(result.current.isLoading).toBe(false);
  });

  it('should show and hide loading', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.showLoading();
    });
    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.hideLoading();
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle withLoading successfully', async () => {
    const { result } = renderHook(() => useLoading());

    const mockFn = jest.fn().mockResolvedValue('success');

    await act(async () => {
      await result.current.withLoading(mockFn);
    });

    expect(mockFn).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle errors in withLoading', async () => {
    const { result } = renderHook(() => useLoading());
    const error = new Error('Test error');

    const mockFn = jest.fn().mockRejectedValue(error);

    await expect(
      act(async () => {
        await result.current.withLoading(mockFn);
      })
    ).rejects.toThrow('Test error');
  });

  it('should trigger timeout', async () => {
    jest.useFakeTimers();
    const onTimeout = jest.fn();

    const { result } = renderHook(() =>
      useLoading({ defaultTimeout: 1000, onTimeout })
    );

    act(() => {
      result.current.showLoading();
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTimeout).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);

    jest.useRealTimers();
  });
});
```

## 📊 Best Practices

### ✅ Do's

1. **Use withLoading for async operations**

   ```tsx
   await withLoading(async () => {
     await apiCall();
   });
   ```

2. **Set appropriate timeouts**

   ```tsx
   // Quick operations
   useLoading({ defaultTimeout: 5000 });

   // Heavy operations
   useLoading({ defaultTimeout: 60000 });
   ```

3. **Handle errors properly**

   ```tsx
   try {
     await withLoading(async () => {
       await riskyOperation();
     });
   } catch (error) {
     // Handle error
   }
   ```

4. **Use specific loading messages**
   ```tsx
   <DiceLoader isVisible={isLoading} text='Fetching your games...' />
   ```

### ❌ Don'ts

1. **Don't forget to handle errors**

   ```tsx
   // Bad
   withLoading(async () => {
     await apiCall(); // Error might leave loading stuck
   });
   ```

2. **Don't use multiple hooks for the same operation**

   ```tsx
   // Bad - creates conflicting states
   const loading1 = useLoading();
   const loading2 = useLoading();
   ```

3. **Don't set timeout too short for actual operations**
   ```tsx
   // Bad - 100ms is too short for API calls
   useLoading({ defaultTimeout: 100 });
   ```

## 🔍 Troubleshooting

### Loading doesn't hide

**Problem**: Loading state remains visible indefinitely

**Solutions**:

1. Check if `hideLoading()` is being called
2. Ensure timeout is configured: `useLoading({ defaultTimeout: 30000 })`
3. Check if errors are being thrown without handling
4. Use `reset()` to force clear the state

### Multiple operations conflict

**Problem**: Loading state flickers with multiple operations

**Solution**: The hook uses a counter system - this is expected behavior. For truly independent operations, use separate hook instances.

### Timeout fires too early

**Problem**: Timeout occurs before operation completes

**Solution**: Increase timeout duration or use per-call timeout:

```tsx
await withLoading(
  async () => {
    // Long operation
  },
  { timeout: 60000 } // 60 seconds
);
```

## 🔗 Related

- **DiceLoader Component**: Visual loading indicator
- **useAuth Hook**: Authentication state management
- **useBGG Hook**: BGG API integration

## 📝 TypeScript

The hook is fully typed with comprehensive interfaces:

```typescript
import type { UseLoadingOptions, UseLoadingReturn } from '@/hooks/useLoading';
```

## 📄 License

Part of the Baltic Board Game Marketplace project.

---

**Last Updated**: Implementation Step 4 - Loading Hook Complete
