# DiceLoader Component

A fully-integrated 2D dice loading animation component for the Baltic Board Game Marketplace, built with Next.js 15, TypeScript, and Tailwind CSS.

## 🎯 Overview

The DiceLoader displays an animated dice overlay that cycles through Unicode dice symbols (⚀⚁⚂⚃⚄⚅) with three different animation variants. It's fully integrated with the design system's colors, typography, and accessibility standards.

## ✨ Features

### Design System Integration
- ✅ Uses semantic color tokens from Tailwind config
- ✅ Leverages `cn()` utility from `@/lib/utils` for className merging
- ✅ Respects design system z-index layers (z-50)
- ✅ Integrates with Open Sans and Righteous font families
- ✅ Backdrop blur effect using Tailwind's `backdrop-blur-md`

### Brand Colors
- **Background Overlay**: Dark Green (primary-500) at 90% opacity
- **Dice**: Vibrant Orange (accent-500)
- **Text**: Light Beige (background-100)
- **Glow & Dots**: Warm Yellow (warning-400)

### Accessibility (WCAG 2.1 AA Compliant)
- ✅ ARIA attributes (`role="alert"`, `aria-live="polite"`, `aria-busy="true"`)
- ✅ Focus management - stores and restores focus when loader shows/hides
- ✅ Body scroll prevention while loading
- ✅ Screen reader friendly loading announcements
- ✅ Respects `prefers-reduced-motion` for users with vestibular disorders
- ✅ Decorative elements marked with `aria-hidden`

### Performance
- ✅ Hardware-accelerated animations (60fps target)
- ✅ `will-change` properties for optimal rendering
- ✅ Transform-based animations (GPU accelerated)
- ✅ Efficient React hooks with proper cleanup

### Responsive Design
- ✅ Mobile-first approach
- ✅ Breakpoints: sm (640px), md (768px)
- ✅ Scales appropriately on all screen sizes
- ✅ Touch-friendly spacing

## 📦 Installation

The component is already integrated into the UI component library:

```typescript
import { DiceLoader } from '@/components/ui';
// or
import DiceLoader from '@/components/ui/DiceLoader';
```

## 🚀 Usage

### Basic Example

```tsx
'use client';

import { useState } from 'react';
import { DiceLoader } from '@/components/ui';

export default function MyPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <DiceLoader isVisible={isLoading} text="Loading..." />
      {/* Your page content */}
    </>
  );
}
```

### With API Calls

```tsx
'use client';

import { useState, useEffect } from 'react';
import { DiceLoader } from '@/components/ui';

export default function MarketplacePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState([]);

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/marketplace/games');
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  return (
    <>
      <DiceLoader 
        isVisible={isLoading} 
        text="Fetching board games..." 
        variant="roll"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {games.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </>
  );
}
```

### Animation Variants

```tsx
// Roll variant (default) - 360° rotation with scale
<DiceLoader 
  isVisible={isLoading} 
  text="Loading..." 
  variant="roll" 
/>

// Bounce variant - vertical movement with rotation
<DiceLoader 
  isVisible={isLoading} 
  text="Processing..." 
  variant="bounce" 
/>

// Spin variant - continuous Y-axis rotation
<DiceLoader 
  isVisible={isLoading} 
  text="Please wait..." 
  variant="spin" 
/>
```

## 📋 Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `isVisible` | `boolean` | - | ✅ Yes | Controls loader visibility |
| `text` | `string` | `"Loading..."` | ❌ No | Custom loading message |
| `variant` | `'roll' \| 'bounce' \| 'spin'` | `'roll'` | ❌ No | Animation style variant |

## 🎨 Design System Integration

### Color Mapping

```typescript
// Tailwind Config Colors → Component Usage
primary-500 (#29432B)   → Background overlay
accent-500 (#D95323)    → Dice color
background-100 (#E6EAD7) → Loading text
warning-400 (#F2C94C)   → Glow effect and dots
```

### Typography

```typescript
// Uses design system fonts
font-sans → 'Open Sans' for loading text
font-heading → 'Righteous' (available but not used in loader)
```

### Z-Index Layers

