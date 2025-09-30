/**
 * DiceLoader Component - Usage Examples
 * Demonstrates integration with the Baltic Board Game Marketplace design system
 */

'use client';

import { useState } from 'react';
import DiceLoader from './DiceLoader';
import { Button } from './Button';

export default function DiceLoaderExample() {
  const [isLoadingRoll, setIsLoadingRoll] = useState(false);
  const [isLoadingBounce, setIsLoadingBounce] = useState(false);
  const [isLoadingSpin, setIsLoadingSpin] = useState(false);

  const simulateLoading = (
    setter: (value: boolean) => void,
    duration = 3000
  ) => {
    setter(true);
    setTimeout(() => {
      setter(false);
    }, duration);
  };

  return (
    <div className='mx-auto max-w-4xl space-y-8 p-8'>
      <div className='space-y-4'>
        <h1 className='text-3xl font-normal text-primary-500'>
          DiceLoader Component Examples
        </h1>
        <p className='text-regular text-gray-600'>
          Integrated with the Baltic Board Game Marketplace design system
        </p>
      </div>

      {/* Basic Usage */}
      <section className='card space-y-4'>
        <h2 className='text-xl font-normal text-primary-500'>
          Basic Usage (Roll Variant)
        </h2>
        <p className='text-regular text-gray-600'>
          Default animation with rolling dice effect.
        </p>
        <Button onClick={() => simulateLoading(setIsLoadingRoll)}>
          Show Roll Loader
        </Button>
        <DiceLoader isVisible={isLoadingRoll} text='Loading board games...' />
      </section>

      {/* Bounce Variant */}
      <section className='card space-y-4'>
        <h2 className='text-xl font-normal text-primary-500'>
          Bounce Variant
        </h2>
        <p className='text-regular text-gray-600'>
          Dice bounces vertically while rotating.
        </p>
        <Button onClick={() => simulateLoading(setIsLoadingBounce)}>
          Show Bounce Loader
        </Button>
        <DiceLoader
          isVisible={isLoadingBounce}
          text='Fetching marketplace listings...'
          variant='bounce'
        />
      </section>

      {/* Spin Variant */}
      <section className='card space-y-4'>
        <h2 className='text-xl font-normal text-primary-500'>Spin Variant</h2>
        <p className='text-regular text-gray-600'>
          Dice spins continuously on Y-axis.
        </p>
        <Button onClick={() => simulateLoading(setIsLoadingSpin)}>
          Show Spin Loader
        </Button>
        <DiceLoader
          isVisible={isLoadingSpin}
          text='Processing your order...'
          variant='spin'
        />
      </section>

      {/* API Integration Example */}
      <section className='card space-y-4'>
        <h3 className='text-lg font-normal text-primary-500'>
          API Integration Example
        </h3>
        <pre className='overflow-x-auto rounded-lg bg-gray-100 p-4 text-sm'>
          {`// Example: Using DiceLoader with API calls
'use client';

import { useState } from 'react';
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
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DiceLoader 
        isVisible={isLoading} 
        text="Loading games..." 
        variant="roll"
      />
      {/* Your page content */}
    </>
  );
}`}
        </pre>
      </section>

      {/* Design System Integration */}
      <section className='card space-y-4'>
        <h3 className='text-lg font-normal text-primary-500'>
          Design System Integration
        </h3>
        <div className='space-y-3 text-regular'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <h4 className='font-semibold text-gray-800'>Colors Used</h4>
              <ul className='ml-4 mt-2 list-disc space-y-1 text-gray-600'>
                <li>
                  <span className='font-medium'>Background:</span> Dark Green
                  (primary-500) with 90% opacity
                </li>
                <li>
                  <span className='font-medium'>Dice:</span> Vibrant Orange
                  (accent-500)
                </li>
                <li>
                  <span className='font-medium'>Text:</span> Light Beige
                  (background-100)
                </li>
                <li>
                  <span className='font-medium'>Glow/Dots:</span> Warm Yellow
                  (warning-400)
                </li>
              </ul>
            </div>
            <div>
              <h4 className='font-semibold text-gray-800'>Features</h4>
              <ul className='ml-4 mt-2 list-disc space-y-1 text-gray-600'>
                <li>Z-index: 50 (above navigation)</li>
                <li>Backdrop blur for depth</li>
                <li>Focus management & restoration</li>
                <li>Body scroll prevention</li>
                <li>WCAG 2.1 AA compliant</li>
                <li>Respects prefers-reduced-motion</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Props Documentation */}
      <section className='card space-y-4'>
        <h3 className='text-lg font-normal text-primary-500'>
          Props Documentation
        </h3>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead className='border-b-2 border-gray-200 bg-gray-50'>
              <tr>
                <th className='px-4 py-3 font-semibold text-gray-800'>Prop</th>
                <th className='px-4 py-3 font-semibold text-gray-800'>Type</th>
                <th className='px-4 py-3 font-semibold text-gray-800'>
                  Default
                </th>
                <th className='px-4 py-3 font-semibold text-gray-800'>
                  Description
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              <tr>
                <td className='px-4 py-3 font-mono text-accent-600'>
                  isVisible
                </td>
                <td className='px-4 py-3 font-mono text-gray-600'>boolean</td>
                <td className='px-4 py-3 text-gray-600'>-</td>
                <td className='px-4 py-3 text-gray-600'>
                  Controls loader visibility (required)
                </td>
              </tr>
              <tr>
                <td className='px-4 py-3 font-mono text-accent-600'>text</td>
                <td className='px-4 py-3 font-mono text-gray-600'>string</td>
                <td className='px-4 py-3 font-mono text-gray-600'>
                  "Loading..."
                </td>
                <td className='px-4 py-3 text-gray-600'>
                  Custom loading text message
                </td>
              </tr>
              <tr>
                <td className='px-4 py-3 font-mono text-accent-600'>variant</td>
                <td className='px-4 py-3 font-mono text-gray-600'>
                  "roll" | "bounce" | "spin"
                </td>
                <td className='px-4 py-3 font-mono text-gray-600'>"roll"</td>
                <td className='px-4 py-3 text-gray-600'>
                  Animation style variant
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Accessibility Notes */}
      <section className='card space-y-4'>
        <h3 className='text-lg font-normal text-primary-500'>
          Accessibility Features
        </h3>
        <ul className='ml-6 list-disc space-y-2 text-regular text-gray-600'>
          <li>
            <strong>ARIA Attributes:</strong> Includes role="alert",
            aria-live="polite", aria-busy="true"
          </li>
          <li>
            <strong>Focus Management:</strong> Saves and restores focus when
            loader shows/hides
          </li>
          <li>
            <strong>Scroll Lock:</strong> Prevents body scroll while loading
          </li>
          <li>
            <strong>Screen Reader:</strong> Loading text is announced to
            assistive technology
          </li>
          <li>
            <strong>Reduced Motion:</strong> Respects prefers-reduced-motion
            for users with vestibular disorders
          </li>
          <li>
            <strong>Decorative Elements:</strong> Dice and dots marked with
            aria-hidden
          </li>
        </ul>
      </section>
    </div>
  );
}