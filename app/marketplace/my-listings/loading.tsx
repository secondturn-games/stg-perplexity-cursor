/**
 * My Listings Loading State
 * Loading UI for user's listings page
 */

import DiceLoader from '@/components/ui/DiceLoader';

export default function MyListingsLoading() {
  return (
    <DiceLoader
      isVisible={true}
      text='Loading your listings...'
      variant='bounce'
    />
  );
}
