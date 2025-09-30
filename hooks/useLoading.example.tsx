/**
 * useLoading Hook - Usage Examples
 * Demonstrates integration with DiceLoader and various use cases
 */

'use client';

import { useState } from 'react';
import {
  useLoading,
  useLoadingWithTimeout,
  useLoadingNoTimeout,
} from './useLoading';
import { DiceLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';

/**
 * Example 1: Basic Usage with DiceLoader
 */
export function BasicLoadingExample() {
  const { isLoading, showLoading, hideLoading } = useLoading();

  const simulateLoading = () => {
    showLoading();
    setTimeout(() => {
      hideLoading();
    }, 3000);
  };

  return (
    <div className='card space-y-4'>
      <h3 className='text-lg font-normal text-primary-500'>
        Basic Loading Example
      </h3>
      <Button onClick={simulateLoading}>Start Loading</Button>
      <DiceLoader isVisible={isLoading} text='Processing...' />
    </div>
  );
}

/**
 * Example 2: Using withLoading for API Calls
 */
export function ApiCallExample() {
  const { isLoading, withLoading } = useLoading({
    defaultTimeout: 10000,
    onTimeout: () => {
      alert('Request timed out after 10 seconds');
    },
    onError: error => {
      console.error('API Error:', error);
    },
  });

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    setError(null);
    try {
      await withLoading(async () => {
        const response = await fetch('/api/marketplace/games');
        if (!response.ok) {
          throw new Error('Failed to fetch games');
        }
        const result = await response.json();
        setData(result);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className='card space-y-4'>
      <h3 className='text-lg font-normal text-primary-500'>
        API Call with withLoading
      </h3>
      <Button onClick={fetchGames}>Fetch Games</Button>
      {error && <p className='text-red-600'>{error}</p>}
      {data && <pre className='text-sm'>{JSON.stringify(data, null, 2)}</pre>}
      <DiceLoader isVisible={isLoading} text='Fetching games...' />
    </div>
  );
}

/**
 * Example 3: Multiple Operations with Loading Count
 */
export function MultipleOperationsExample() {
  const { isLoading, withLoading } = useLoading();
  const [results, setResults] = useState<string[]>([]);

  const runMultipleOperations = async () => {
    setResults([]);

    // Start multiple operations - loading stays visible until all complete
    const promises = [
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
      const allResults = await Promise.all(promises);
      setResults(allResults);
    } catch (error) {
      console.error('Error in operations:', error);
    }
  };

  return (
    <div className='card space-y-4'>
      <h3 className='text-lg font-normal text-primary-500'>
        Multiple Operations
      </h3>
      <p className='text-regular text-gray-600'>
        Loading state persists until all operations complete
      </p>
      <Button onClick={runMultipleOperations}>Run 3 Operations</Button>
      {results.length > 0 && (
        <ul className='ml-4 list-disc space-y-1 text-regular text-gray-600'>
          {results.map((result, index) => (
            <li key={index}>{result}</li>
          ))}
        </ul>
      )}
      <DiceLoader
        isVisible={isLoading}
        text='Running operations...'
        variant='bounce'
      />
    </div>
  );
}

/**
 * Example 4: Custom Timeout Configuration
 */
export function CustomTimeoutExample() {
  const [message, setMessage] = useState<string>('');
  
  const { isLoading, withLoading } = useLoading({
    defaultTimeout: 5000,
    onTimeout: () => {
      setMessage('Operation timed out after 5 seconds');
    },
  });

  const startLongOperation = async () => {
    setMessage('');
    try {
      await withLoading(async () => {
        // Simulate a 7-second operation (will timeout at 5 seconds)
        await new Promise(resolve => setTimeout(resolve, 7000));
        setMessage('Operation completed successfully');
      });
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  return (
    <div className='card space-y-4'>
      <h3 className='text-lg font-normal text-primary-500'>
        Custom Timeout (5 seconds)
      </h3>
      <p className='text-regular text-gray-600'>
        Loading will automatically stop after 5 seconds
      </p>
      <Button onClick={startLongOperation}>Start Long Operation</Button>
      {message && <p className='text-regular font-medium'>{message}</p>}
      <DiceLoader isVisible={isLoading} text='Processing...' variant='spin' />
    </div>
  );
}

/**
 * Example 5: Error Handling
 */
export function ErrorHandlingExample() {
  const { isLoading, withLoading } = useLoading({
    hideOnError: true,
    onError: error => {
      console.error('Global error handler:', error);
    },
  });

  const [message, setMessage] = useState<string>('');

  const triggerError = async () => {
    setMessage('');
    try {
      await withLoading(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        throw new Error('Simulated API error');
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const triggerSuccess = async () => {
    setMessage('');
    try {
      await withLoading(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setMessage('Operation completed successfully!');
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className='card space-y-4'>
      <h3 className='text-lg font-normal text-primary-500'>
        Error Handling
      </h3>
      <p className='text-regular text-gray-600'>
        Loading automatically hides on error (hideOnError: true)
      </p>
      <div className='flex gap-2'>
        <Button onClick={triggerSuccess} variant='primary'>
          Success Case
        </Button>
        <Button onClick={triggerError} variant='secondary'>
          Error Case
        </Button>
      </div>
      {message && (
        <p
          className={`text-regular font-medium ${message.includes('error') || message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}
        >
          {message}
        </p>
      )}
      <DiceLoader isVisible={isLoading} text='Processing request...' />
    </div>
  );
}

/**
 * Example 6: Form Submission
 */
export function FormSubmissionExample() {
  const { isLoading, withLoading } = useLoading();
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [submitMessage, setSubmitMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage('');

    try {
      await withLoading(async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate validation
        if (!formData.name || !formData.email) {
          throw new Error('Please fill in all fields');
        }

        setSubmitMessage('Form submitted successfully!');
        setFormData({ name: '', email: '' });
      });
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : 'Submission failed'
      );
    }
  };

  return (
    <div className='card space-y-4'>
      <h3 className='text-lg font-normal text-primary-500'>
        Form Submission
      </h3>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='form-label'>Name</label>
          <input
            type='text'
            className='input-field'
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className='form-label'>Email</label>
          <input
            type='email'
            className='input-field'
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <Button type='submit' disabled={isLoading}>
          Submit Form
        </Button>
      </form>
      {submitMessage && (
        <p
          className={`text-regular font-medium ${submitMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}
        >
          {submitMessage}
        </p>
      )}
      <DiceLoader isVisible={isLoading} text='Submitting form...' />
    </div>
  );
}

/**
 * Example 7: No Timeout (Manual Control)
 */
export function NoTimeoutExample() {
  const { isLoading, showLoading, hideLoading, reset } = useLoadingNoTimeout();

  return (
    <div className='card space-y-4'>
      <h3 className='text-lg font-normal text-primary-500'>
        Manual Control (No Timeout)
      </h3>
      <p className='text-regular text-gray-600'>
        Complete manual control over loading state
      </p>
      <div className='flex gap-2'>
        <Button onClick={showLoading} variant='primary'>
          Show Loading
        </Button>
        <Button onClick={hideLoading} variant='secondary'>
          Hide Loading
        </Button>
        <Button onClick={reset} variant='tertiary'>
          Reset
        </Button>
      </div>
      <p className='text-regular'>
        Status: <strong>{isLoading ? 'Loading' : 'Idle'}</strong>
      </p>
      <DiceLoader
        isVisible={isLoading}
        text='Manual loading state...'
        variant='bounce'
      />
    </div>
  );
}

/**
 * Complete Demo Page
 */
export default function UseLoadingExamples() {
  return (
    <div className='mx-auto max-w-6xl space-y-8 p-8'>
      <div className='space-y-4'>
        <h1 className='text-3xl font-normal text-primary-500'>
          useLoading Hook Examples
        </h1>
        <p className='text-regular text-gray-600'>
          Comprehensive examples demonstrating the useLoading hook with
          DiceLoader integration
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <BasicLoadingExample />
        <ApiCallExample />
        <MultipleOperationsExample />
        <CustomTimeoutExample />
        <ErrorHandlingExample />
        <FormSubmissionExample />
        <NoTimeoutExample />
      </div>

      {/* Code Example */}
      <section className='card space-y-4'>
        <h3 className='text-lg font-normal text-primary-500'>
          Quick Start Code
        </h3>
        <pre className='overflow-x-auto rounded-lg bg-gray-100 p-4 text-sm'>
          {`import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';

export default function MyComponent() {
  const { isLoading, withLoading } = useLoading();

  const fetchData = async () => {
    await withLoading(async () => {
      const response = await fetch('/api/data');
      const data = await response.json();
      // Handle data...
    });
  };

  return (
    <>
      <button onClick={fetchData}>Load Data</button>
      <DiceLoader isVisible={isLoading} text="Loading..." />
    </>
  );
}`}
        </pre>
      </section>
    </div>
  );
}