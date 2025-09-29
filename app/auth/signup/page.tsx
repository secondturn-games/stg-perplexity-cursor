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
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto w-full max-w-md'>
        <div className='bg-white py-6 px-4 shadow rounded-lg sm:py-8 sm:px-10'>
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
