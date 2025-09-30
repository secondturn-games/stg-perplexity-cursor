'use client';

import { useEffect, useState } from 'react';
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
 */
const DiceLoader = ({
  isVisible,
  text = 'Loading...',
  variant = 'roll',
}: DiceLoaderProps) => {
  const [currentDiceIndex, setCurrentDiceIndex] = useState(0);

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
      className={styles['overlay']}
      role='alert'
      aria-live='polite'
      aria-busy='true'
      aria-label={text}
    >
      <div className={styles['container']}>
        {/* Dice Container */}
        <div className={styles['diceContainer']}>
          {/* Glow Effect */}
          <div className={styles['diceGlow']} />

          {/* Dice */}
          <div className={`${styles['dice']} ${getAnimationClass()}`}>
            {DICE_FACES[currentDiceIndex]}
          </div>
        </div>

        {/* Loading Text */}
        <div className={styles['textContainer']}>
          <p className={styles['loadingText']}>{text}</p>
          <div className={styles['dotsContainer']}>
            <span className={styles['dot']}>•</span>
            <span className={styles['dot']}>•</span>
            <span className={styles['dot']}>•</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceLoader;