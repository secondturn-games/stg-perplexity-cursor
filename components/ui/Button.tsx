import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-button transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        // Primary Button - Vibrant Orange for CTAs only
        primary:
          'bg-accent-500 hover:bg-accent-600 active:scale-95 text-white focus-visible:ring-accent-500',
        // Secondary Button - Dark Green outline
        secondary:
          'bg-transparent border border-primary-500 text-primary-500 hover:bg-primary-50 focus-visible:ring-primary-500',
        // Tertiary Button - Orange text only
        tertiary:
          'bg-transparent text-accent-500 hover:bg-accent-50 focus-visible:ring-accent-500',
        // Destructive Button
        destructive:
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        // Ghost Button
        ghost: 'hover:bg-gray-100 text-gray-900 focus-visible:ring-gray-500',
        // Link Button
        link: 'underline-offset-4 hover:underline text-accent-500 focus-visible:ring-accent-500',
      },
      size: {
        default: 'h-12 py-3 px-6',
        sm: 'h-10 py-2 px-4',
        lg: 'h-14 py-4 px-8',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className='animate-spin -ml-1 mr-2 h-4 w-4'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
