/**
 * Form Handlers with Loading State Integration
 * Utilities for handling form submissions with automatic loading states
 *
 * @module lib/form-handlers
 */

import type { UseLoadingReturn } from '@/hooks/useLoading';

/**
 * Form submission result
 */
export interface FormSubmissionResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  validationErrors?: Record<string, string>;
}

/**
 * Form handler options
 */
export interface FormHandlerOptions {
  /**
   * Whether to show loading animation during submission
   * @default true
   */
  showLoading?: boolean;

  /**
   * Delay before showing loading animation (in milliseconds)
   * @default 300
   */
  loadingDelay?: number;

  /**
   * Timeout for the submission (in milliseconds)
   * @default 30000
   */
  timeout?: number;

  /**
   * Callback on successful submission
   */
  onSuccess?: (data: any) => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;

  /**
   * Callback on validation error
   */
  onValidationError?: (errors: Record<string, string>) => void;

  /**
   * Whether to reset the form after successful submission
   * @default false
   */
  resetOnSuccess?: boolean;

  /**
   * Custom validation function
   * Return validation errors or null if valid
   */
  validate?: (data: any) => Record<string, string> | null;
}

/**
 * Create a form submission handler with loading state integration
 *
 * @param submitFn - The async function to execute on form submission
 * @param loadingHook - The useLoading hook instance
 * @param options - Handler configuration options
 * @returns Form submission handler function
 *
 * @example
 * ```tsx
 * const { isLoading, withLoading } = useLoading();
 *
 * const handleSubmit = createFormHandler(
 *   async (formData) => {
 *     const response = await fetch('/api/contact', {
 *       method: 'POST',
 *       body: JSON.stringify(formData),
 *     });
 *     return response.json();
 *   },
 *   { withLoading },
 *   {
 *     onSuccess: (data) => console.log('Success!', data),
 *     onError: (error) => console.error('Error:', error),
 *     resetOnSuccess: true,
 *   }
 * );
 *
 * <form onSubmit={(e) => {
 *   e.preventDefault();
 *   handleSubmit(formData);
 * }}>
 * ```
 */
export function createFormHandler<T = any, R = any>(
  submitFn: (data: T) => Promise<R>,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options: FormHandlerOptions = {}
): (
  data: T,
  formElement?: HTMLFormElement
) => Promise<FormSubmissionResult<R>> {
  const {
    showLoading = true,
    loadingDelay = 300,
    timeout = 30000,
    onSuccess,
    onError,
    onValidationError,
    resetOnSuccess = false,
    validate,
  } = options;

  return async (
    data: T,
    formElement?: HTMLFormElement
  ): Promise<FormSubmissionResult<R>> => {
    try {
      // Run validation if provided
      if (validate) {
        const validationErrors = validate(data);
        if (validationErrors && Object.keys(validationErrors).length > 0) {
          if (onValidationError) {
            onValidationError(validationErrors);
          }

          return {
            success: false,
            validationErrors,
          };
        }
      }

      // Execute submission with loading state
      const executeSubmission = async (): Promise<R> => {
        return submitFn(data);
      };

      let result: R;

      if (showLoading && loadingHook?.withLoading) {
        // Implement loading delay
        let showLoadingTimeout: NodeJS.Timeout | null = null;
        let shouldShowLoading = false;

        const delayPromise = new Promise<void>(resolve => {
          showLoadingTimeout = setTimeout(() => {
            shouldShowLoading = true;
            resolve();
          }, loadingDelay);
        });

        try {
          result = await executeSubmission();

          // Clear timeout if submission completes quickly
          if (showLoadingTimeout) {
            clearTimeout(showLoadingTimeout);
          }

          // If submission completed before delay, don't show loading
          if (shouldShowLoading) {
            await loadingHook.withLoading(async () => result, {
              timeout,
              ...(onError && { onError }),
            });
          }
        } catch (error) {
          if (showLoadingTimeout) {
            clearTimeout(showLoadingTimeout);
          }
          throw error;
        }
      } else {
        result = await executeSubmission();
      }

      // Handle success
      if (onSuccess) {
        onSuccess(result);
      }

      // Reset form if configured
      if (resetOnSuccess && formElement) {
        formElement.reset();
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      // Handle error
      if (onError) {
        onError(errorObj);
      }

      return {
        success: false,
        error: errorObj,
      };
    }
  };
}

/**
 * Create a React event handler for form submissions
 *
 * @param submitFn - The async function to execute on form submission
 * @param loadingHook - The useLoading hook instance
 * @param options - Handler configuration options
 * @returns React form event handler
 *
 * @example
 * ```tsx
 * const { isLoading, withLoading } = useLoading();
 * const [formData, setFormData] = useState({ email: '', message: '' });
 *
 * const handleSubmit = createFormEventHandler(
 *   async () => {
 *     const response = await fetch('/api/contact', {
 *       method: 'POST',
 *       body: JSON.stringify(formData),
 *     });
 *     return response.json();
 *   },
 *   { withLoading },
 *   {
 *     onSuccess: () => alert('Message sent!'),
 *     resetOnSuccess: true,
 *   }
 * );
 *
 * <form onSubmit={handleSubmit}>
 * ```
 */
export function createFormEventHandler<T = any>(
  submitFn: () => Promise<T>,
  loadingHook?: Pick<UseLoadingReturn, 'withLoading'>,
  options: FormHandlerOptions = {}
): (event: React.FormEvent<HTMLFormElement>) => Promise<void> {
  return async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const handler = createFormHandler(submitFn, loadingHook, options);

    await handler(null as any, formElement);
  };
}

