/**
 * Listing Detail Page
 * Display detailed information about a marketplace listing
 */

'use client';

import { useRouter } from 'next/navigation';
import { ListingDetail } from '@/components/marketplace';

export default function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  return (
    <ListingDetail
      listingId={params.id}
      onContactSeller={() => {
        router.push(`/messages/new?listing=${params.id}`);
      }}
      onEdit={() => {
        router.push(`/marketplace/listings/${params.id}/edit`);
      }}
    />
  );
}