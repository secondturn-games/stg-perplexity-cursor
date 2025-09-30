/**
 * DiceLoader Storybook Stories
 * Interactive documentation and examples for the DiceLoader component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import DiceLoader from './DiceLoader';
import {
  SafeDiceLoader,
  DiceLoaderErrorBoundary,
} from './DiceLoaderErrorBoundary';
import { useLoading } from '@/hooks/useLoading';
import { Button } from './Button';
import { Input } from './Input';
import { api } from '@/lib/api';

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
 * Contextual Loading Messages
 *
 * Examples of appropriate loading text for different contexts.
 * Always use clear, specific messages that tell users what's happening.
 */
export const ContextualMessages: Story = {
  render: () => {
    const [currentExample, setCurrentExample] = useState(0);
    const examples = [
      { text: 'Loading marketplace...', variant: 'spin' as const },
      { text: 'Searching BoardGameGeek...', variant: 'roll' as const },
      { text: 'Creating your listing...', variant: 'roll' as const },
      { text: 'Signing in...', variant: 'bounce' as const },
      { text: 'Uploading images...', variant: 'roll' as const },
      { text: 'Updating your profile...', variant: 'bounce' as const },
      { text: 'Loading game information...', variant: 'bounce' as const },
      { text: 'Adding to cart...', variant: 'bounce' as const },
    ];

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentExample(prev => (prev + 1) % examples.length);
      }, 3000);

      return () => clearInterval(interval);
    }, []);

    return (
      <div>
        <DiceLoader
          isVisible={true}
          text={examples[currentExample].text}
          variant={examples[currentExample].variant}
        />
        <div className='fixed bottom-4 left-4 rounded-lg bg-white p-4 shadow-lg'>
          <p className='text-sm text-gray-600'>
            Cycling through contextual examples...
          </p>
          <p className='mt-1 text-xs text-gray-500'>
            {currentExample + 1} of {examples.length}
          </p>
        </div>
      </div>
    );
  },
};

/**
 * With useLoading Hook
 *
 * Real-world example showing integration with the useLoading hook.
 * This is the recommended pattern for managing loading states.
 */
export const WithUseLoadingHook: Story = {
  render: () => {
    const { isLoading, withLoading } = useLoading();
    const [data, setData] = useState<string | null>(null);

    const simulateApiCall = async () => {
      setData(null);
      await withLoading(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setData('Data loaded successfully!');
      });
    };

    return (
      <div className='flex min-h-screen items-center justify-center bg-background-100 p-8'>
        <div className='card max-w-md space-y-4 text-center'>
          <h2 className='text-xl font-normal text-primary-500'>
            useLoading Hook Integration
          </h2>
          <p className='text-regular text-gray-600'>
            Click the button to trigger a simulated API call with loading state
          </p>
          <Button onClick={simulateApiCall} disabled={isLoading}>
            Simulate API Call
          </Button>
          {data && !isLoading && (
            <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
              <p className='text-regular text-green-800'>✓ {data}</p>
            </div>
          )}
        </div>
        <DiceLoader isVisible={isLoading} text='Fetching data...' />
      </div>
    );
  },
};

/**
 * Form Submission Example
 *
 * Shows how DiceLoader integrates with form submissions.
 * Demonstrates input disabling and success states.
 */
export const FormSubmissionExample: Story = {
  render: () => {
    const { isLoading, withLoading } = useLoading();
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSuccess(false);
      setError(null);

      try {
        await withLoading(async () => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Simulate validation
          if (!formData.name || !formData.email) {
            throw new Error('Please fill in all fields');
          }

          setSuccess(true);
          setFormData({ name: '', email: '' });
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Submission failed');
      }
    };

    return (
      <div className='flex min-h-screen items-center justify-center bg-background-100 p-8'>
        <div className='card max-w-md'>
          <h2 className='mb-6 text-xl font-normal text-primary-500'>
            Contact Form Example
          </h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='form-label'>Name</label>
              <Input
                type='text'
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isLoading}
                placeholder='Your name'
              />
            </div>
            <div>
              <label className='form-label'>Email</label>
              <Input
                type='email'
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={isLoading}
                placeholder='your.email@example.com'
              />
            </div>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>
            {success && !isLoading && (
              <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                <p className='text-center text-regular text-green-800'>
                  ✓ Form submitted successfully!
                </p>
              </div>
            )}
            {error && (
              <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                <p className='text-center text-regular text-red-800'>{error}</p>
              </div>
            )}
          </form>
        </div>
        <DiceLoader isVisible={isLoading} text='Submitting form...' />
      </div>
    );
  },
};

