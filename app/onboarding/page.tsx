'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';

const onboardingSchema = yup.object({
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
  location: yup
    .string()
    .oneOf(
      ['EST', 'LVA', 'LTU', 'EU', 'OTHER'],
      'Please select a valid location'
    )
    .required('Location is required'),
  bio: yup.string().max(500, 'Bio must be less than 500 characters'),
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

type OnboardingFormData = yup.InferType<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OnboardingFormData>({
    resolver: yupResolver(onboardingSchema),
    defaultValues: {
      username: '',
      fullName: '',
      location: 'EST',
      bio: '',
      phone: '',
      showEmail: false,
      showPhone: false,
      showLocation: true,
      messages: true,
      offers: true,
      listings: true,
      marketing: false,
    },
  });

  const bio = watch('bio');

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
    }
  }, [user, router]);

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 Starting profile creation with data:', data);

      const { error } = await updateProfile({
        username: data.username,
        full_name: data.fullName,
        bio: data.bio || '',
        location: data.location,
        phone: data.phone || '',
        privacy_settings: {
          show_email: data.showEmail || false,
          show_phone: data.showPhone || false,
          show_location: data.showLocation || true,
        },
        notification_settings: {
          messages: data.messages || true,
          offers: data.offers || true,
          listings: data.listings || true,
          marketing: data.marketing || false,
        },
      });

      if (error) {
        console.error('❌ Profile creation error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to create profile. ';
        
        if (error.code === '23505') {
          errorMessage += 'Username already exists. Please choose a different username.';
        } else if (error.code === '23514') {
          errorMessage += 'Invalid data provided. Please check your input.';
        } else if (error.code === '42501') {
          errorMessage += 'Permission denied. Please try again or contact support.';
        } else if (error.message) {
          errorMessage += error.message;
        } else {
          errorMessage += 'Please try again or contact support if the problem persists.';
        }
        
        setError(errorMessage);
        return;
      }

      console.log('✅ Profile created successfully, redirecting to dashboard');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('❌ Unexpected error during profile creation:', err);
      setError('An unexpected error occurred. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const locationOptions = [
    { value: 'EST', label: 'Estonia' },
    { value: 'LVA', label: 'Latvia' },
    { value: 'LTU', label: 'Lithuania' },
    { value: 'EU', label: 'Other EU Country' },
    { value: 'OTHER', label: 'Other' },
  ];

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-2xl mx-auto'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-primary-600 mb-2'>
            Welcome to Second Turn Games!
          </h1>
          <p className='text-gray-600'>
            Complete your profile setup to get started
          </p>
        </div>

        {/* Progress Bar */}
        <div className='mb-8'>
          <div className='flex items-center'>
            {[1, 2, 3].map(step => (
              <div key={step} className='flex items-center'>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className='flex justify-between mt-2 text-sm text-gray-600'>
            <span>Basic Info</span>
            <span>Location</span>
            <span>Preferences</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
          {error && (
            <Alert variant='error' className='mb-6'>
              {error}
            </Alert>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className='space-y-6'>
              <div>
                <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                  Tell us about yourself
                </h2>
                <p className='text-gray-600 mb-6'>
                  This information will be visible on your profile and help
                  other users find you.
                </p>
              </div>

              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                <div>
                  <label
                    htmlFor='username'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Username *
                  </label>
                  <Input
                    id='username'
                    type='text'
                    placeholder='Choose a username'
                    {...register('username')}
                    error={errors.username?.message}
                    disabled={isLoading}
                  />
                  <p className='mt-1 text-sm text-gray-500'>
                    This will be your unique identifier on the platform
                  </p>
                </div>

                <div>
                  <label
                    htmlFor='fullName'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Full Name *
                  </label>
                  <Input
                    id='fullName'
                    type='text'
                    placeholder='Enter your full name'
                    {...register('fullName')}
                    error={errors.fullName?.message}
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
                  placeholder='Tell us about your board game interests...'
                  {...register('bio')}
                  disabled={isLoading}
                />
                {errors.bio && (
                  <p className='mt-1 text-sm text-red-600'>
                    {errors.bio.message}
                  </p>
                )}
                <p className='mt-1 text-sm text-gray-500'>
                  {bio?.length || 0}/500 characters
                </p>
              </div>

              <div className='flex justify-end'>
                <Button type='button' onClick={nextStep} disabled={isLoading}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className='space-y-6'>
              <div>
                <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                  Where are you located?
                </h2>
                <p className='text-gray-600 mb-6'>
                  This helps us show you relevant listings and shipping options.
                </p>
              </div>

              <div>
                <label
                  htmlFor='location'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Location *
                </label>
                <Select
                  id='location'
                  {...register('location')}
                  error={errors.location?.message}
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
                  {...register('phone')}
                  error={errors.phone?.message}
                  disabled={isLoading}
                />
                <p className='mt-1 text-sm text-gray-500'>
                  Helps with local meetups and communication
                </p>
              </div>

              <div className='flex justify-between'>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={prevStep}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button type='button' onClick={nextStep} disabled={isLoading}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div className='space-y-6'>
              <div>
                <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
                  Set your preferences
                </h2>
                <p className='text-gray-600 mb-6'>
                  Choose what information you'd like to share and how you'd like
                  to be notified.
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-3'>
                  Privacy Settings
                </label>
                <div className='space-y-3'>
                  <Checkbox
                    id='showEmail'
                    {...register('showEmail')}
                    disabled={isLoading}
                  >
                    <span className='text-sm text-gray-700'>
                      Show email address on profile
                    </span>
                  </Checkbox>
                  <Checkbox
                    id='showPhone'
                    {...register('showPhone')}
                    disabled={isLoading}
                  >
                    <span className='text-sm text-gray-700'>
                      Show phone number on profile
                    </span>
                  </Checkbox>
                  <Checkbox
                    id='showLocation'
                    {...register('showLocation')}
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
                    {...register('messages')}
                    disabled={isLoading}
                  >
                    <span className='text-sm text-gray-700'>New messages</span>
                  </Checkbox>
                  <Checkbox
                    id='offers'
                    {...register('offers')}
                    disabled={isLoading}
                  >
                    <span className='text-sm text-gray-700'>
                      New offers on my listings
                    </span>
                  </Checkbox>
                  <Checkbox
                    id='listings'
                    {...register('listings')}
                    disabled={isLoading}
                  >
                    <span className='text-sm text-gray-700'>
                      Updates about my listings
                    </span>
                  </Checkbox>
                  <Checkbox
                    id='marketing'
                    {...register('marketing')}
                    disabled={isLoading}
                  >
                    <span className='text-sm text-gray-700'>
                      Marketing emails and special offers
                      <span className='text-gray-500'> (optional)</span>
                    </span>
                  </Checkbox>
                </div>
              </div>

              <div className='flex justify-between'>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={prevStep}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button type='submit' disabled={isLoading} loading={isLoading}>
                  {isLoading ? 'Creating Profile...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
