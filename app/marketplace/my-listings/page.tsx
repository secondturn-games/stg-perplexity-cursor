/**
 * My Listings Page
 * Protected page showing user's marketplace listings
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { ProtectedRoute } from '@/components/layout';
import { DiceLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

interface UserListing {
  id: string;
  gameName: string;
  price: number;
  condition: string;
  thumbnail?: string;
  status: 'active' | 'sold' | 'draft';
  views: number;
  createdAt: string;
}

export default function MyListingsPage() {
  return (
    <ProtectedRoute loadingText='Loading your listings...'>
      <MyListingsContent />
    </ProtectedRoute>
  );
}

function MyListingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { isLoading, withLoading } = useLoading();

  const [listings, setListings] = useState<UserListing[]>([]);
  const [loadingMessage, setLoadingMessage] = useState(
    'Loading your listings...'
  );

  /**
   * Load user's listings
   */
  useEffect(() => {
    const loadListings = async () => {
      if (!user) {
        return;
      }

      setLoadingMessage('Loading your listings...');

      try {
        await withLoading(async () => {
          const { data, error } = await api.get<{ listings: UserListing[] }>(
            `/api/marketplace/listings/user/${user.id}`
          );

          if (error) {
            throw error;
          }

          if (data?.listings) {
            setListings(data.listings);
          }
        });
      } catch (error) {
        // Error handled - failed to load listings
      }
    };

    loadListings();
  }, [user, withLoading]);

  /**
   * Delete a listing
   */
  const deleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    setLoadingMessage('Deleting listing...');

    try {
      await withLoading(async () => {
        const { error } = await api.delete(
          `/api/marketplace/listings/${listingId}`
        );

        if (error) {
          throw error;
        }

        setListings(prev => prev.filter(l => l.id !== listingId));
      });
    } catch (error) {
      // Error handled
      alert('Failed to delete listing. Please try again.');
    }
  };

  return (
    <div className='mx-auto max-w-7xl space-y-6 p-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-normal text-primary-500'>My Listings</h1>
          <p className='mt-2 text-regular text-gray-600'>
            Manage your marketplace listings
          </p>
        </div>
        <Button onClick={() => router.push('/marketplace/listings/new')}>
          Create New Listing
        </Button>
      </div>

      {/* Listings Grid */}
      {listings.length > 0 ? (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {listings.map(listing => (
            <div key={listing.id} className='card overflow-hidden'>
              {/* Thumbnail */}
              <div className='relative aspect-square bg-gray-100'>
                <Image
                  src={listing.thumbnail || '/placeholder-game.jpg'}
                  alt={listing.gameName}
                  fill
                  className='object-cover'
                />
                <div className='absolute right-2 top-2'>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      listing.status === 'active'
                        ? 'bg-green-500 text-white'
                        : listing.status === 'sold'
                          ? 'bg-gray-500 text-white'
                          : 'bg-yellow-500 text-white'
                    }`}
                  >
                    {listing.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className='p-4'>
                <h3 className='text-lg font-medium text-gray-900 line-clamp-1'>
                  {listing.gameName}
                </h3>
                <div className='mt-2 flex items-baseline gap-2'>
                  <span className='text-xl font-bold text-accent-500'>
                    €{listing.price.toFixed(2)}
                  </span>
                </div>
                <p className='mt-1 text-sm text-gray-600'>
                  {listing.condition.replace('_', ' ')} • {listing.views} views
                </p>

                {/* Actions */}
                <div className='mt-4 flex gap-2'>
                  <Link
                    href={`/marketplace/listings/${listing.id}`}
                    className='flex-1'
                  >
                    <Button variant='secondary' size='sm' className='w-full'>
                      View
                    </Button>
                  </Link>
                  <Link
                    href={`/marketplace/listings/${listing.id}/edit`}
                    className='flex-1'
                  >
                    <Button variant='secondary' size='sm' className='w-full'>
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => deleteListing(listing.id)}
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='card py-12 text-center'>
          <h2 className='text-xl text-gray-600'>No listings yet</h2>
          <p className='mt-2 text-regular text-gray-500'>
            Create your first listing to start selling
          </p>
          <div className='mt-6'>
            <Button onClick={() => router.push('/marketplace/listings/new')}>
              Create Listing
            </Button>
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
