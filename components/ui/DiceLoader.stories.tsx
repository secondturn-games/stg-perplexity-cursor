/**
 * DiceLoader Storybook Stories
 * Interactive documentation and examples for the DiceLoader component
 */

import type { Meta, StoryObj } from '@storybook/react';
import DiceLoader from './DiceLoader';

/**
 * DiceLoader Component
 *
 * A beautiful, accessible loading indicator featuring animated dice symbols.
 * Perfect for the Baltic Board Game Marketplace brand.
 *
 * ## Features
 *
 * - 🎲 Animated dice cycling through ⚀⚁⚂⚃⚄⚅
 * - 🎨 Three animation variants (roll, bounce, spin)
 * - ♿ WCAG 2.1 AA compliant
 * - 📱 Fully responsive
 * - ⚡ Hardware-accelerated (60 FPS)
 * - 🎯 Brand color integration
 *
 * ## Usage
 *
 * ```tsx
 * import { useLoading } from '@/hooks/useLoading';
 * import { DiceLoader } from '@/components/ui';
 *
 * function MyComponent() {
 *   const { isLoading, withLoading } = useLoading();
 *
 *   return (
 *     <>
 *       <button onClick={() => withLoading(async () => { })}>
 *         Load
 *       </button>
 *       <DiceLoader isVisible={isLoading} text="Loading..." />
 *     </>
 *   );
 * }
 * ```
 */
const meta = {
  title: 'Feedback/DiceLoader',
  component: DiceLoader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DiceLoader is the primary loading indicator for the Baltic Board Game Marketplace. It displays an animated dice symbol with contextual loading text, providing clear visual feedback during asynchronous operations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Controls the visibility of the loading indicator',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    text: {
      control: 'text',
      description: 'Loading message displayed to users',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"Loading..."' },
      },
    },
    variant: {
      control: 'select',
      options: ['roll', 'bounce', 'spin'],
      description: 'Animation variant to use',
      table: {
        type: { summary: "'roll' | 'bounce' | 'spin'" },
        defaultValue: { summary: '"roll"' },
      },
    },
  },
} satisfies Meta<typeof DiceLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default State (Hidden)
 *
 * The DiceLoader is hidden by default when `isVisible` is false.
 * This is the normal state when no loading operation is active.
 */
export const Default: Story = {
  args: {
    isVisible: false,
    text: 'Loading...',
    variant: 'roll',
  },
};

/**
 * Roll Variant (Default Animation)
 *
 * The roll variant features a 360° rotation with subtle scale effects.
 * This is the default animation and works well for general-purpose loading.
 *
 * **Best for:**
 * - Page navigation
 * - General API calls
 * - Content loading
 * - Default choice when unsure
 */
export const RollVariant: Story = {
  args: {
    isVisible: true,
    text: 'Loading...',
    variant: 'roll',
  },
};

/**
 * Bounce Variant
 *
 * The bounce variant combines vertical movement with rotation.
 * Creates a more dynamic, playful animation.
 *
 * **Best for:**
 * - Authentication (sign in/up)
 * - Profile updates
 * - User actions (add to cart, save)
 * - Interactive forms
 */
export const BounceVariant: Story = {
  args: {
    isVisible: true,
    text: 'Processing...',
    variant: 'bounce',
  },
};

/**
 * Spin Variant
 *
 * The spin variant features continuous Y-axis rotation.
 * Ideal for background operations and searches.
 *
 * **Best for:**
 * - Marketplace search
 * - Dashboard loading
 * - Complex queries
 * - Background operations
 */
export const SpinVariant: Story = {
  args: {
    isVisible: true,
    text: 'Searching...',
    variant: 'spin',
  },
};

/**
 * Loading Marketplace
 *
 * Example of loading text for marketplace pages.
 */
export const LoadingMarketplace: Story = {
  args: {
    isVisible: true,
    text: 'Loading marketplace...',
    variant: 'spin',
  },
};

/**
 * Searching BoardGameGeek
 *
 * Example of loading text for BGG API integration.
 */
export const SearchingBGG: Story = {
  args: {
    isVisible: true,
    text: 'Searching BoardGameGeek...',
    variant: 'roll',
  },
};

/**
 * Creating Listing
 *
 * Example of loading text for listing creation.
 */
export const CreatingListing: Story = {
  args: {
    isVisible: true,
    text: 'Creating your listing...',
    variant: 'roll',
  },
};

/**
 * Signing In
 *
 * Example of loading text for authentication.
 */
export const SigningIn: Story = {
  args: {
    isVisible: true,
    text: 'Signing in...',
    variant: 'bounce',
  },
};

/**
 * Uploading Images
 *
 * Example of loading text for image upload.
 */
export const UploadingImages: Story = {
  args: {
    isVisible: true,
    text: 'Uploading images...',
    variant: 'roll',
  },
};

/**
 * Updating Profile
 *
 * Example of loading text for profile updates.
 */
export const UpdatingProfile: Story = {
  args: {
    isVisible: true,
    text: 'Updating your profile...',
    variant: 'bounce',
  },
};

/**
 * Loading Game Information
 *
 * Example of loading text when fetching game details.
 */
export const LoadingGameInfo: Story = {
  args: {
    isVisible: true,
    text: 'Loading game information...',
    variant: 'bounce',
  },
};

/**
 * Adding to Cart
 *
 * Example of loading text for cart operations.
 */
export const AddingToCart: Story = {
  args: {
    isVisible: true,
    text: 'Adding to cart...',
    variant: 'bounce',
  },
};

/**
 * Long Loading Text
 *
 * Tests component behavior with lengthy loading messages.
 * Text wraps appropriately on mobile devices.
 */
export const LongLoadingText: Story = {
  args: {
    isVisible: true,
    text: 'Loading your complete board game collection from BoardGameGeek...',
    variant: 'roll',
  },
};

/**
 * Short Loading Text
 *
 * Minimal loading message.
 */
export const ShortLoadingText: Story = {
  args: {
    isVisible: true,
    text: 'Wait...',
    variant: 'spin',
  },
};

/**
 * Success Message
 *
 * Example of a success-oriented loading message.
 */
export const SuccessMessage: Story = {
  args: {
    isVisible: true,
    text: 'Account created successfully!',
    variant: 'bounce',
  },
};

/**
 * Responsive Behavior
 *
 * Resize your browser to see how DiceLoader adapts to different screen sizes.
 * The dice and text scale appropriately for mobile, tablet, and desktop.
 */
export const ResponsiveBehavior: Story = {
  args: {
    isVisible: true,
    text: 'Resize browser to see responsive behavior',
    variant: 'roll',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The component automatically adapts to different screen sizes. On mobile devices, the dice and text are smaller. On tablets and desktops, they scale up for better visibility.',
      },
    },
  },
};
