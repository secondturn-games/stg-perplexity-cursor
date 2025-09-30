'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import styles from './DiceLoader.module.css';

interface DiceLoaderProps {
  isVisible: boolean;
  text?: string;
  variant?: 'roll' | 'bounce' | 'spin';
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/**
 * DiceLoader - 2D Dice Loading Animation Component
 * Displays an overlay with animated dice and loading text
 * Integrated with the design system's colors, typography, and z-index layers
 */
const DiceLoader = ({
  isVisible,
  text = 'Loading...',
  variant = 'roll',
}: DiceLoaderProps) => {
  const [currentDiceIndex, setCurrentDiceIndex] = useState(0);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Cycle through dice faces
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentDiceIndex((prev: number) => (prev + 1) % DICE_FACES.length);
    }, 150);

    return () => {
      clearInterval(interval);
    };
  }, [isVisible]);

  // Focus management for accessibility
  useEffect(() => {
    if (isVisible) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus when loader is hidden
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const getAnimationClass = () => {
    switch (variant) {
      case 'bounce':
        return styles['diceBounce'];
      case 'spin':
        return styles['diceSpin'];
      case 'roll':
      default:
        return styles['diceRoll'];
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-primary-500/90 backdrop-blur-md',
        'transition-opacity duration-200'
      )}
      role='alert'
      aria-live='polite'
      aria-busy='true'
      aria-label={text}
    >
      <div className='flex flex-col items-center gap-4 px-4 sm:gap-6'>
        {/* Dice Container */}
        <div className='relative flex h-24 w-24 items-center justify-center sm:h-32 sm:w-32 md:h-40 md:w-40'>
          {/* Glow Effect */}
          <div
            className={cn(
              'absolute h-full w-full rounded-full bg-warning-400 opacity-20 blur-3xl',
              'animate-pulse'
            )}
            aria-hidden='true'
          />

          {/* Dice */}
          <div
            className={cn(
              'relative text-6xl text-accent-500 sm:text-7xl md:text-8xl',
              getAnimationClass()
            )}
            style={{
              textShadow:
                '0 0 20px rgba(242, 201, 76, 0.5), 0 0 40px rgba(217, 83, 35, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)',
            }}
            aria-hidden='true'
          >
            {DICE_FACES[currentDiceIndex]}
          </div>
        </div>

        {/* Loading Text */}
        <div className='text-center'>
          <p
            className={cn(
              'font-sans text-lg font-medium text-background-100 sm:text-xl md:text-2xl',
              styles['textPulse']
            )}
          >
            {text}
          </p>

          {/* Loading Dots */}
          <div className='mt-2 flex justify-center gap-1' aria-hidden='true'>
            {[0, 1, 2].map(index => (
              <span
                key={index}
                className={cn(
                  'text-xl text-warning-400 sm:text-2xl',
                  styles['dot']
                )}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                •
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceLoader;
