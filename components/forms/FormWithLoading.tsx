/**
 * Form With Loading Component
 * Reusable wrapper for forms with loading states and success transitions
 */

'use client';

import { ReactNode } from 'react';
import { DiceLoader } from '@/components/ui';
import { Alert } from '@/components/ui/Alert';

interface FormWithLoadingProps {
  /**
   * Form content (inputs, buttons, etc.)
   */
  children: ReactNode;

  /**
   * Form submission handler
   */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Loading text to display
   */
  loadingText?: string;

  /**
   * Animation variant
   */
  loadingVariant?: 'roll' | 'bounce' | 'spin';

  /**
   * Error message to display
   */
  error?: string | null;

  /**
   * Success message to display
   */
  success?: string | null;

  /**
   * Form className
   */
  className?: string;

  /**
   * Form aria-label
   */
  ariaLabel?: string;
}

/**
 * FormWithLoading - Reusable form wrapper with loading states
 *
 * @example
 * ```tsx
 * const { isLoading, withLoading } = useLoading();
 * const [error, setError] = useState(null);
 * const [success, setSuccess] = useState(null);
 *
 * const handleSubmit = async (e) => {
 *   e.preventDefault();
 *   await withLoading(async () => {
 *     // Submit logic
 *     setSuccess('Form submitted!');
 *   });
 * };
 *
 * <FormWithLoading
 *   onSubmit={handleSubmit}
 *   isLoading={isLoading}
 *   loadingText="Submitting..."
 *   error={error}
 *   success={success}
 * >
 *   <input type="text" disabled={isLoading} />
 *   <button type="submit" disabled={isLoading}>Submit</button>
 * </FormWithLoading>
 * ```
 */
export default function FormWithLoading({
  children,
  onSubmit,
  isLoading,
  loadingText = 'Processing...',
  loadingVariant = 'roll',
  error,
  success,
  className = 'space-y-6',
  ariaLabel,
}: FormWithLoadingProps) {
  return (
    <div className='relative'>
      <form
        onSubmit={onSubmit}
        className={className}
        aria-label={ariaLabel}
        aria-busy={isLoading}
      >
        {/* Error Alert */}
        {error && (
          <Alert variant='error' role='alert' aria-live='assertive'>
            <p>{error}</p>
          </Alert>
        )}

        {/* Success Alert */}
        {success && !isLoading && (
          <Alert variant='success' role='status' aria-live='polite'>
            <p>✓ {success}</p>
          </Alert>
        )}

        {/* Form Fields */}
        <fieldset disabled={isLoading} className='space-y-6'>
          {children}
        </fieldset>
      </form>

      {/* Loading Overlay */}
      <DiceLoader
        isVisible={isLoading}
        text={loadingText}
        variant={loadingVariant}
      />
    </div>
  );
}
