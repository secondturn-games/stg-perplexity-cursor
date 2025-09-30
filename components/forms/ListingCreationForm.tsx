/**
 * Listing Creation Form Component
 * Comprehensive form for creating marketplace listings with react-hook-form
 */

'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/hooks/useLoading';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { DiceLoader } from '@/components/ui';
import { searchGamesWithLoading } from '@/lib/bgg/api-with-loading';
import { api } from '@/lib/api';
import Image from 'next/image';

/**
 * Listing form validation schema
 */
const listingSchema = yup.object({
  gameName: yup
    .string()
    .min(2, 'Game name must be at least 2 characters')
    .required('Game name is required'),
  gameId: yup.string().nullable(),
  condition: yup
    .string()
    .oneOf(
      ['new', 'like_new', 'good', 'acceptable', 'poor'],
      'Please select a valid condition'
    )
    .required('Condition is required'),
  price: yup
    .number()
    .positive('Price must be greater than 0')
    .max(10000, 'Price must be less than €10,000')
    .required('Price is required'),
  description: yup
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .required('Description is required'),
  location: yup
    .string()
    .oneOf(['EST', 'LVA', 'LTU'], 'Please select a valid location')
    .required('Location is required'),
  shippingAvailable: yup.boolean().required(),
});

type ListingFormData = yup.InferType<typeof listingSchema>;

interface BGGGame {
  id: string;
  name: string;
  yearPublished?: number;
  thumbnail?: string;
}

interface ListingCreationFormProps {
  /**
   * Callback on successful creation
   */
  onSuccess?: (listingId: string) => void;

  /**
   * Callback on cancel
   */
  onCancel?: () => void;
}

/**
 * ListingCreationForm - Create marketplace listings with validation
 */
