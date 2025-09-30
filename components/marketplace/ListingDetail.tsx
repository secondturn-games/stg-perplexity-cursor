/**
 * Listing Detail Component
 * Displays detailed information about a marketplace listing with loading states
 */

'use client';

import { useState, useEffect } from 'react';
import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { getGameDetailsWithLoading } from '@/lib/bgg/api-with-loading';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

interface ListingData {
  id: string;
  gameId: string;
  gameName: string;
  condition: string;
  price: number;
  currency: string;
  description: string;
  location: string;
  shippingAvailable: boolean;
  images: string[];
  sellerId: string;
  sellerName: string;
  createdAt: string;
}

interface BGGGameDetails {
  id: string;
  name: string;
  yearPublished?: number;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minAge?: number;
  designers?: string[];
  publishers?: string[];
  categories?: string[];
  mechanics?: string[];
  thumbnail?: string;
  image?: string;
}

interface ListingDetailProps {
  /**
   * Listing ID to display
   */
  listingId: string;

  /**
   * Whether the current user owns this listing
   */
  isOwner?: boolean;

  /**
   * Callback when contact seller is clicked
   */
  onContactSeller?: () => void;

  /**
   * Callback when edit is clicked
   */
  onEdit?: () => void;
}

/**
 * ListingDetail - Display detailed marketplace listing information
 */
