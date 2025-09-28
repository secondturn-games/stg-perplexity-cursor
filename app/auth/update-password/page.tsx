'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

const updatePasswordSchema = yup.object({
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

type UpdatePasswordFormData = yup.InferType<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UpdatePasswordFormData>({
    resolver: yupResolver(updatePasswordSchema),
  });

  const password = watch('password');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('Invalid or expired reset link. Please request a new password reset.');
          setCheckingSession(false);
          return;
        }

        setIsValidSession(true);
        setCheckingSession(false);
      } catch (err) {
        setError('An error occurred while verifying your session.');
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [supabase.auth]);

  const onSubmit = async (data: UpdatePasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      
      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push('/auth/signin?message=Password updated successfully');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying reset link...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your password reset link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600 mb-2">
                Second Turn Games
              </h1>
            </Link>
          </div>

          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Password Updated!
            </h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully updated. You will be redirected to the sign-in page shortly.
            </p>
            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full"
            >
              Continue to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600 mb-2">
                Second Turn Games
              </h1>
            </Link>
          </div>

          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
            <div className="flex space-x-4">
              <Button
                onClick={() => router.push('/auth/reset-password')}
                className="flex-1"
              >
                Request New Reset Link
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/auth/signin')}
                className="flex-1"
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-primary-600 mb-2">
              Second Turn Games
            </h1>
          </Link>
          <p className="text-sm text-gray-600">
            The Baltic marketplace for board game enthusiasts
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Set New Password
            </h2>
            <p className="text-gray-600">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter your new password"
                  {...register('password')}
                  error={errors.password?.message}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${/[a-z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      One number
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your new password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
