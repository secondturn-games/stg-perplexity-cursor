# useLoading Hook - Quick Start Guide

**⚡ Get started with the useLoading hook in 30 seconds**

---

## 🚀 Basic Usage

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

**That's it!** ✅

---

## 📝 Common Patterns

### 1️⃣ Simple Loading

```tsx
const { isLoading, showLoading, hideLoading } = useLoading();

// Show
showLoading();

// Hide
hideLoading();
```

### 2️⃣ API Calls (Recommended)

```tsx
const { isLoading, withLoading } = useLoading();

await withLoading(async () => {
  const data = await fetch('/api/games').then(r => r.json());
  setGames(data);
});
```

### 3️⃣ With Timeout

```tsx
const { isLoading, withLoading } = useLoading({
  defaultTimeout: 10000, // 10 seconds
  onTimeout: () => alert('Timed out!'),
});
```

### 4️⃣ With Error Handling

```tsx
const { isLoading, withLoading } = useLoading({
  onError: error => console.error(error),
  hideOnError: true,
});
```

### 5️⃣ Multiple Operations

```tsx
const { isLoading, withLoading } = useLoading();

// Loading stays visible until ALL complete
await Promise.all([
  withLoading(() => fetchGames()),
  withLoading(() => fetchUsers()),
]);
```

---

## 🎨 DiceLoader Variants

```tsx
// Roll animation (default)
<DiceLoader isVisible={isLoading} text="Loading..." variant="roll" />

// Bounce animation
<DiceLoader isVisible={isLoading} text="Processing..." variant="bounce" />

// Spin animation
<DiceLoader isVisible={isLoading} text="Please wait..." variant="spin" />
```

---

## ⚙️ Configuration Options

```tsx
useLoading({
  defaultTimeout: 30000, // Default: 30 seconds
  onTimeout: () => {}, // Timeout callback
  onError: error => {}, // Error callback
  hideOnError: true, // Auto-hide on error (default: true)
});
```

---

## 🎯 What You Get

```tsx
const {
  isLoading, // boolean - current state
  showLoading, // () => void - show loading
  hideLoading, // () => void - hide loading
  withLoading, // wrapper for async functions
  reset, // () => void - force clear
} = useLoading();
```

---

## ✅ Best Practices

### ✅ Do This

```tsx
// Use withLoading for async operations
await withLoading(async () => {
  await apiCall();
});
```

### ❌ Not This

```tsx
// Don't forget error handling
withLoading(async () => {
  await apiCall(); // Could leave loading stuck!
});
```

---

## 🆘 Need Help?

- **Full Documentation**: `hooks/useLoading.README.md`
- **Examples**: `hooks/useLoading.example.tsx`
- **Integration Test**: `hooks/useLoading.integration.test.tsx`

---

## 💡 Pro Tips

1. **Always use `withLoading` for async operations** - it handles everything automatically
2. **Set appropriate timeouts** - 5s for quick ops, 30s+ for heavy ops
3. **Handle errors properly** - use try-catch or error callbacks
4. **Use dynamic loading messages** - update text for better UX

---

**Ready to code!** 🎉

For more details, see the [full documentation](./useLoading.README.md).
