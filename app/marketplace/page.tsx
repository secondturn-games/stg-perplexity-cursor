/**
 * Marketplace Main Page
 * Browse and search marketplace listings
 */

import { MarketplaceSearch } from '@/components/marketplace';

export const metadata = {
  title: 'Marketplace - Second Turn Games',
  description:
    'Browse board game listings in the Baltic region. Find great deals on new and used games.',
};

export default function MarketplacePage() {
  return (
    <div>
      <MarketplaceSearch />
    </div>
  );
}
