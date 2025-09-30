'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase/auth-client';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { DiceLoader } from '@/components/ui';

const signInSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

type SignInFormData = yup.InferType<typeof signInSchema>;

interface SignInFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function SignInForm({
  onSuccess,
  redirectTo = '/dashboard',
}: SignInFormProps) {
  const { isLoading, withLoading } = useLoading({
    defaultTimeout: 30000,
    onError: error => {
      setError(error.message);
    },
  });
  const [loadingMessage, setLoadingMessage] = useState('Signing in...');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: yupResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setError(null);
    setSuccess(false);
    setLoadingMessage('Signing in...');

    try {
      await withLoading(async () => {
        const { error } = await signIn(data.email, data.password, redirectTo);

        if (error) {
          throw new Error(error.message);
        }

        // Success state
        setSuccess(true);
        setLoadingMessage('Sign in successful!');

        // Brief delay to show success before redirect
        await new Promise(resolve => setTimeout(resolve, 500));

        if (onSuccess) {
          onSuccess();
        }
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(false);
    setLoadingMessage('Connecting to Google...');

    try {
      await withLoading(async () => {
        const { error } = await signInWithGoogle(redirectTo);

        if (error) {
          throw new Error(error.message);
        }

        setSuccess(true);
        setLoadingMessage('Redirecting to Google...');

        if (onSuccess) {
          onSuccess();
        }
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
      );
    }
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Welcome Back</h1>
        <p className='text-gray-600'>
          Sign in to your Second Turn Games account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        {error && (
          <Alert variant='error' className='mb-4'>
            {error}
          </Alert>
        )}

        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Email Address
          </label>
          <Input
            id='email'
            type='email'
            autoComplete='email'
            placeholder='Enter your email'
            {...register('email')}
            {...(errors.email?.message && { error: errors.email.message })}
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor='password'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Password
          </label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              autoComplete='current-password'
              placeholder='Enter your password'
              {...register('password')}
              {...(errors.password?.message && {
                error: errors.password.message,
              })}
              disabled={isLoading}
              className='pr-10'
            />
            <button
              type='button'
              className='absolute inset-y-0 right-0 pr-3 flex items-center'
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeSlashIcon className='h-5 w-5 text-gray-400' />
              ) : (
                <EyeIcon className='h-5 w-5 text-gray-400' />
              )}
            </button>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <input
              id='remember-me'
              name='remember-me'
              type='checkbox'
              className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded'
            />
            <label
              htmlFor='remember-me'
              className='ml-2 block text-sm text-gray-700'
            >
              Remember me
            </label>
          </div>

          <Link
            href='/auth/reset-password'
            className='text-sm text-primary-600 hover:text-primary-500 font-medium'
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type='submit'
          className='w-full'
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className='mt-6'>
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-300' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-2 bg-white text-gray-500'>
              Or continue with
            </span>
          </div>
        </div>

        <div className='mt-6'>
          <Button
            type='button'
            variant='secondary'
            className='w-full'
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
              <path
                fill='currentColor'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='currentColor'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='currentColor'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='currentColor'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Continue with Google
          </Button>
        </div>
      </div>

      <div className='mt-6 text-center'>
        <p className='text-sm text-gray-600'>
          Don't have an account?{' '}
          <Link
            href='/auth/signup'
            className='font-medium text-primary-600 hover:text-primary-500'
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Success Message */}
      {success && !isLoading && (
        <div
          role='status'
          aria-live='polite'
          className='mt-4 rounded-lg border border-green-200 bg-green-50 p-4'
        >
          <p className='text-center text-regular text-green-800'>
            ✓ Sign in successful! Redirecting...
          </p>
        </div>
      )}

      {/* Loading Overlay */}
      <DiceLoader
        isVisible={isLoading}
        text={loadingMessage}
        variant='bounce'
      />
    </div>
  );
}
