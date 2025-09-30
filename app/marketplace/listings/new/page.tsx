/**
 * Create New Listing Page
 * Page for creating new marketplace listings
 */

'use client';

import { useRouter } from 'next/navigation';
import { ListingForm } from '@/components/marketplace';

export default function NewListingPage() {
  const router = useRouter();

  return (
    <div className='mx-auto max-w-4xl p-4'>
      <div className='mb-6 space-y-2'>
        <h1 className='text-3xl font-normal text-primary-500'>
          Create New Listing
        </h1>
        <p className='text-regular text-gray-600'>
          List your board game for sale in the Baltic marketplace
        </p>
      </div>

      <ListingForm
        onSuccess={data => {
          router.push(`/marketplace/listings/${data.id}`);
        }}
        onCancel={() => {
          router.push('/marketplace');
        }}
      />
    </div>
  );
}