/**
 * Multiple Operations
 *
 * Demonstrates loading counter handling multiple concurrent operations.
 * Loading persists until ALL operations complete.
 */
export const MultipleOperations: Story = {
  render: () => {
    const { isLoading, withLoading } = useLoading();
    const [results, setResults] = useState<string[]>([]);

    const runMultipleOperations = async () => {
      setResults([]);

      const operations = [
        withLoading(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return 'Operation 1 complete';
        }),
        withLoading(async () => {
          await new Promise(resolve => setTimeout(resolve, 3000));
          return 'Operation 2 complete';
        }),
        withLoading(async () => {
          await new Promise(resolve => setTimeout(resolve, 4000));
          return 'Operation 3 complete';
        }),
      ];

      try {
        const allResults = await Promise.all(operations);
        setResults(allResults);
      } catch (error) {
        console.error('Error in operations:', error);
      }
    };

    return (
      <div className='flex min-h-screen items-center justify-center bg-background-100 p-8'>
        <div className='card max-w-md space-y-4'>
          <h2 className='text-xl font-normal text-primary-500'>
            Multiple Concurrent Operations
          </h2>
          <p className='text-regular text-gray-600'>
            Loading state persists until all operations complete
          </p>
          <Button onClick={runMultipleOperations} disabled={isLoading}>
            Run 3 Operations
          </Button>
          {results.length > 0 && (
            <ul className='ml-4 list-disc space-y-1 text-regular text-gray-600'>
              {results.map((result, index) => (
                <li key={index}>{result}</li>
              ))}
            </ul>
          )}
        </div>
        <DiceLoader isVisible={isLoading} text='Running operations...' />
      </div>
    );
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
 * With Error Boundary
 *
 * Shows the SafeDiceLoader wrapper with error boundary protection.
 * If DiceLoader encounters an error, it fails gracefully.
 */
export const WithErrorBoundary: Story = {
  render: () => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className='flex min-h-screen items-center justify-center bg-background-100 p-8'>
        <div className='card max-w-md space-y-4 text-center'>
          <h2 className='text-xl font-normal text-primary-500'>
            Error Boundary Protection
          </h2>
          <p className='text-regular text-gray-600'>
            DiceLoader wrapped in error boundary for graceful failure handling
          </p>
          <Button onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? 'Hide Loader' : 'Show Loader'}
          </Button>
          <div className='rounded-lg bg-gray-100 p-3 text-left'>
            <code className='text-xs'>
              &lt;SafeDiceLoader isVisible=&#123;isVisible&#125; /&gt;
            </code>
          </div>
        </div>
        <SafeDiceLoader
          isVisible={isVisible}
          text='Protected by error boundary'
        />
      </div>
    );
  },
};

/**
 * Authentication Flow
 *
 * Realistic authentication scenario with loading states.
 */
export const AuthenticationFlow: Story = {
  render: () => {
    const { isLoading, withLoading } = useLoading();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Signing in...');

    const handleSignIn = async (e: React.FormEvent) => {
      e.preventDefault();
      setSuccess(false);
      setLoadingMessage('Signing in...');

      try {
        await withLoading(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          setSuccess(true);
          setLoadingMessage('Sign in successful!');
          await new Promise(resolve => setTimeout(resolve, 500));
        });
      } catch (error) {
        console.error('Sign in failed:', error);
      }
    };

    return (
      <div className='flex min-h-screen items-center justify-center bg-background-100 p-8'>
        <div className='card w-full max-w-md'>
          <h2 className='mb-6 text-center text-2xl font-normal text-primary-500'>
            Sign In
          </h2>
          <form onSubmit={handleSignIn} className='space-y-4'>
            <div>
              <label className='form-label'>Email</label>
              <Input
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder='your.email@example.com'
              />
            </div>
            <div>
              <label className='form-label'>Password</label>
              <Input
                type='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder='••••••••'
              />
            </div>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            {success && !isLoading && (
              <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                <p className='text-center text-regular text-green-800'>
                  ✓ Sign in successful!
                </p>
              </div>
            )}
          </form>
        </div>
        <DiceLoader
          isVisible={isLoading}
          text={loadingMessage}
          variant='bounce'
        />
      </div>
    );
  },
};

/**
 * Marketplace Search
 *
 * Realistic marketplace search scenario with loading.
 */
