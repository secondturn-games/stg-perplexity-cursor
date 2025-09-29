'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { updateProfile, updatePassword } from '@/lib/supabase/auth-client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import type { Profile } from '@/types/database.types';

const profileSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, hyphens, and underscores'
    )
    .required('Username is required'),
  fullName: yup
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters')
    .required('Full name is required'),
  bio: yup.string().max(500, 'Bio must be less than 500 characters'),
  location: yup
    .string()
    .oneOf(
      ['EST', 'LVA', 'LTU', 'EU', 'OTHER'],
      'Please select a valid location'
    ),
  phone: yup
    .string()
    .optional()
    .test(
      'phone-format',
      'Please enter a valid phone number',
      function (value) {
        if (!value || value.trim() === '') {
          return true; // Allow empty values
        }
        return /^[\+]?[1-9][\d]{0,15}$/.test(value);
      }
    ),
  showEmail: yup.boolean(),
  showPhone: yup.boolean(),
  showLocation: yup.boolean(),
  messages: yup.boolean(),
  offers: yup.boolean(),
  listings: yup.boolean(),
  marketing: yup.boolean(),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

type ProfileFormData = yup.InferType<typeof profileSchema>;
type PasswordFormData = yup.InferType<typeof passwordSchema>;

interface ProfileFormProps {
  profile: Profile;
  onSuccess?: () => void;
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const { user } = useAuth();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      username: profile.username || '',
      fullName: profile.full_name || '',
      bio: profile.bio || '',
      location: profile.location || 'EST',
      phone: profile.phone || '',
      showEmail: (profile.privacy_settings as any)?.show_email || false,
      showPhone: (profile.privacy_settings as any)?.show_phone || false,
      showLocation: (profile.privacy_settings as any)?.show_location || true,
      messages: (profile.notification_settings as any)?.messages || true,
      offers: (profile.notification_settings as any)?.offers || true,
      listings: (profile.notification_settings as any)?.listings || true,
      marketing: (profile.notification_settings as any)?.marketing || false,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
  });

  useEffect(() => {
    resetProfile({
      username: profile.username || '',
      fullName: profile.full_name || '',
      bio: profile.bio || '',
      location: profile.location || 'EST',
      phone: profile.phone || '',
      showEmail: (profile.privacy_settings as any)?.show_email || false,
      showPhone: (profile.privacy_settings as any)?.show_phone || false,
      showLocation: (profile.privacy_settings as any)?.show_location || true,
      messages: (profile.notification_settings as any)?.messages || true,
      offers: (profile.notification_settings as any)?.offers || true,
      listings: (profile.notification_settings as any)?.listings || true,
      marketing: (profile.notification_settings as any)?.marketing || false,
    });
  }, [profile, resetProfile]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await updateProfile({
        username: data.username,
        full_name: data.fullName,
        bio: data.bio || null,
        location: data.location as 'EST' | 'LVA' | 'LTU' | 'EU' | 'OTHER',
        phone: data.phone || null,
        privacy_settings: {
          ...(data.showEmail !== undefined && { show_email: data.showEmail }),
          ...(data.showPhone !== undefined && { show_phone: data.showPhone }),
          ...(data.showLocation !== undefined && {
            show_location: data.showLocation,
          }),
        },
        notification_settings: {
          ...(data.messages !== undefined && { messages: data.messages }),
          ...(data.offers !== undefined && { offers: data.offers }),
          ...(data.listings !== undefined && { listings: data.listings }),
          ...(data.marketing !== undefined && { marketing: data.marketing }),
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess('Profile updated successfully!');
      onSuccess?.();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await updatePassword(
        data.currentPassword,
        data.newPassword
      );

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess('Password updated successfully!');
      resetPassword();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const locationOptions = [
    { value: 'EST', label: 'Estonia' },
    { value: 'LVA', label: 'Latvia' },
    { value: 'LTU', label: 'Lithuania' },
    { value: 'EU', label: 'Other EU Country' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className='max-w-2xl mx-auto'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Profile Settings
        </h1>
        <p className='text-gray-600'>
          Manage your account information and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200 mb-8'>
        <nav className='-mb-px flex space-x-8'>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Change Password
          </button>
        </nav>
      </div>

      {error && (
        <Alert variant='error' className='mb-6'>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant='success' className='mb-6'>
          {success}
        </Alert>
      )}

      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleProfileSubmit(onProfileSubmit)}
          className='space-y-6'
        >
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
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
                placeholder='Enter your username'
                {...registerProfile('username')}
                {...(profileErrors.username?.message && {
                  error: profileErrors.username.message,
                })}
                disabled={isLoading}
              />
            </div>

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
                placeholder='Enter your full name'
                {...registerProfile('fullName')}
                {...(profileErrors.fullName?.message && {
                  error: profileErrors.fullName.message,
                })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor='bio'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Bio
            </label>
            <textarea
              id='bio'
              rows={4}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500'
              placeholder='Tell us about yourself...'
              {...registerProfile('bio')}
              disabled={isLoading}
            />
            {profileErrors.bio && (
              <p className='mt-1 text-sm text-red-600'>
                {profileErrors.bio.message}
              </p>
            )}
            <p className='mt-1 text-sm text-gray-500'>
              {profile.bio?.length || 0}/500 characters
            </p>
          </div>

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <div>
              <label
                htmlFor='location'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Location
              </label>
              <Select
                id='location'
                {...registerProfile('location')}
                {...(profileErrors.location?.message && {
                  error: profileErrors.location.message,
                })}
                disabled={isLoading}
              >
                {locationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label
                htmlFor='phone'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Phone Number <span className='text-gray-500'>(optional)</span>
              </label>
              <Input
                id='phone'
                type='tel'
                placeholder='Enter your phone number'
                {...registerProfile('phone')}
                {...(profileErrors.phone?.message && {
                  error: profileErrors.phone.message,
                })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Privacy Settings
            </label>
            <div className='space-y-3'>
              <Checkbox
                id='showEmail'
                {...registerProfile('showEmail')}
                disabled={isLoading}
              >
                <span className='text-sm text-gray-700'>
                  Show email address on profile
                </span>
              </Checkbox>
              <Checkbox
                id='showPhone'
                {...registerProfile('showPhone')}
                disabled={isLoading}
              >
                <span className='text-sm text-gray-700'>
                  Show phone number on profile
                </span>
              </Checkbox>
              <Checkbox
                id='showLocation'
                {...registerProfile('showLocation')}
                disabled={isLoading}
              >
                <span className='text-sm text-gray-700'>
                  Show location on profile
                </span>
              </Checkbox>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Notification Preferences
            </label>
            <div className='space-y-3'>
              <Checkbox
                id='messages'
                {...registerProfile('messages')}
                disabled={isLoading}
              >
                <span className='text-sm text-gray-700'>New messages</span>
              </Checkbox>
              <Checkbox
                id='offers'
                {...registerProfile('offers')}
                disabled={isLoading}
              >
                <span className='text-sm text-gray-700'>
                  New offers on my listings
                </span>
              </Checkbox>
              <Checkbox
                id='listings'
                {...registerProfile('listings')}
                disabled={isLoading}
              >
                <span className='text-sm text-gray-700'>
                  Updates about my listings
                </span>
              </Checkbox>
              <Checkbox
                id='marketing'
                {...registerProfile('marketing')}
                disabled={isLoading}
              >
                <span className='text-sm text-gray-700'>
                  Marketing emails and special offers
                </span>
              </Checkbox>
            </div>
          </div>

          <div className='flex justify-end'>
            <Button type='submit' disabled={isLoading} loading={isLoading}>
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <form
          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          className='space-y-6'
        >
          <div>
            <label
              htmlFor='currentPassword'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Current Password
            </label>
            <div className='relative'>
              <Input
                id='currentPassword'
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder='Enter your current password'
                {...registerPassword('currentPassword')}
                {...(passwordErrors.currentPassword?.message && {
                  error: passwordErrors.currentPassword.message,
                })}
                disabled={isLoading}
                className='pr-10'
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isLoading}
              >
                {showCurrentPassword ? (
                  <EyeSlashIcon className='h-5 w-5 text-gray-400' />
                ) : (
                  <EyeIcon className='h-5 w-5 text-gray-400' />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor='newPassword'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              New Password
            </label>
            <div className='relative'>
              <Input
                id='newPassword'
                type={showNewPassword ? 'text' : 'password'}
                placeholder='Enter your new password'
                {...registerPassword('newPassword')}
                {...(passwordErrors.newPassword?.message && {
                  error: passwordErrors.newPassword.message,
                })}
                disabled={isLoading}
                className='pr-10'
              />
              <button
                type='button'
                className='absolute inset-y-0 right-0 pr-3 flex items-center'
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <EyeSlashIcon className='h-5 w-5 text-gray-400' />
                ) : (
                  <EyeIcon className='h-5 w-5 text-gray-400' />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Confirm New Password
            </label>
            <div className='relative'>
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='Confirm your new password'
                {...registerPassword('confirmPassword')}
                {...(passwordErrors.confirmPassword?.message && {
                  error: passwordErrors.confirmPassword.message,
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

          <div className='flex justify-end'>
            <Button type='submit' disabled={isLoading} loading={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
