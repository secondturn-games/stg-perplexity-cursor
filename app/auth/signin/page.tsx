import { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from '@/components/auth/SignInForm';

export const metadata: Metadata = {
  title: 'Sign In | Second Turn Games',
  description:
    'Sign in to your Second Turn Games account to start trading board games.',
};

export default function SignInPage() {
  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto w-full max-w-md'>
        <div className='text-center mb-6'>
          <Link href='/' className='inline-block'>
            <h1 className='text-3xl sm:text-4xl font-bold text-primary-600 mb-2'>
              Second Turn Games
            </h1>
          </Link>
          <p className='text-sm text-gray-600'>
            The Baltic marketplace for board game enthusiasts
          </p>
        </div>

        <div className='bg-white py-6 px-4 shadow rounded-lg sm:py-8 sm:px-10'>
          <SignInForm />
        </div>
      </div>

      <div className='mt-8 text-center'>
        <p className='text-xs text-gray-500'>
          By signing in, you agree to our{' '}
          <Link
            href='/terms'
            className='text-primary-600 hover:text-primary-500'
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href='/privacy'
            className='text-primary-600 hover:text-primary-500'
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