/**
 * Create a handler for form field validation
 *
 * @param validationRules - Object mapping field names to validation functions
 * @returns Validation function that returns errors or null
 *
 * @example
 * ```tsx
 * const validator = createFieldValidator({
 *   email: (value) => {
 *     if (!value) return 'Email is required';
 *     if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
 *     return null;
 *   },
 *   password: (value) => {
 *     if (!value) return 'Password is required';
 *     if (value.length < 8) return 'Password must be at least 8 characters';
 *     return null;
 *   },
 * });
 *
 * const handleSubmit = createFormHandler(
 *   submitFn,
 *   { withLoading },
 *   { validate: validator }
 * );
 * ```
 */
export function createFieldValidator<
  T extends Record<string, any>,
>(validationRules: {
  [K in keyof T]?: (value: T[K], allValues: T) => string | null;
}): (data: T) => Record<string, string> | null {
  return (data: T): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    for (const [field, validate] of Object.entries(validationRules)) {
      if (validate && typeof validate === 'function') {
        const error = validate(data[field as keyof T], data);
        if (error) {
          errors[field] = error;
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Common validation functions
 */
export const validators = {
  /**
   * Validate required field
   */
  required: (message = 'This field is required') => {
    return (value: any): string | null => {
      if (value === undefined || value === null || value === '') {
        return message;
      }
      return null;
    };
  },

  /**
   * Validate email format
   */
  email: (message = 'Invalid email address') => {
    return (value: string): string | null => {
      if (!value) {
        return null;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return message;
      }
      return null;
    };
  },

  /**
   * Validate minimum length
   */
  minLength: (length: number, message?: string) => {
    return (value: string): string | null => {
      if (!value) {
        return null;
      }
      if (value.length < length) {
        return message || `Must be at least ${length} characters`;
      }
      return null;
    };
  },

  /**
   * Validate maximum length
   */
  maxLength: (length: number, message?: string) => {
    return (value: string): string | null => {
      if (!value) {
        return null;
      }
      if (value.length > length) {
        return message || `Must be no more than ${length} characters`;
      }
      return null;
    };
  },

  /**
   * Validate pattern match
   */
  pattern: (regex: RegExp, message = 'Invalid format') => {
    return (value: string): string | null => {
      if (!value) {
        return null;
      }
      if (!regex.test(value)) {
        return message;
      }
      return null;
    };
  },

  /**
   * Validate numeric value
   */
  numeric: (message = 'Must be a number') => {
    return (value: string): string | null => {
      if (!value) {
        return null;
      }
      if (isNaN(Number(value))) {
        return message;
      }
      return null;
    };
  },

  /**
   * Validate minimum value
   */
  min: (minValue: number, message?: string) => {
    return (value: string | number): string | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      const numValue = typeof value === 'string' ? Number(value) : value;
      if (numValue < minValue) {
        return message || `Must be at least ${minValue}`;
      }
      return null;
    };
  },

  /**
   * Validate maximum value
   */
  max: (maxValue: number, message?: string) => {
    return (value: string | number): string | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      const numValue = typeof value === 'string' ? Number(value) : value;
      if (numValue > maxValue) {
        return message || `Must be no more than ${maxValue}`;
      }
      return null;
    };
  },
};
