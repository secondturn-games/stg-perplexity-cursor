'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

function AuthCallbackContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://placeholder.supabase.co',
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'placeholder-key'
  );

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          // Wait a moment for profile creation trigger to complete
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check if user has a profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // No profile found, redirect to onboarding
            console.log('No profile found, redirecting to onboarding');
            router.push('/onboarding');
            return;
          }

          if (profileError) {
            console.error('Profile loading error:', profileError);
            setError('Failed to load user profile');
            setLoading(false);
            return;
          }

          // Check if profile is complete
          if (!profile.username || !profile.full_name) {
            console.log('Profile incomplete, redirecting to onboarding');
            router.push('/onboarding');
            return;
          }

          // Redirect to dashboard
          const redirectTo = searchParams.get('redirect_to') || '/dashboard';
          console.log('Profile complete, redirecting to:', redirectTo);
          router.push(redirectTo);
        } else {
          // No session, redirect to sign in
          router.push('/auth/signin');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [supabase, router, searchParams]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4'></div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Completing sign in...
            </h2>
            <p className='text-gray-600'>
              Please wait while we set up your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
            <Alert variant='error' className='mb-6'>
              {error}
            </Alert>
            <div className='flex space-x-4'>
              <Button
                onClick={() => router.push('/auth/signin')}
                className='flex-1'
              >
                Try Again
              </Button>
              <Button
                variant='secondary'
                onClick={() => router.push('/')}
                className='flex-1'
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
          <div className='sm:mx-auto sm:w-full sm:max-w-md'>
            <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4'></div>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                Loading...
              </h2>
              <p className='text-gray-600'>
                Please wait while we process your request.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