export const MarketplaceSearch: Story = {
  render: () => {
    const { isLoading, withLoading } = useLoading();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<string[]>([]);

    const handleSearch = async (searchQuery: string) => {
      setQuery(searchQuery);

      if (searchQuery.length < 3) {
        setResults([]);
        return;
      }

      try {
        await withLoading(async () => {
          await new Promise(resolve => setTimeout(resolve, 1500));
          setResults([
            'Catan',
            'Ticket to Ride',
            'Carcassonne',
            'Pandemic',
            'Azul',
          ]);
        });
      } catch (error) {
        console.error('Search failed:', error);
      }
    };

    return (
      <div className='flex min-h-screen items-center justify-center bg-background-100 p-8'>
        <div className='w-full max-w-2xl space-y-6'>
          <div className='card'>
            <h2 className='mb-4 text-xl font-normal text-primary-500'>
              Marketplace Search
            </h2>
            <Input
              type='text'
              value={query}
              onChange={e => handleSearch(e.target.value)}
              disabled={isLoading}
              placeholder='Search for board games...'
            />
          </div>
          {results.length > 0 && !isLoading && (
            <div className='card'>
              <h3 className='mb-3 text-lg font-medium text-gray-900'>
                Results ({results.length})
              </h3>
              <ul className='space-y-2'>
                {results.map((result, index) => (
                  <li
                    key={index}
                    className='rounded-lg border border-gray-200 p-3 text-regular text-gray-700'
                  >
                    {result}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DiceLoader
          isVisible={isLoading}
          text='Searching marketplace...'
          variant='spin'
        />
      </div>
    );
  },
};

/**
 * Image Upload
 *
 * Image upload flow with loading indication.
 */
export const ImageUpload: Story = {
  render: () => {
    const { isLoading, withLoading } = useLoading();
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

    const handleUpload = async (files: FileList) => {
      try {
        await withLoading(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Simulate uploaded images
          const mockUrls = Array.from(files).map(
            (_, index) =>
              `https://via.placeholder.com/150?text=Image+${index + 1}`
          );
          setUploadedImages(prev => [...prev, ...mockUrls]);
        });
      } catch (error) {
        console.error('Upload failed:', error);
      }
    };

    return (
      <div className='flex min-h-screen items-center justify-center bg-background-100 p-8'>
        <div className='card max-w-md space-y-4'>
          <h2 className='text-xl font-normal text-primary-500'>Image Upload</h2>
          <div>
            <label className='form-label'>Choose Images</label>
            <input
              type='file'
              multiple
              accept='image/*'
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleUpload(e.target.files);
                }
              }}
              disabled={isLoading}
              className='block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-accent-500 file:px-4 file:py-2 file:text-white hover:file:bg-accent-600'
            />
          </div>
          {uploadedImages.length > 0 && (
            <div className='grid grid-cols-3 gap-2'>
              {uploadedImages.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className='aspect-square rounded object-cover'
                />
              ))}
            </div>
          )}
        </div>
        <DiceLoader isVisible={isLoading} text='Uploading images...' />
      </div>
    );
  },
};

/**
 * Success Transition
 *
 * Shows smooth transition from loading to success state.
 */
