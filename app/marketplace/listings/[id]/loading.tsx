/**
 * Listing Detail Loading State
 * Loading UI for individual listing pages
 */

import DiceLoader from '@/components/ui/DiceLoader';

export default function ListingDetailLoading() {
  return (
    <DiceLoader
      isVisible={true}
      text='Loading listing details...'
      variant='bounce'
    />
  );
}
