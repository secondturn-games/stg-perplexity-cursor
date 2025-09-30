/**
 * Listing Form Component
 * Form for creating and editing marketplace listings with loading states
 */

'use client';

import { useState, useCallback } from 'react';
import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { searchGamesWithLoading } from '@/lib/bgg/api-with-loading';
import { api } from '@/lib/api';
import { createFormHandler, validators } from '@/lib/form-handlers';

interface BGGGameData {
  id: string;
  name: string;
  yearPublished?: number;
  thumbnail?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
}

interface ListingFormData {
  gameId?: string;
  gameName: string;
  condition: 'new' | 'like_new' | 'good' | 'acceptable' | 'poor';
  price: number;
  currency: 'EUR';
  description: string;
  location: 'EST' | 'LVA' | 'LTU';
  shippingAvailable: boolean;
  images: File[];
}

interface ListingFormProps {
  /**
   * Initial listing data for editing
   */
  initialData?: Partial<ListingFormData>;

  /**
   * Listing ID if editing existing listing
   */
  listingId?: string;

  /**
   * Callback on successful submission
   */
  onSuccess?: (data: any) => void;

  /**
   * Callback on cancel
   */
  onCancel?: () => void;
}

/**
 * ListingForm - Create or edit marketplace listings with BGG integration
 */