export const SuccessTransition: Story = {
  render: () => {
    const { isLoading, withLoading } = useLoading();
    const [loadingMessage, setLoadingMessage] = useState('Processing...');
    const [success, setSuccess] = useState(false);

    const handleAction = async () => {
      setSuccess(false);
      setLoadingMessage('Processing your request...');

      try {
        await withLoading(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          setSuccess(true);
          setLoadingMessage('Success!');
          await new Promise(resolve => setTimeout(resolve, 800));
        });
      } catch (error) {
        console.error('Action failed:', error);
      }
    };

    return (
      <div className='flex min-h-screen items-center justify-center bg-background-100 p-8'>
        <div className='card max-w-md space-y-4 text-center'>
          <h2 className='text-xl font-normal text-primary-500'>
            Success Transition
          </h2>
          <p className='text-regular text-gray-600'>
            Watch the smooth transition from loading to success
          </p>
          <Button onClick={handleAction} disabled={isLoading}>
            Trigger Action
          </Button>
          {success && !isLoading && (
            <div className='animate-slide-up rounded-lg border border-green-200 bg-green-50 p-4'>
              <p className='text-regular text-green-800'>
                ✓ Operation completed successfully!
              </p>
            </div>
          )}
        </div>
        <DiceLoader
          isVisible={isLoading}
          text={loadingMessage}
          variant='bounce'
        />
      </div>
    );
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

/**
 * Accessibility Features
 *
 * Interactive demonstration of accessibility features.
 * Try using a screen reader or enabling reduced motion in your OS.
 */
export const AccessibilityFeatures: Story = {
  render: () => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className='flex min-h-screen items-center justify-center bg-background-100 p-8'>
        <div className='card max-w-2xl space-y-6'>
          <h2 className='text-xl font-normal text-primary-500'>
            Accessibility Features
          </h2>

          <div className='space-y-4'>
            <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                ARIA Attributes
              </h3>
              <ul className='ml-4 mt-2 list-disc space-y-1 text-regular text-gray-600'>
                <li>
                  <code>role="alert"</code> - Announces to screen readers
                </li>
                <li>
                  <code>aria-live="polite"</code> - Non-interruptive updates
                </li>
                <li>
                  <code>aria-busy="true"</code> - Indicates loading state
                </li>
                <li>
                  <code>aria-label</code> - Provides accessible name
                </li>
                <li>
                  <code>aria-hidden</code> - Hides decorative elements
                </li>
              </ul>
            </div>

            <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Focus Management
              </h3>
              <ul className='ml-4 mt-2 list-disc space-y-1 text-regular text-gray-600'>
                <li>Saves currently focused element on show</li>
                <li>Restores focus when hidden</li>
                <li>Prevents body scroll during loading</li>
                <li>No keyboard trap created</li>
              </ul>
            </div>

            <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Color Contrast
              </h3>
              <ul className='ml-4 mt-2 list-disc space-y-1 text-regular text-gray-600'>
                <li>Loading text: 8.2:1 (AAA compliant)</li>
                <li>Dice symbol: 4.8:1 (AA compliant)</li>
                <li>Loading dots: 9.1:1 (AAA compliant)</li>
              </ul>
            </div>

            <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Reduced Motion
              </h3>
              <p className='mt-2 text-regular text-gray-600'>
                Enable "Reduce motion" in your OS accessibility settings to see
                animations become static while maintaining functionality.
              </p>
            </div>
          </div>

          <Button onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? 'Hide Loader' : 'Show Loader'}
          </Button>
        </div>
        <DiceLoader
          isVisible={isVisible}
          text='Testing accessibility features...'
        />
      </div>
    );
  },
};

/**
 * Do's and Don'ts
 *
 * Best practices for using the DiceLoader component.
 */
