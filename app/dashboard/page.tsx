'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function DashboardPage() {
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
              Please wait while we load your dashboard.
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
              You must be logged in to access the dashboard.
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
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Welcome to your Dashboard
          </h1>
          <p className='mt-2 text-gray-600'>
            Manage your board game marketplace activities
          </p>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {/* User Profile Card */}
          <div className='card'>
            <div className='px-4 py-5 sm:p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Profile Information
              </h3>
              <div className='space-y-3'>
                <div>
                  <dt className='text-sm font-medium text-gray-500'>
                    Username
                  </dt>
                  <dd className='mt-1 text-sm text-gray-900'>
                    {profile?.username || 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className='text-sm font-medium text-gray-500'>
                    Full Name
                  </dt>
                  <dd className='mt-1 text-sm text-gray-900'>
                    {profile?.full_name || 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className='text-sm font-medium text-gray-500'>Email</dt>
                  <dd className='mt-1 text-sm text-gray-900'>{user.email}</dd>
                </div>
                <div>
                  <dt className='text-sm font-medium text-gray-500'>
                    Location
                  </dt>
                  <dd className='mt-1 text-sm text-gray-900'>
                    {profile?.location || 'Not set'}
                  </dd>
                </div>
              </div>
              <div className='mt-4'>
                <Button
                  variant='secondary'
                  onClick={() => (window.location.href = '/profile')}
                  className='w-full'
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className='card'>
            <div className='px-4 py-5 sm:p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Quick Actions
              </h3>
              <div className='space-y-3'>
                <Button
                  onClick={() => (window.location.href = '/marketplace')}
                  className='w-full'
                >
                  Browse Marketplace
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => (window.location.href = '/sell')}
                  className='w-full'
                >
                  List a Game
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => (window.location.href = '/messages')}
                  className='w-full'
                >
                  View Messages
                </Button>
              </div>
            </div>
          </div>

          {/* Account Status Card */}
          <div className='card'>
            <div className='px-4 py-5 sm:p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Account Status
              </h3>
              <div className='space-y-3'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-gray-900'>
                      Account Active
                    </p>
                    <p className='text-sm text-gray-500'>
                      {user.email_confirmed_at
                        ? 'Email verified'
                        : 'Email not verified'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        profile?.is_verified ? 'bg-green-400' : 'bg-yellow-400'
                      }`}
                    ></div>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-gray-900'>
                      Profile Status
                    </p>
                    <p className='text-sm text-gray-500'>
                      {profile?.is_verified
                        ? 'Verified'
                        : 'Pending verification'}
                    </p>
                  </div>
                </div>
              </div>
              <div className='mt-4'>
                <Button
                  variant='secondary'
                  onClick={signOut}
                  className='w-full text-red-600 hover:text-red-700'
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