export default function ListingDetail({
  listingId,
  isOwner = false,
  onContactSeller,
  onEdit,
}: ListingDetailProps) {
  const { isLoading, withLoading } = useLoading();
  const [loadingMessage, setLoadingMessage] = useState('Loading listing...');

  const [listing, setListing] = useState<ListingData | null>(null);
  const [gameDetails, setGameDetails] = useState<BGGGameDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number>(0);

  /**
   * Load listing data
   */
  useEffect(() => {
    const loadListing = async () => {
      setLoadingMessage('Loading listing...');

      try {
        await withLoading(async () => {
          // Fetch listing data
          const { data: listingData, error: listingError } =
            await api.get<ListingData>(
              `/api/marketplace/listings/${listingId}`
            );

          if (listingError || !listingData) {
            throw new Error('Failed to load listing');
          }

          setListing(listingData);

          // If we have a BGG game ID, fetch game details
          if (listingData.gameId) {
            setLoadingMessage('Loading game information...');

            const { data: gameData, error: gameError } =
              await getGameDetailsWithLoading(
                listingData.gameId,
                { withLoading },
                {
                  processImages: true,
                  loadingDelay: 300,
                }
              );

            if (!gameError && gameData) {
              setGameDetails(gameData);
            }
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing');
      }
    };

    loadListing();
  }, [listingId, withLoading]);

  /**
   * Handle add to cart
   */
  const handleAddToCart = async () => {
    if (!listing) {
      return;
    }

    setLoadingMessage('Adding to cart...');

    try {
      await withLoading(async () => {
        const { error } = await api.post('/api/cart/add', {
          listingId: listing.id,
        });

        if (error) {
          throw error;
        }

        alert('Added to cart successfully!');
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    }
  };

  if (error) {
    return (
      <div className='mx-auto max-w-4xl p-4'>
        <div className='card space-y-4 bg-red-50'>
          <h2 className='text-xl font-normal text-red-800'>Error</h2>
          <p className='text-regular text-red-700'>{error}</p>
          <Button variant='secondary' onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return <DiceLoader isVisible={true} text={loadingMessage} variant='roll' />;
  }

  return (
    <div className='mx-auto max-w-6xl space-y-6 p-4'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Images */}
        <div className='space-y-4'>
          {/* Main Image */}
          <div className='relative aspect-square overflow-hidden rounded-lg bg-gray-100'>
            <Image
              src={listing.images[selectedImage] || '/placeholder-game.jpg'}
              alt={listing.gameName}
              fill
              className='object-cover'
              priority
            />
          </div>

          {/* Image Thumbnails */}
          {listing.images.length > 1 && (
            <div className='grid grid-cols-4 gap-2'>
              {listing.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square overflow-hidden rounded border-2 ${
                    selectedImage === index
                      ? 'border-accent-500'
                      : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${listing.gameName} ${index + 1}`}
                    fill
                    className='object-cover'
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Listing Information */}
        <div className='space-y-6'>
          {/* Title and Price */}
          <div>
            <h1 className='text-3xl font-normal text-primary-500'>
              {listing.gameName}
            </h1>
            <div className='mt-2 flex items-baseline gap-2'>
              <span className='text-3xl font-bold text-accent-500'>
                €{listing.price.toFixed(2)}
              </span>
              <span className='text-regular text-gray-600'>EUR</span>
            </div>
          </div>

          {/* Condition Badge */}
          <div>
            <span className='inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700'>
              Condition: {listing.condition.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Seller Info */}
          <div className='rounded-lg border border-gray-200 p-4'>
            <h3 className='text-lg font-medium text-gray-900'>Seller</h3>
            <p className='mt-1 text-regular text-gray-600'>
              {listing.sellerName}
            </p>
            <p className='mt-1 text-sm text-gray-500'>
              Location: {listing.location}
            </p>
            {listing.shippingAvailable && (
              <p className='mt-1 text-sm text-green-600'>
                ✓ Shipping available
              </p>
            )}
          </div>

          {/* Actions */}
          <div className='space-y-3'>
            {!isOwner && (
              <>
                <Button
                  onClick={handleAddToCart}
                  className='w-full'
                  disabled={isLoading}
                >
                  Add to Cart
                </Button>
                {onContactSeller && (
                  <Button
                    variant='secondary'
                    onClick={onContactSeller}
                    className='w-full'
                    disabled={isLoading}
                  >
                    Contact Seller
                  </Button>
                )}
              </>
            )}

            {isOwner && onEdit && (
              <Button
                variant='secondary'
                onClick={onEdit}
                className='w-full'
                disabled={isLoading}
              >
                Edit Listing
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className='card space-y-4'>
        <h2 className='text-xl font-normal text-primary-500'>Description</h2>
        <p className='text-regular text-gray-700 whitespace-pre-line'>
          {listing.description}
        </p>
      </div>

      {/* Game Details from BGG */}
      {gameDetails && (
        <div className='card space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-normal text-primary-500'>
              About {gameDetails.name}
            </h2>
            <Link
              href={`https://boardgamegeek.com/boardgame/${gameDetails.id}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-sm text-accent-500 hover:underline'
            >
              View on BGG →
            </Link>
          </div>

          {/* Game Stats */}
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {gameDetails.yearPublished && (
              <div>
                <p className='text-sm text-gray-600'>Year</p>
                <p className='text-lg font-medium text-gray-900'>
                  {gameDetails.yearPublished}
                </p>
              </div>
            )}
            {gameDetails.minPlayers && gameDetails.maxPlayers && (
              <div>
                <p className='text-sm text-gray-600'>Players</p>
                <p className='text-lg font-medium text-gray-900'>
                  {gameDetails.minPlayers}-{gameDetails.maxPlayers}
                </p>
              </div>
            )}
            {gameDetails.playingTime && (
              <div>
                <p className='text-sm text-gray-600'>Playing Time</p>
                <p className='text-lg font-medium text-gray-900'>
                  {gameDetails.playingTime} min
                </p>
              </div>
            )}
            {gameDetails.minAge && (
              <div>
                <p className='text-sm text-gray-600'>Age</p>
                <p className='text-lg font-medium text-gray-900'>
                  {gameDetails.minAge}+
                </p>
              </div>
            )}
          </div>

          {/* Game Description */}
          {gameDetails.description && (
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                Game Description
              </h3>
              <div
                className='prose mt-2 max-w-none text-regular text-gray-700'
                dangerouslySetInnerHTML={{ __html: gameDetails.description }}
              />
            </div>
          )}

          {/* Categories and Mechanics */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {gameDetails.categories && gameDetails.categories.length > 0 && (
              <div>
                <h3 className='text-lg font-medium text-gray-900'>
                  Categories
                </h3>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {gameDetails.categories.map((category, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {gameDetails.mechanics && gameDetails.mechanics.length > 0 && (
              <div>
                <h3 className='text-lg font-medium text-gray-900'>Mechanics</h3>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {gameDetails.mechanics.map((mechanic, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'
                    >
                      {mechanic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <DiceLoader
        isVisible={isLoading}
        text={loadingMessage}
        variant='bounce'
      />
    </div>
  );
}
