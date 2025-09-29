'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ProfileForm } from '@/components/auth/ProfileForm';

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4'></div>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Loading...
            </h2>
            <p className='text-gray-600'>
              Please wait while we load your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
            <Alert variant='error' className='mb-6'>
              You must be logged in to access your profile.
            </Alert>
            <div className='flex space-x-4'>
              <Button
                onClick={() => (window.location.href = '/auth/signin')}
                className='flex-1'
              >
                Sign In
              </Button>
              <Button
                variant='secondary'
                onClick={() => (window.location.href = '/auth/signup')}
                className='flex-1'
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Profile Settings</h1>
          <p className='mt-2 text-gray-600'>
            Manage your account information and preferences
          </p>
        </div>

        {profile ? (
          <div className='card'>
            <div className='px-4 py-5 sm:p-6'>
              <ProfileForm profile={profile} />
            </div>
          </div>
        ) : (
          <div className='card'>
            <div className='px-4 py-5 sm:p-6'>
              <Alert variant='error' className='mb-6'>
                Profile not found or incomplete. You may need to complete your
                onboarding.
              </Alert>
              <div className='space-y-4'>
                <Button
                  onClick={() => window.location.reload()}
                  className='w-full'
                >
                  Refresh Page
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => (window.location.href = '/onboarding')}
                  className='w-full'
                >
                  Complete Onboarding
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className='mt-8 card'>
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Account Actions
            </h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='text-sm font-medium text-gray-900'>
                    Change Password
                  </h4>
                  <p className='text-sm text-gray-500'>
                    Update your account password
                  </p>
                </div>
                <Button
                  variant='secondary'
                  onClick={() =>
                    (window.location.href = '/auth/update-password')
                  }
                >
                  Change Password
                </Button>
              </div>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='text-sm font-medium text-gray-900'>
                    Sign Out
                  </h4>
                  <p className='text-sm text-gray-500'>
                    Sign out of your account
                  </p>
                </div>
                <Button
                  variant='secondary'
                  onClick={signOut}
                  className='text-red-600 hover:text-red-700'
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