export default function ListingCreationForm({
  onSuccess,
  onCancel,
}: ListingCreationFormProps) {
  const router = useRouter();
  const { isLoading, withLoading } = useLoading({
    defaultTimeout: 60000,
    onError: error => {
      setFormError(error.message);
    },
  });

  const [loadingMessage, setLoadingMessage] = useState('Creating listing...');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // BGG search state
  const [bggQuery, setBggQuery] = useState('');
  const [bggResults, setBggResults] = useState<BGGGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<BGGGame | null>(null);

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: yupResolver(listingSchema),
    defaultValues: {
      condition: 'good',
      location: 'EST',
      shippingAvailable: true,
    },
  });

  const descriptionValue = watch('description') || '';

  /**
   * Search BGG for games
   */
  const searchBGG = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setBggResults([]);
        return;
      }

      setBggQuery(query);
      setLoadingMessage('Searching BoardGameGeek...');

      try {
        const { data, error } = await searchGamesWithLoading(
          query,
          {},
          { withLoading },
          { loadingDelay: 300 }
        );

        if (error) {
          throw error;
        }

        if (data?.items) {
          setBggResults(data.items.slice(0, 10) as BGGGame[]);
        }
      } catch (err) {
        // Error handled - BGG search failed silently
      }
    },
    [withLoading]
  );

  /**
   * Select game from BGG results
   */
  const selectGame = (game: BGGGame) => {
    setSelectedGame(game);
    setValue('gameName', game.name);
    setValue('gameId', game.id);
    setBggResults([]);
    setBggQuery('');
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) {
      return;
    }

    setImageUploadError(null);
    setLoadingMessage('Uploading images...');

    try {
      await withLoading(async () => {
        const formData = new FormData();
        Array.from(files).forEach(file => {
          formData.append('images', file);
        });

        const { data, error } = await api.post<{ urls: string[] }>(
          '/api/upload/images',
          formData,
          { headers: {} }
        );

        if (error) {
          throw error;
        }

        if (data?.urls) {
          setUploadedImages(prev => [...prev, ...data.urls]);
        }
      });
    } catch (err) {
      setImageUploadError(
        err instanceof Error ? err.message : 'Failed to upload images'
      );
    }
  };

  /**
   * Remove uploaded image
   */
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Submit form
   */
  const onSubmit = async (data: ListingFormData) => {
    setFormError(null);
    setSuccess(false);
    setLoadingMessage('Creating your listing...');

    // Validate images
    if (uploadedImages.length === 0) {
      setFormError('Please upload at least one image');
      return;
    }

    try {
      await withLoading(async () => {
        const { data: result, error } = await api.post<{ id: string }>(
          '/api/marketplace/listings',
          {
            ...data,
            images: uploadedImages,
          },
          {
            loadingDelay: 300,
          }
        );

        if (error) {
          throw error;
        }

        // Success state
        setSuccess(true);
        setLoadingMessage('Listing created successfully!');

        // Brief delay to show success
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (onSuccess && result?.id) {
          onSuccess(result.id);
        } else if (result?.id) {
          router.push(`/marketplace/listings/${result.id}`);
        }
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Failed to create listing. Please try again.'
      );
    }
  };

  return (
    <div className='mx-auto max-w-3xl'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='space-y-6'
        aria-label='Create marketplace listing form'
        aria-busy={isLoading}
      >
        {/* Form Error */}
        {formError && (
          <Alert variant='error' role='alert' aria-live='assertive'>
            <p>{formError}</p>
          </Alert>
        )}

        {/* Success Message */}
        {success && !isLoading && (
          <Alert variant='success' role='status' aria-live='polite'>
            <p>✓ Listing created successfully!</p>
          </Alert>
        )}

        {/* BGG Game Search */}
        <fieldset disabled={isLoading} className='card space-y-4'>
          <legend className='text-xl font-normal text-primary-500'>
            Board Game Information
          </legend>

          {!selectedGame ? (
            <div>
              <label htmlFor='gameSearch' className='form-label'>
                Search BoardGameGeek
              </label>
              <Input
                id='gameSearch'
                type='text'
                placeholder='Search for a board game...'
                value={bggQuery}
                onChange={e => searchBGG(e.target.value)}
                disabled={isLoading}
                aria-label='Search BoardGameGeek for games'
              />

              {bggResults.length > 0 && (
                <div
                  className='mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200'
                  role='listbox'
                  aria-label='Game search results'
                >
                  {bggResults.map(game => (
                    <button
                      key={game.id}
                      type='button'
                      onClick={() => selectGame(game)}
                      className='flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50'
                      role='option'
                    >
                      {game.thumbnail && (
                        <Image
                          src={game.thumbnail}
                          alt={game.name}
                          width={48}
                          height={48}
                          className='rounded object-cover'
                        />
                      )}
                      <div>
                        <p className='font-medium text-gray-900'>{game.name}</p>
                        {game.yearPublished && (
                          <p className='text-sm text-gray-600'>
                            {game.yearPublished}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className='flex items-center gap-4 rounded-lg border border-gray-200 p-4'>
              {selectedGame.thumbnail && (
                <Image
                  src={selectedGame.thumbnail}
                  alt={selectedGame.name}
                  width={80}
                  height={80}
                  className='rounded object-cover'
                />
              )}
              <div className='flex-1'>
                <h3 className='font-medium text-gray-900'>
                  {selectedGame.name}
                </h3>
                {selectedGame.yearPublished && (
                  <p className='text-sm text-gray-600'>
                    {selectedGame.yearPublished}
                  </p>
                )}
              </div>
              <Button
                type='button'
                variant='secondary'
                size='sm'
                onClick={() => {
                  setSelectedGame(null);
                  setValue('gameName', '');
                  setValue('gameId', null);
                }}
                disabled={isLoading}
              >
                Change
              </Button>
            </div>
          )}
        </fieldset>

        {/* Listing Details */}
        <fieldset disabled={isLoading} className='card space-y-4'>
          <legend className='text-xl font-normal text-primary-500'>
            Listing Details
          </legend>

          {/* Condition */}
          <div>
            <label htmlFor='condition' className='form-label'>
              Condition *
            </label>
            <Controller
              name='condition'
              control={control}
              render={({ field }) => (
                <Select
                  id='condition'
                  {...field}
                  disabled={isLoading}
                  aria-required='true'
                  aria-invalid={!!errors.condition}
                  aria-describedby={
                    errors.condition ? 'condition-error' : undefined
                  }
                >
                  <option value='new'>New</option>
                  <option value='like_new'>Like New</option>
                  <option value='good'>Good</option>
                  <option value='acceptable'>Acceptable</option>
                  <option value='poor'>Poor</option>
                </Select>
              )}
            />
            {errors.condition && (
              <p
                id='condition-error'
                className='mt-1 text-sm text-red-600'
                role='alert'
              >
                {errors.condition.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label htmlFor='price' className='form-label'>
              Price (EUR) *
            </label>
            <Input
              id='price'
              type='number'
              step='0.01'
              min='0'
              placeholder='0.00'
              {...register('price', { valueAsNumber: true })}
              disabled={isLoading}
              aria-required='true'
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? 'price-error' : undefined}
            />
            {errors.price && (
              <p
                id='price-error'
                className='mt-1 text-sm text-red-600'
                role='alert'
              >
                {errors.price.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor='description' className='form-label'>
              Description *
            </label>
            <textarea
              id='description'
              rows={6}
              className='input-field'
              placeholder='Describe the condition, any missing pieces, wear and tear, etc...'
              {...register('description')}
              disabled={isLoading}
              aria-required='true'
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description ? 'description-error' : 'description-hint'
              }
            />
            <div className='mt-1 flex items-center justify-between'>
              <p
                id='description-hint'
                className='text-sm text-gray-500'
                aria-live='polite'
              >
                {descriptionValue.length}/2000 characters
              </p>
            </div>
            {errors.description && (
              <p
                id='description-error'
                className='mt-1 text-sm text-red-600'
                role='alert'
              >
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor='location' className='form-label'>
              Location *
            </label>
            <Controller
              name='location'
              control={control}
              render={({ field }) => (
                <Select
                  id='location'
                  {...field}
                  disabled={isLoading}
                  aria-required='true'
                  aria-invalid={!!errors.location}
                  aria-describedby={
                    errors.location ? 'location-error' : undefined
                  }
                >
                  <option value='EST'>Estonia</option>
                  <option value='LVA'>Latvia</option>
                  <option value='LTU'>Lithuania</option>
                </Select>
              )}
            />
            {errors.location && (
              <p
                id='location-error'
                className='mt-1 text-sm text-red-600'
                role='alert'
              >
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Shipping */}
          <div>
            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                {...register('shippingAvailable')}
                disabled={isLoading}
                className='h-4 w-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500'
              />
              <span className='text-regular'>Shipping available</span>
            </label>
          </div>
        </fieldset>

        {/* Images */}
        <fieldset disabled={isLoading} className='card space-y-4'>
          <legend className='text-xl font-normal text-primary-500'>
            Images *
          </legend>

          <div>
            <label htmlFor='images' className='form-label'>
              Upload Images (minimum 1)
            </label>
            <input
              type='file'
              id='images'
              multiple
              accept='image/jpeg,image/png,image/webp'
              onChange={e => {
                if (e.target.files) {
                  handleImageUpload(e.target.files);
                }
              }}
              disabled={isLoading}
              className='block w-full text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-accent-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-accent-600 disabled:opacity-50'
              aria-label='Upload listing images'
            />
            <p className='mt-1 text-sm text-gray-500'>
              PNG, JPG or WebP (max 5MB each)
            </p>
            {imageUploadError && (
              <p className='mt-1 text-sm text-red-600' role='alert'>
                {imageUploadError}
              </p>
            )}
          </div>

          {/* Image Preview */}
          {uploadedImages.length > 0 && (
            <div
              className='grid grid-cols-3 gap-4 sm:grid-cols-4'
              role='list'
              aria-label='Uploaded images'
            >
              {uploadedImages.map((url, index) => (
                <div
                  key={index}
                  className='relative aspect-square'
                  role='listitem'
                >
                  <Image
                    src={url}
                    alt={`Listing image ${index + 1}`}
                    fill
                    className='rounded object-cover'
                  />
                  <button
                    type='button'
                    onClick={() => removeImage(index)}
                    disabled={isLoading}
                    className='absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 disabled:opacity-50'
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <svg
                      className='h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </fieldset>

        {/* Form Actions */}
        <div className='flex gap-4'>
          <Button
            type='submit'
            className='flex-1'
            disabled={isLoading || uploadedImages.length === 0}
            aria-busy={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Listing'}
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

        {/* Required Fields Note */}
        <p className='text-center text-sm text-gray-500'>* Required fields</p>
      </form>

      {/* Loading Overlay */}
      <DiceLoader isVisible={isLoading} text={loadingMessage} variant='roll' />
    </div>
  );
}
