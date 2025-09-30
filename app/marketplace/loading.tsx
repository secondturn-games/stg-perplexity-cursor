/**
 * Marketplace Loading State
 * Loading UI for marketplace pages
 */

import DiceLoader from '@/components/ui/DiceLoader';

export default function MarketplaceLoading() {
  return (
    <DiceLoader isVisible={true} text='Loading marketplace...' variant='spin' />
  );
}
