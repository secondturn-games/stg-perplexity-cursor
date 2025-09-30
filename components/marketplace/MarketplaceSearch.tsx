/**
 * Marketplace Search Component
 * Search and filter marketplace listings with loading states
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLoading } from '@/hooks/useLoading';
import { DiceLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/lib/api';
import { debounce } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface ListingSearchResult {
  id: string;
  gameId: string;
  gameName: string;
  condition: string;
  price: number;
  currency: string;
  location: string;
  shippingAvailable: boolean;
  thumbnail?: string;
  sellerName: string;
  createdAt: string;
}

interface SearchFilters {
  query?: string;
  condition?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  shippingAvailable?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name';
}

interface MarketplaceSearchProps {
  /**
   * Initial search filters
   */
  initialFilters?: SearchFilters;

  /**
   * Callback when a listing is selected
   */
  onSelectListing?: (listingId: string) => void;
}

/**
 * MarketplaceSearch - Search and filter marketplace listings
 */
export default function MarketplaceSearch({
  initialFilters = {},
  onSelectListing,
}: MarketplaceSearchProps) {
  const { isLoading, withLoading } = useLoading();
  const [loadingMessage, setLoadingMessage] = useState('Searching...');

  // Search state
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [results, setResults] = useState<ListingSearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultsPerPage = 12;

  /**
   * Execute search
   */
  const executeSearch = useCallback(
    async (searchFilters: SearchFilters, page: number = 1) => {
      setError(null);
      setLoadingMessage('Searching marketplace...');

      try {
        await withLoading(async () => {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: resultsPerPage.toString(),
            ...(searchFilters.query && { query: searchFilters.query }),
            ...(searchFilters.condition && {
              condition: searchFilters.condition,
            }),
            ...(searchFilters.location && { location: searchFilters.location }),
            ...(searchFilters.minPrice && {
              minPrice: searchFilters.minPrice.toString(),
            }),
            ...(searchFilters.maxPrice && {
              maxPrice: searchFilters.maxPrice.toString(),
            }),
            ...(searchFilters.shippingAvailable !== undefined && {
              shippingAvailable: searchFilters.shippingAvailable.toString(),
            }),
            ...(searchFilters.sortBy && { sortBy: searchFilters.sortBy }),
          });

          const { data, error: searchError } = await api.get<{
            listings: ListingSearchResult[];
            total: number;
          }>(`/api/marketplace/listings/search?${params}`);

          if (searchError) {
            throw searchError;
          }

          if (data) {
            setResults(data.listings);
            setTotalResults(data.total);
            setCurrentPage(page);
          }
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Search failed. Please try again.'
        );
      }
    },
    [withLoading]
  );

  /**
   * Debounced search for query input
   */
  const debouncedSearch = useCallback(
    (searchFilters: SearchFilters) => {
      const debouncedFn = debounce(() => {
        executeSearch(searchFilters, 1);
      }, 500);
      debouncedFn();
    },
    [executeSearch]
  );

  /**
   * Handle query change
   */
  const handleQueryChange = (query: string) => {
    const newFilters = { ...filters, query };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | number | boolean
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    executeSearch(newFilters, 1);
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    const newFilters: SearchFilters = {};
    setFilters(newFilters);
    executeSearch(newFilters, 1);
  };

  /**
   * Initial search on mount
   */
  useEffect(() => {
    executeSearch(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  return (
    <div className='mx-auto max-w-7xl space-y-6 p-4'>
      {/* Search Header */}
      <div className='space-y-4'>
        <h1 className='text-3xl font-normal text-primary-500'>
          Marketplace Search
        </h1>

        {/* Search Bar */}
        <div className='flex gap-4'>
          <div className='flex-1'>
            <Input
              type='text'
              placeholder='Search for board games...'
              value={filters.query || ''}
              onChange={e => handleQueryChange(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button
            variant='secondary'
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className='card space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-normal text-primary-500'>Filters</h2>
              <Button
                variant='tertiary'
                size='sm'
                onClick={clearFilters}
                disabled={isLoading}
              >
                Clear All
              </Button>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {/* Condition Filter */}
              <div>
                <label htmlFor='condition' className='form-label'>
                  Condition
                </label>
                <Select
                  id='condition'
                  value={filters.condition || ''}
                  onChange={e =>
                    handleFilterChange('condition', e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value=''>All Conditions</option>
                  <option value='new'>New</option>
                  <option value='like_new'>Like New</option>
                  <option value='good'>Good</option>
                  <option value='acceptable'>Acceptable</option>
                  <option value='poor'>Poor</option>
                </Select>
              </div>

              {/* Location Filter */}
              <div>
                <label htmlFor='location' className='form-label'>
                  Location
                </label>
                <Select
                  id='location'
                  value={filters.location || ''}
                  onChange={e => handleFilterChange('location', e.target.value)}
                  disabled={isLoading}
                >
                  <option value=''>All Locations</option>
                  <option value='EST'>Estonia</option>
                  <option value='LVA'>Latvia</option>
                  <option value='LTU'>Lithuania</option>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label htmlFor='minPrice' className='form-label'>
                  Min Price (EUR)
                </label>
                <Input
                  id='minPrice'
                  type='number'
                  min='0'
                  step='0.01'
                  value={filters.minPrice || ''}
                  onChange={e =>
                    handleFilterChange('minPrice', Number(e.target.value))
                  }
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor='maxPrice' className='form-label'>
                  Max Price (EUR)
                </label>
                <Input
                  id='maxPrice'
                  type='number'
                  min='0'
                  step='0.01'
                  value={filters.maxPrice || ''}
                  onChange={e =>
                    handleFilterChange('maxPrice', Number(e.target.value))
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Sort and Shipping */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <label htmlFor='sortBy' className='form-label'>
                  Sort By
                </label>
                <Select
                  id='sortBy'
                  value={filters.sortBy || 'newest'}
                  onChange={e => handleFilterChange('sortBy', e.target.value)}
                  disabled={isLoading}
                >
                  <option value='newest'>Newest First</option>
                  <option value='price_asc'>Price: Low to High</option>
                  <option value='price_desc'>Price: High to Low</option>
                  <option value='name'>Name: A to Z</option>
                </Select>
              </div>

              <div className='flex items-end'>
                <label className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={filters.shippingAvailable || false}
                    onChange={e =>
                      handleFilterChange('shippingAvailable', e.target.checked)
                    }
                    disabled={isLoading}
                    className='h-4 w-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500'
                  />
                  <span className='text-regular'>Shipping available only</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className='flex items-center justify-between'>
          <p className='text-regular text-gray-600'>
            {totalResults} {totalResults === 1 ? 'listing' : 'listings'} found
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <p className='text-regular text-red-800'>{error}</p>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 ? (
        <>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {results.map(listing => (
              <Link
                key={listing.id}
                href={`/marketplace/listings/${listing.id}`}
                {...(onSelectListing && {
                  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    onSelectListing(listing.id);
                  },
                })}
                className='card group overflow-hidden transition-shadow hover:shadow-xl'
              >
                {/* Image */}
                <div className='relative aspect-square overflow-hidden bg-gray-100'>
                  <Image
                    src={listing.thumbnail || '/placeholder-game.jpg'}
                    alt={listing.gameName}
                    fill
                    className='object-cover transition-transform group-hover:scale-105'
                  />
                  {listing.shippingAvailable && (
                    <div className='absolute right-2 top-2 rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white'>
                      Shipping
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className='p-4'>
                  <h3 className='text-lg font-medium text-gray-900 line-clamp-2'>
                    {listing.gameName}
                  </h3>
                  <p className='mt-1 text-sm text-gray-600'>
                    {listing.condition.replace('_', ' ')}
                  </p>
                  <div className='mt-2 flex items-baseline gap-2'>
                    <span className='text-xl font-bold text-accent-500'>
                      €{listing.price.toFixed(2)}
                    </span>
                  </div>
                  <p className='mt-2 text-sm text-gray-500'>
                    {listing.location} • {listing.sellerName}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-2'>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => executeSearch(filters, currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </Button>
              <span className='text-regular'>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => executeSearch(filters, currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        !isLoading && (
          <div className='card py-12 text-center'>
            <p className='text-xl text-gray-600'>No listings found</p>
            <p className='mt-2 text-regular text-gray-500'>
              Try adjusting your search filters
            </p>
          </div>
        )
      )}

      {/* Loading Overlay */}
      <DiceLoader isVisible={isLoading} text={loadingMessage} variant='spin' />
    </div>
  );
}