export default function ListingForm({
  initialData,
  listingId,
  onSuccess,
  onCancel,
}: ListingFormProps) {
  const { isLoading, withLoading } = useLoading();
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  // Form state
  const [formData, setFormData] = useState<ListingFormData>({
    gameName: initialData?.gameName || '',
    condition: initialData?.condition || 'good',
    price: initialData?.price || 0,
    currency: 'EUR',
    description: initialData?.description || '',
    location: initialData?.location || 'EST',
    shippingAvailable: initialData?.shippingAvailable ?? true,
    images: [],
  });

  const [bggSearchResults, setBggSearchResults] = useState<BGGGameData[]>([]);
  const [selectedGame, setSelectedGame] = useState<BGGGameData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  /**
   * Search BGG for board games
   */
  const searchBGG = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setBggSearchResults([]);
        return;
      }

      setLoadingMessage('Searching BoardGameGeek...');

      const { data, error } = await searchGamesWithLoading(
        query,
        { gameType: 'base-game' },
        { withLoading },
        {
          loadingDelay: 300,
          onError: err => {
            setErrors({ bgg: err.message });
          },
        }
      );

      if (data?.items) {
        setBggSearchResults(data.items.slice(0, 10) as BGGGameData[]);
      }
    },
    [withLoading]
  );

  /**
   * Select a game from BGG search results
   */
  const selectGame = useCallback((game: BGGGameData) => {
    setSelectedGame(game);
    setFormData(prev => ({
      ...prev,
      gameId: game.id,
      gameName: game.name,
    }));
    setBggSearchResults([]);
  }, []);

  /**
   * Handle image upload
   */
  const handleImageUpload = useCallback(
    async (files: FileList) => {
      if (!files || files.length === 0) {
        return;
      }

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
            {
              headers: {},
            }
          );

          if (error) {
            throw error;
          }

          if (data?.urls) {
            setUploadedImages(prev => [...prev, ...data.urls]);
          }
        });
      } catch (error) {
        setErrors({
          images:
            error instanceof Error ? error.message : 'Failed to upload images',
        });
      }
    },
    [withLoading]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = createFormHandler(
    async (data: ListingFormData) => {
      setLoadingMessage(
        listingId ? 'Updating listing...' : 'Creating listing...'
      );

      const endpoint = listingId
        ? `/api/marketplace/listings/${listingId}`
        : '/api/marketplace/listings';

      const method = listingId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          images: uploadedImages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save listing');
      }

      return response.json();
    },
    { withLoading },
    {
      validate: data => {
        const validationErrors: Record<string, string> = {};

        if (!data.gameName) {
          validationErrors['gameName'] = 'Game name is required';
        }

        if (!data.price || data.price <= 0) {
          validationErrors['price'] = 'Price must be greater than 0';
        }

        if (!data.description || data.description.length < 20) {
          validationErrors['description'] =
            'Description must be at least 20 characters';
        }

        if (uploadedImages.length === 0) {
          validationErrors['images'] = 'At least one image is required';
        }

        return Object.keys(validationErrors).length > 0
          ? validationErrors
          : null;
      },
      onSuccess: data => {
        if (onSuccess) {
          onSuccess(data);
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
    setLoadingMessage('Saving listing...');
    await handleSubmit(formData, e.currentTarget);
  };

  return (
    <div className='mx-auto max-w-3xl'>
      <form onSubmit={onSubmit} className='space-y-6'>
        {/* BGG Game Search */}
        <div className='card space-y-4'>
          <h2 className='text-xl font-normal text-primary-500'>
            Board Game Information
          </h2>

          {!selectedGame ? (
            <div>
              <label htmlFor='gameSearch' className='form-label'>
                Search BoardGameGeek
              </label>
              <Input
                id='gameSearch'
                type='text'
                placeholder='Search for a board game...'
                onChange={e => searchBGG(e.target.value)}
                disabled={isLoading}
              />

              {bggSearchResults.length > 0 && (
                <div className='mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200'>
                  {bggSearchResults.map(game => (
                    <button
                      key={game.id}
                      type='button'
                      onClick={() => selectGame(game)}
                      className='flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50'
                    >
                      {game.thumbnail && (
                        <img
                          src={game.thumbnail}
                          alt={game.name}
                          className='h-12 w-12 rounded object-cover'
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
                <img
                  src={selectedGame.thumbnail}
                  alt={selectedGame.name}
                  className='h-20 w-20 rounded object-cover'
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
                  setFormData(prev => ({ ...prev, gameId: '', gameName: '' }));
                }}
              >
                Change
              </Button>
            </div>
          )}

          {errors['bgg'] && <p className='text-sm text-red-600'>{errors['bgg']}</p>}
        </div>

        {/* Listing Details */}
        <div className='card space-y-4'>
          <h2 className='text-xl font-normal text-primary-500'>
            Listing Details
          </h2>

          {/* Condition */}
          <div>
            <label htmlFor='condition' className='form-label'>
              Condition
            </label>
            <Select
              id='condition'
              value={formData.condition}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  condition: e.target.value as ListingFormData['condition'],
                }))
              }
              disabled={isLoading}
            >
              <option value='new'>New</option>
              <option value='like_new'>Like New</option>
              <option value='good'>Good</option>
              <option value='acceptable'>Acceptable</option>
              <option value='poor'>Poor</option>
            </Select>
          </div>

          {/* Price */}
          <div>
            <label htmlFor='price' className='form-label'>
              Price (EUR)
            </label>
            <Input
              id='price'
              type='number'
              step='0.01'
              min='0'
              value={formData.price}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  price: Number(e.target.value),
                }))
              }
              disabled={isLoading}
            />
            {errors['price'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['price']}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor='description' className='form-label'>
              Description
            </label>
            <textarea
              id='description'
              rows={5}
              className='input-field'
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              disabled={isLoading}
              placeholder='Describe the condition, any missing pieces, etc...'
            />
            {errors['description'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['description']}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor='location' className='form-label'>
              Location
            </label>
            <Select
              id='location'
              value={formData.location}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  location: e.target.value as ListingFormData['location'],
                }))
              }
              disabled={isLoading}
            >
              <option value='EST'>Estonia</option>
              <option value='LVA'>Latvia</option>
              <option value='LTU'>Lithuania</option>
            </Select>
          </div>

          {/* Shipping */}
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='shippingAvailable'
              checked={formData.shippingAvailable}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  shippingAvailable: e.target.checked,
                }))
              }
              disabled={isLoading}
              className='h-4 w-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500'
            />
            <label htmlFor='shippingAvailable' className='text-regular'>
              Shipping available
            </label>
          </div>
        </div>

        {/* Image Upload */}
        <div className='card space-y-4'>
          <h2 className='text-xl font-normal text-primary-500'>Images</h2>

          <div>
            <label htmlFor='images' className='form-label'>
              Upload Images
            </label>
            <input
              type='file'
              id='images'
              multiple
              accept='image/*'
              onChange={e => {
                if (e.target.files) {
                  handleImageUpload(e.target.files);
                }
              }}
              disabled={isLoading}
              className='block w-full text-sm text-gray-600 file:mr-4 file:rounded file:border-0 file:bg-accent-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-accent-600'
            />
            {errors['images'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['images']}</p>
            )}
          </div>

          {uploadedImages.length > 0 && (
            <div className='grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5'>
              {uploadedImages.map((url, index) => (
                <div key={index} className='relative aspect-square'>
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className='h-full w-full rounded object-cover'
                  />
                  <button
                    type='button'
                    onClick={() =>
                      setUploadedImages(prev =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    className='absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600'
                    disabled={isLoading}
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
            {listingId ? 'Update Listing' : 'Create Listing'}
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
      <DiceLoader isVisible={isLoading} text={loadingMessage} variant='roll' />
    </div>
  );
}
