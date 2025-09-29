'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import {
  signUpWithProfile,
  signInWithGoogle,
} from '@/lib/supabase/auth-client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Checkbox } from '@/components/ui/Checkbox';

const signUpSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  fullName: yup
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters')
    .required('Full name is required'),
});

type SignUpFormData = yup.InferType<typeof signUpSchema>;

interface SignUpFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function SignUpForm({
  onSuccess,
  redirectTo = '/onboarding',
}: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignUpFormData>({
    resolver: yupResolver(signUpSchema),
  });

  const password = watch('password');

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsLoading(true);
      setError(null);

<<<<<<< Updated upstream
      const { error } = await signUp(
        {
          email: data.email,
          password: data.password,
          username: data.username,
          fullName: data.fullName,
          gdprConsent: data.gdprConsent || false,
          marketingConsent: data.marketingConsent || false,
        },
        redirectTo
      );
=======
      const { error } = await signUpWithProfile({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        gdprConsent: true, // Always true since agreement is shown below form
      });
>>>>>>> Stashed changes

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await signInWithGoogle(redirectTo);

      if (error) {
        setError(error.message);
        return;
      }

      onSuccess?.();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className='w-full max-w-md mx-auto text-center'>
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
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
          Check Your Email
        </h1>
        <p className='text-gray-600 mb-6'>
          We've sent you a verification link. Please check your email and click
          the link to activate your account.
        </p>
        <p className='text-sm text-gray-500'>
          Didn't receive the email? Check your spam folder or{' '}
          <button
            onClick={() => setSuccess(false)}
            className='text-primary-600 hover:text-primary-500 font-medium'
          >
            try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Join Second Turn Games
        </h1>
        <p className='text-gray-600'>
          Create your account to start trading board games
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        {error && (
          <Alert variant='error' className='mb-4'>
            {error}
          </Alert>
        )}

<<<<<<< Updated upstream
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <div>
            <label
              htmlFor='fullName'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Full Name
            </label>
            <Input
              id='fullName'
              type='text'
              autoComplete='name'
              placeholder='Enter your full name'
              {...register('fullName')}
              {...(errors.fullName?.message && {
                error: errors.fullName.message,
              })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor='username'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Username
            </label>
            <Input
              id='username'
              type='text'
              autoComplete='username'
              placeholder='Choose a username'
              {...register('username')}
              {...(errors.username?.message && {
                error: errors.username.message,
              })}
              disabled={isLoading}
            />
          </div>
=======
        <div>
          <label
            htmlFor='fullName'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Full Name
          </label>
          <Input
            id='fullName'
            type='text'
            autoComplete='name'
            placeholder='Enter your full name'
            {...register('fullName')}
            error={errors.fullName?.message}
            disabled={isLoading}
            autoFocus
          />
>>>>>>> Stashed changes
        </div>

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
              autoComplete='new-password'
              placeholder='Create a password'
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
          {password && (
            <div className='mt-2 text-sm text-gray-600'>
              <div className='flex items-center space-x-2'>
                <div
                  className={`h-2 w-2 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <span
                  className={
                    password.length >= 8 ? 'text-green-600' : 'text-gray-500'
                  }
                >
                  At least 8 characters
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <div
                  className={`h-2 w-2 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <span
                  className={
                    /[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'
                  }
                >
                  One uppercase letter
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <div
                  className={`h-2 w-2 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <span
                  className={
                    /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'
                  }
                >
                  One lowercase letter
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <div
                  className={`h-2 w-2 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <span
                  className={
                    /\d/.test(password) ? 'text-green-600' : 'text-gray-500'
                  }
                >
                  One number
                </span>
              </div>
            </div>
          )}
        </div>

<<<<<<< Updated upstream
        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Confirm Password
          </label>
          <div className='relative'>
            <Input
              id='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete='new-password'
              placeholder='Confirm your password'
              {...register('confirmPassword')}
              {...(errors.confirmPassword?.message && {
                error: errors.confirmPassword.message,
              })}
              disabled={isLoading}
              className='pr-10'
            />
            <button
              type='button'
              className='absolute inset-y-0 right-0 pr-3 flex items-center'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className='h-5 w-5 text-gray-400' />
              ) : (
                <EyeIcon className='h-5 w-5 text-gray-400' />
              )}
            </button>
          </div>
        </div>

        <div className='space-y-4'>
          <div>
            <Checkbox
              id='gdprConsent'
              {...register('gdprConsent')}
              {...(errors.gdprConsent?.message && {
                error: errors.gdprConsent.message,
              })}
              disabled={isLoading}
            >
              <span className='text-sm text-gray-700'>
                I agree to the{' '}
                <Link
                  href='/privacy'
                  className='text-primary-600 hover:text-primary-500 font-medium'
                >
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link
                  href='/terms'
                  className='text-primary-600 hover:text-primary-500 font-medium'
                >
                  Terms of Service
                </Link>
              </span>
            </Checkbox>
          </div>

          <div>
            <Checkbox
              id='marketingConsent'
              {...register('marketingConsent')}
              disabled={isLoading}
            >
              <span className='text-sm text-gray-700'>
                I would like to receive marketing emails about new features and
                special offers
                <span className='text-gray-500'> (optional)</span>
              </span>
            </Checkbox>
          </div>
        </div>

=======
>>>>>>> Stashed changes
        <Button
          type='submit'
          className='w-full'
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
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
<<<<<<< Updated upstream
            variant='outline'
=======
            variant='secondary'
>>>>>>> Stashed changes
            className='w-full'
            onClick={handleGoogleSignUp}
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
          Already have an account?{' '}
          <Link
            href='/auth/signin'
            className='font-medium text-primary-600 hover:text-primary-500'
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
