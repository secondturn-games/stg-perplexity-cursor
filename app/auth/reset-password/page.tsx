'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { createClientComponentClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

const resetPasswordSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='text-center mb-8'>
            <Link href='/' className='inline-block'>
              <h1 className='text-4xl font-bold text-primary-600 mb-2'>
                Second Turn Games
              </h1>
            </Link>
          </div>

          <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center'>
            <div className='mb-6'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100'>
                <svg
                  className='h-6 w-6 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Check Your Email
            </h2>
            <p className='text-gray-600 mb-6'>
              We've sent you a password reset link. Please check your email and
              click the link to reset your password.
            </p>
            <p className='text-sm text-gray-500 mb-6'>
              Didn't receive the email? Check your spam folder or try again in a
              few minutes.
            </p>
            <div className='flex space-x-4'>
              <Button
                onClick={() => setSuccess(false)}
                variant='outline'
                className='flex-1'
              >
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = '/auth/signin')}
                className='flex-1'
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='text-center mb-8'>
          <Link href='/' className='inline-block'>
            <h1 className='text-4xl font-bold text-primary-600 mb-2'>
              Second Turn Games
            </h1>
          </Link>
          <p className='text-sm text-gray-600'>
            The Baltic marketplace for board game enthusiasts
          </p>
        </div>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-gray-900 mb-2'>
              Reset Password
            </h2>
            <p className='text-gray-600'>
              Enter your email address and we'll send you a link to reset your
              password.
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

            <Button
              type='submit'
              className='w-full'
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Remember your password?{' '}
              <Link
                href='/auth/signin'
                className='font-medium text-primary-600 hover:text-primary-500'
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable static generation for this page
export const dynamic = 'force-dynamic';