```
50: DiceLoader overlay (same as dropdown menus)
40: Modal/drawer backdrops
30: Navigation components
10: Floating elements
0: Base layer
```

## ♿ Accessibility Details

### ARIA Implementation

```tsx
<div
  role="alert"           // Identifies as alert region
  aria-live="polite"     // Announces changes politely
  aria-busy="true"       // Indicates loading state
  aria-label={text}      // Provides accessible label
>
```

### Focus Management

```typescript
// Automatically managed by the component
- Saves current focused element when loader appears
- Prevents body scroll during loading
- Restores focus when loader disappears
- Restores body scroll capability
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are significantly reduced or disabled */
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
}
```

## 📱 Responsive Behavior

### Mobile (< 640px)
- Dice size: 6rem (text-6xl)
- Container: h-24 w-24
- Text: text-lg
- Dots: text-xl
- Reduced bounce animation amplitude

### Tablet (≥ 640px, < 768px)
- Dice size: 7rem (text-7xl)
- Container: h-32 w-32
- Text: text-xl
- Dots: text-2xl

### Desktop (≥ 768px)
- Dice size: 8rem (text-8xl)
- Container: h-40 w-40
- Text: text-2xl
- Dots: text-2xl
- Enhanced bounce animation amplitude

## 🎭 Animation Details

### Roll Animation (0.9s)
- 0%: 0° rotation, scale 1
- 25%: 90° rotation, scale 1.1
- 50%: 180° rotation, scale 1
- 75%: 270° rotation, scale 1.1
- 100%: 360° rotation, scale 1

### Bounce Animation (0.8s)
- Combines vertical translateY with rotation
- Peak height: -25px
- Full 180° rotation per cycle

### Spin Animation (1s)
- Continuous Y-axis rotation
- Linear timing for smooth spin
- Scale variation: 1 → 1.1 → 1

### Dice Face Cycling
- Cycles through ⚀⚁⚂⚃⚄⚅ every 150ms
- Smooth transitions between faces

## 🏗️ File Structure

```
components/ui/
├── DiceLoader.tsx              # Main component
├── DiceLoader.module.css       # Custom animations only
├── DiceLoader.example.tsx      # Usage examples
├── DiceLoader.README.md        # This file
└── index.ts                    # Barrel export
```

## 🧪 Testing Recommendations

### Unit Tests
```typescript
describe('DiceLoader', () => {
  it('should render when isVisible is true', () => {});
  it('should not render when isVisible is false', () => {});
  it('should display custom text', () => {});
  it('should apply correct animation variant', () => {});
  it('should prevent body scroll when visible', () => {});
  it('should restore focus on unmount', () => {});
});
```

### Accessibility Tests
- Verify ARIA attributes are present
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Verify keyboard navigation
- Test with `prefers-reduced-motion` enabled

### Visual Regression Tests
- Test all three animation variants
- Test on mobile, tablet, desktop viewports
- Verify color accuracy against design system

## 📝 Notes

### Following .cursorrules
- ✅ Client Component (marked with 'use client')
- ✅ TypeScript strict mode compliant
- ✅ Under 200 lines (149 lines)
- ✅ Proper TypeScript interfaces
- ✅ Accessibility attributes included
- ✅ Uses Tailwind CSS with minimal custom CSS
- ✅ Proper JSDoc documentation
- ✅ Barrel export in index.ts
- ✅ No console.log statements
- ✅ Async/await for timer cleanup
- ✅ Focus management implemented

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with -webkit- prefixes)
- Mobile browsers: Optimized with reduced animations

### Performance Considerations
- Hardware-accelerated transforms
- Uses `will-change` for animation properties
- Efficient React hooks with proper dependencies
- No unnecessary re-renders
- Automatic cleanup on unmount

## 🔗 Related Components

- `Button` - Can trigger the loader
- `Alert` - Alternative for non-blocking notifications
- `Header` - Shares z-index layer considerations

## 📞 Support

For issues or questions:
1. Check the example file: `DiceLoader.example.tsx`
2. Review design system documentation
3. Verify Tailwind configuration
4. Check browser console for errors

## 📄 License

Part of the Baltic Board Game Marketplace project.

---

**Last Updated**: Implementation Step 3 - Design System Integration Complete