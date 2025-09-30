/**
 * Profile Update Form Component
 * Enhanced profile form with loading states for marketplace users
 */

'use client';

import { useState, useEffect } from 'react';
import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createFormHandler, validators } from '@/lib/form-handlers';
import {
  getProfileLoading,
  updateProfileLoading,
} from '@/lib/supabase/api-with-loading';
import { api } from '@/lib/api';
import Image from 'next/image';

interface ProfileFormData {
  username: string;
  fullName: string;
  bio?: string;
  location?: 'EST' | 'LVA' | 'LTU' | 'EU' | 'OTHER' | undefined;
  phone?: string;
  avatar?: string;
  privacySettings?: {
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
  notificationSettings?: {
    messages: boolean;
    offers: boolean;
    listings: boolean;
    marketing: boolean;
  };
}

interface ProfileUpdateFormProps {
  /**
   * User ID
   */
  userId: string;

  /**
   * Callback on successful update
   */
  onSuccess?: () => void;

  /**
   * Callback on cancel
   */
  onCancel?: () => void;
}

/**
 * ProfileUpdateForm - Update user profile with loading states
 */
export default function ProfileUpdateForm({
  userId,
  onSuccess,
  onCancel,
}: ProfileUpdateFormProps) {
  const { isLoading, withLoading } = useLoading();
  const [loadingMessage, setLoadingMessage] = useState('Loading profile...');

  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    fullName: '',
    bio: '',
    location: 'EST',
    phone: '',
    avatar: '',
    privacySettings: {
      showEmail: false,
      showPhone: false,
      showLocation: true,
    },
    notificationSettings: {
      messages: true,
      offers: true,
      listings: true,
      marketing: false,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  /**
   * Load existing profile data
   */
  useEffect(() => {
    const loadProfile = async () => {
      setLoadingMessage('Loading your profile...');

      try {
        const { data, error } = await getProfileLoading(
          userId,
          { withLoading },
          {
            loadingDelay: 300,
          }
        );

        if (error) {
          throw error;
        }

        if (data) {
          setFormData({
            username: data['username'] || '',
            fullName: data['full_name'] || '',
            bio: data['bio'] || '',
            location: data['location'] as ProfileFormData['location'],
            phone: data['phone'] || '',
            avatar: data['avatar_url'] || '',
            privacySettings: data['privacy_settings'] || {
              showEmail: false,
              showPhone: false,
              showLocation: true,
            },
            notificationSettings: data['notification_settings'] || {
              messages: true,
              offers: true,
              listings: true,
              marketing: false,
            },
          });

          if (data['avatar_url']) {
            setAvatarPreview(data['avatar_url']);
          }
        }
      } catch (error) {
        setErrors({
          load:
            error instanceof Error ? error.message : 'Failed to load profile',
        });
      }
    };

    loadProfile();
  }, [userId, withLoading]);

  /**
   * Handle avatar upload
   */
  const handleAvatarUpload = async (file: File) => {
    if (!file) {
      return;
    }

    setLoadingMessage('Uploading avatar...');

    try {
      await withLoading(async () => {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', file);

        const { data, error } = await api.post<{ url: string }>(
          '/api/upload/avatar',
          formDataUpload,
          {
            headers: {},
          }
        );

        if (error) {
          throw error;
        }

        if (data?.url) {
          setFormData(prev => ({ ...prev, avatar: data.url }));
          setAvatarPreview(data.url);
        }
      });
    } catch (error) {
      setErrors({
        avatar:
          error instanceof Error ? error.message : 'Failed to upload avatar',
      });
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = createFormHandler(
    async (data: ProfileFormData) => {
      setLoadingMessage('Updating your profile...');

      await updateProfileLoading(
        {
          username: data.username,
          full_name: data.fullName,
          bio: data.bio || null,
          location: data.location || null,
          phone: data.phone || null,
          avatar_url: data.avatar || null,
          privacy_settings: data.privacySettings,
          notification_settings: data.notificationSettings,
        },
        { withLoading },
        {
          loadingDelay: 300,
        }
      );
    },
    { withLoading },
    {
      validate: data => {
        const validationErrors: Record<string, string> = {};

        if (!data.username || data.username.length < 3) {
          validationErrors.username = 'Username must be at least 3 characters';
        }

        if (!data.fullName || data.fullName.length < 2) {
          validationErrors.fullName = 'Full name must be at least 2 characters';
        }

        if (data.bio && data.bio.length > 500) {
          validationErrors.bio = 'Bio must be less than 500 characters';
        }

        return Object.keys(validationErrors).length > 0
          ? validationErrors
          : null;
      },
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: error => {
        setErrors({ form: error.message });
      },
      onValidationError: validationErrors => {
        setErrors(validationErrors);
      },
    }
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    await handleSubmit(formData, e.currentTarget);
  };

  return (
    <div className='mx-auto max-w-3xl'>
      <form onSubmit={onSubmit} className='space-y-6'>
        {/* Load Error */}
        {errors['load'] && (
          <div className='card bg-red-50'>
            <p className='text-regular text-red-800'>{errors['load']}</p>
          </div>
        )}

        {/* Avatar */}
        <div className='card space-y-4'>
          <h2 className='text-xl font-normal text-primary-500'>
            Profile Picture
          </h2>

          <div className='flex items-center gap-6'>
            <div className='relative h-24 w-24 overflow-hidden rounded-full bg-gray-200'>
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt='Avatar preview'
                  fill
                  className='object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-3xl text-gray-400'>
                  {formData.fullName && formData.fullName.length > 0
                    ? formData.fullName[0].toUpperCase()
                    : '?'}
                </div>
              )}
            </div>

            <div className='flex-1'>
              <input
                type='file'
                id='avatar'
                accept='image/*'
                onChange={e => {
                  if (e.target.files?.[0]) {
                    handleAvatarUpload(e.target.files[0]);
                  }
                }}
                disabled={isLoading}
                className='block w-full text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-accent-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-accent-600'
              />
              <p className='mt-1 text-sm text-gray-500'>
                PNG, JPG or GIF (max. 5MB)
              </p>
              {errors['avatar'] && (
                <p className='mt-1 text-sm text-red-600'>{errors['avatar']}</p>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className='card space-y-4'>
          <h2 className='text-xl font-normal text-primary-500'>
            Basic Information
          </h2>

          {/* Username */}
          <div>
            <label htmlFor='username' className='form-label'>
              Username
            </label>
            <Input
              id='username'
              type='text'
              value={formData.username}
              onChange={e =>
                setFormData(prev => ({ ...prev, username: e.target.value }))
              }
              disabled={isLoading}
              placeholder='Your username'
            />
            {errors['username'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['username']}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor='fullName' className='form-label'>
              Full Name
            </label>
            <Input
              id='fullName'
              type='text'
              value={formData.fullName}
              onChange={e =>
                setFormData(prev => ({ ...prev, fullName: e.target.value }))
              }
              disabled={isLoading}
              placeholder='Your full name'
            />
            {errors['fullName'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['fullName']}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor='bio' className='form-label'>
              Bio
            </label>
            <textarea
              id='bio'
              rows={4}
              className='input-field'
              value={formData.bio}
              onChange={e =>
                setFormData(prev => ({ ...prev, bio: e.target.value }))
              }
              disabled={isLoading}
              placeholder='Tell us about yourself...'
            />
            <p className='mt-1 text-sm text-gray-500'>
              {formData.bio?.length || 0}/500 characters
            </p>
            {errors['bio'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['bio']}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor='location' className='form-label'>
              Location
            </label>
            <Select
              id='location'
              value={formData.location || ''}
              onChange={e => {
                const value = e.target.value as
                  | ProfileFormData['location']
                  | '';
                setFormData(prev => ({
                  ...prev,
                  location: value || undefined,
                }));
              }}
              disabled={isLoading}
            >
              <option value='EST'>Estonia</option>
              <option value='LVA'>Latvia</option>
              <option value='LTU'>Lithuania</option>
              <option value='EU'>Other EU</option>
              <option value='OTHER'>Other</option>
            </Select>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor='phone' className='form-label'>
              Phone Number
            </label>
            <Input
              id='phone'
              type='tel'
              value={formData.phone}
              onChange={e =>
                setFormData(prev => ({ ...prev, phone: e.target.value }))
              }
              disabled={isLoading}
              placeholder='+372...'
            />
          </div>
        </div>

        {/* Privacy Settings */}
        <div className='card space-y-4'>
          <h2 className='text-xl font-normal text-primary-500'>
            Privacy Settings
          </h2>

          <div className='space-y-3'>
            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={formData.privacySettings?.showEmail}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    privacySettings: {
                      ...prev.privacySettings!,
                      showEmail: e.target.checked,
                    },
                  }))
                }
                disabled={isLoading}
                className='h-4 w-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500'
              />
              <span className='text-regular'>Show email to other users</span>
            </label>

            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={formData.privacySettings?.showPhone}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    privacySettings: {
                      ...prev.privacySettings!,
                      showPhone: e.target.checked,
                    },
                  }))
                }
                disabled={isLoading}
                className='h-4 w-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500'
              />
              <span className='text-regular'>Show phone to other users</span>
            </label>

            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={formData.privacySettings?.showLocation}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    privacySettings: {
                      ...prev.privacySettings!,
                      showLocation: e.target.checked,
                    },
                  }))
                }
                disabled={isLoading}
                className='h-4 w-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500'
              />
              <span className='text-regular'>Show location to other users</span>
            </label>
          </div>
        </div>

        {/* Notification Settings */}
        <div className='card space-y-4'>
          <h2 className='text-xl font-normal text-primary-500'>
            Notification Settings
          </h2>

          <div className='space-y-3'>
            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={formData.notificationSettings?.messages}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    notificationSettings: {
                      ...prev.notificationSettings!,
                      messages: e.target.checked,
                    },
                  }))
                }
                disabled={isLoading}
                className='h-4 w-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500'
              />
              <span className='text-regular'>Notify me about new messages</span>
            </label>

            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={formData.notificationSettings?.offers}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    notificationSettings: {
                      ...prev.notificationSettings!,
                      offers: e.target.checked,
                    },
                  }))
                }
                disabled={isLoading}
                className='h-4 w-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500'
              />
              <span className='text-regular'>Notify me about new offers</span>
            </label>

            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={formData.notificationSettings?.listings}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    notificationSettings: {
                      ...prev.notificationSettings!,
                      listings: e.target.checked,
                    },
                  }))
                }
                disabled={isLoading}
                className='h-4 w-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500'
              />
              <span className='text-regular'>
                Notify me about listing updates
              </span>
            </label>

            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={formData.notificationSettings?.marketing}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    notificationSettings: {
                      ...prev.notificationSettings!,
                      marketing: e.target.checked,
                    },
                  }))
                }
                disabled={isLoading}
                className='h-4 w-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500'
              />
              <span className='text-regular'>Send me marketing emails</span>
            </label>
          </div>
        </div>

        {/* Form Error */}
        {errors['form'] && (
          <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
            <p className='text-regular text-red-800'>{errors['form']}</p>
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-4'>
          <Button type='submit' disabled={isLoading} className='flex-1'>
            Save Changes
          </Button>
          {onCancel && (
            <Button
              type='button'
              variant='secondary'
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      {/* Loading Overlay */}
      <DiceLoader
        isVisible={isLoading}
        text={loadingMessage}
        variant='bounce'
      />
    </div>
  );
}