export const BestPractices: Story = {
  render: () => {
    return (
      <div className='min-h-screen bg-background-100 p-8'>
        <div className='mx-auto max-w-4xl space-y-8'>
          <div className='text-center'>
            <h1 className='text-3xl font-normal text-primary-500'>
              DiceLoader Best Practices
            </h1>
            <p className='mt-2 text-regular text-gray-600'>
              Guidelines for proper usage
            </p>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* DO's */}
            <div className='card space-y-4'>
              <h2 className='text-xl font-normal text-green-700'>✅ DO</h2>

              <div className='space-y-3'>
                <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                  <p className='text-sm font-medium text-green-900'>
                    Use clear, specific loading messages
                  </p>
                  <code className='mt-1 block text-xs text-green-700'>
                    text="Loading marketplace..."
                  </code>
                </div>

                <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                  <p className='text-sm font-medium text-green-900'>
                    Choose appropriate variant for context
                  </p>
                  <code className='mt-1 block text-xs text-green-700'>
                    variant="bounce" // for user actions
                  </code>
                </div>

                <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                  <p className='text-sm font-medium text-green-900'>
                    Use with useLoading hook
                  </p>
                  <code className='mt-1 block text-xs text-green-700'>
                    const &#123;isLoading, withLoading&#125; = useLoading();
                  </code>
                </div>

                <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                  <p className='text-sm font-medium text-green-900'>
                    Disable inputs during loading
                  </p>
                  <code className='mt-1 block text-xs text-green-700'>
                    &lt;Input disabled=&#123;isLoading&#125; /&gt;
                  </code>
                </div>

                <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                  <p className='text-sm font-medium text-green-900'>
                    Use error boundary for safety
                  </p>
                  <code className='mt-1 block text-xs text-green-700'>
                    &lt;SafeDiceLoader ... /&gt;
                  </code>
                </div>
              </div>
            </div>

            {/* DON'Ts */}
            <div className='card space-y-4'>
              <h2 className='text-xl font-normal text-red-700'>❌ DON'T</h2>

              <div className='space-y-3'>
                <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                  <p className='text-sm font-medium text-red-900'>
                    Don't use vague messages
                  </p>
                  <code className='mt-1 block text-xs text-red-700'>
                    text="Please wait..." // ❌ Too vague
                  </code>
                </div>

                <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                  <p className='text-sm font-medium text-red-900'>
                    Don't show multiple loaders
                  </p>
                  <code className='mt-1 block text-xs text-red-700'>
                    // ❌ Confusing UX
                  </code>
                </div>

                <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                  <p className='text-sm font-medium text-red-900'>
                    Don't use for inline loading
                  </p>
                  <code className='mt-1 block text-xs text-red-700'>
                    &lt;button&gt;&lt;DiceLoader /&gt;&lt;/button&gt; // ❌
                  </code>
                </div>

                <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                  <p className='text-sm font-medium text-red-900'>
                    Don't forget to handle errors
                  </p>
                  <code className='mt-1 block text-xs text-red-700'>
                    // ❌ Always use try-catch
                  </code>
                </div>

                <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                  <p className='text-sm font-medium text-red-900'>
                    Don't show for very fast operations
                  </p>
                  <code className='mt-1 block text-xs text-red-700'>
                    // ❌ Use loadingDelay: 300
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * All Variants Comparison
 *
 * Side-by-side comparison of all three animation variants.
 * Use this to choose the right variant for your use case.
 */
export const AllVariantsComparison: Story = {
  render: () => {
    const [activeVariant, setActiveVariant] = useState<
      'roll' | 'bounce' | 'spin' | null
    >(null);

    return (
      <div className='min-h-screen bg-background-100 p-8'>
        <div className='mx-auto max-w-6xl space-y-8'>
          <div className='text-center'>
            <h1 className='text-3xl font-normal text-primary-500'>
              Animation Variants
            </h1>
            <p className='mt-2 text-regular text-gray-600'>
              Click a variant to preview it in full-screen mode
            </p>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            {/* Roll */}
            <button
              onClick={() => setActiveVariant('roll')}
              className='card space-y-4 text-left transition-shadow hover:shadow-xl'
            >
              <h2 className='text-xl font-normal text-primary-500'>Roll</h2>
              <p className='text-regular text-gray-600'>
                360° rotation with scale effects. Best for general loading.
              </p>
              <div className='rounded-lg bg-gray-100 p-4 text-center'>
                <div className='text-6xl text-accent-500'>⚃</div>
              </div>
              <p className='text-sm text-gray-500'>
                <strong>Use for:</strong> Page loading, API calls, content
              </p>
            </button>

            {/* Bounce */}
            <button
              onClick={() => setActiveVariant('bounce')}
              className='card space-y-4 text-left transition-shadow hover:shadow-xl'
            >
              <h2 className='text-xl font-normal text-primary-500'>Bounce</h2>
              <p className='text-regular text-gray-600'>
                Vertical movement with rotation. Best for interactive
                operations.
              </p>
              <div className='rounded-lg bg-gray-100 p-4 text-center'>
                <div className='text-6xl text-accent-500'>⚄</div>
              </div>
              <p className='text-sm text-gray-500'>
                <strong>Use for:</strong> Auth, profiles, user actions
              </p>
            </button>

            {/* Spin */}
            <button
              onClick={() => setActiveVariant('spin')}
              className='card space-y-4 text-left transition-shadow hover:shadow-xl'
            >
              <h2 className='text-xl font-normal text-primary-500'>Spin</h2>
              <p className='text-regular text-gray-600'>
                Continuous Y-axis rotation. Best for background operations.
              </p>
              <div className='rounded-lg bg-gray-100 p-4 text-center'>
                <div className='text-6xl text-accent-500'>⚅</div>
              </div>
              <p className='text-sm text-gray-500'>
                <strong>Use for:</strong> Search, dashboard, queries
              </p>
            </button>
          </div>

          {activeVariant && (
            <div className='text-center'>
              <Button
                variant='secondary'
                onClick={() => setActiveVariant(null)}
              >
                Close Preview
              </Button>
            </div>
          )}
        </div>

        {activeVariant && (
          <DiceLoader
            isVisible={true}
            text={`${activeVariant.charAt(0).toUpperCase() + activeVariant.slice(1)} animation variant`}
            variant={activeVariant}
          />
        )}
      </div>
    );
  },
};
