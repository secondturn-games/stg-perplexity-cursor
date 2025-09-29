import { Metadata } from 'next';
import Link from 'next/link';
import { SignUpForm } from '@/components/auth/SignUpForm';

export const metadata: Metadata = {
  title: 'Sign Up | Second Turn Games',
  description:
    'Create your Second Turn Games account to start trading board games in the Baltic market.',
};

export default function SignUpPage() {
  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='text-center'>
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
          <SignUpForm />
        </div>
      </div>

      <div className='mt-8 text-center'>
        <p className='text-xs text-gray-500'>
          By creating an account, you agree to our{' '}
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
