'use client';

import { useEffect, useState } from 'react';

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
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentDiceIndex((prev) => (prev + 1) % DICE_FACES.length);
    }, 150);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const getAnimationClass = () => {
    switch (variant) {
      case 'bounce':
        return 'animate-bounce-dice';
      case 'spin':
        return 'animate-spin-dice';
      case 'roll':
      default:
        return 'animate-roll-dice';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#29432B] bg-opacity-90 backdrop-blur-sm"
      role="alert"
      aria-live="polite"
      aria-busy="true"
      aria-label={text}
    >
      <div className="flex flex-col items-center gap-4 px-4 sm:gap-6">
        {/* Dice Container */}
        <div className="relative flex items-center justify-center">
          {/* Glow Effect */}
          <div className="absolute h-24 w-24 animate-pulse rounded-full bg-[#F2C94C] opacity-20 blur-xl sm:h-32 sm:w-32" />
          
          {/* Dice */}
          <div
            className={`relative text-7xl sm:text-8xl md:text-9xl ${getAnimationClass()}`}
            style={{
              color: '#D95323',
              textShadow: '0 0 20px rgba(242, 201, 76, 0.5), 0 0 40px rgba(217, 83, 35, 0.3)',
            }}
          >
            {DICE_FACES[currentDiceIndex]}
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <p className="text-lg font-medium text-[#E6EAD7] sm:text-xl md:text-2xl">
            {text}
          </p>
          <div className="mt-2 flex justify-center gap-1">
            <span className="animate-dot-bounce" style={{ animationDelay: '0ms' }}>
              •
            </span>
            <span className="animate-dot-bounce" style={{ animationDelay: '150ms' }}>
              •
            </span>
            <span className="animate-dot-bounce" style={{ animationDelay: '300ms' }}>
              •
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes roll-dice {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(90deg) scale(1.1);
          }
          50% {
            transform: rotate(180deg) scale(1);
          }
          75% {
            transform: rotate(270deg) scale(1.1);
          }
        }

        @keyframes bounce-dice {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.15);
          }
        }

        @keyframes spin-dice {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }

        @keyframes dot-bounce {
          0%, 80%, 100% {
            opacity: 0;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }

        .animate-roll-dice {
          animation: roll-dice 0.9s ease-in-out infinite;
        }

        .animate-bounce-dice {
          animation: bounce-dice 0.8s ease-in-out infinite;
        }

        .animate-spin-dice {
          animation: spin-dice 1s linear infinite;
        }

        .animate-dot-bounce {
          display: inline-block;
          color: #F2C94C;
          font-size: 1.5rem;
          animation: dot-bounce 1.4s ease-in-out infinite;
        }

        @media (max-width: 640px) {
          .animate-dot-bounce {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DiceLoader;