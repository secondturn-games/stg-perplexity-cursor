/**
 * New Listing Loading State
 * Loading UI for creating new listings
 */

import DiceLoader from '@/components/ui/DiceLoader';

export default function NewListingLoading() {
  return (
    <DiceLoader isVisible={true} text='Preparing form...' variant='roll' />
  );
}
