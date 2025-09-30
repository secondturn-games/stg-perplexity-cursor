/**
 * Authentication Loading State
 * Loading UI for authentication pages
 */

import DiceLoader from '@/components/ui/DiceLoader';

export default function AuthLoading() {
  return (
    <DiceLoader
      isVisible={true}
      text='Loading authentication...'
      variant='bounce'
    />
  );
}
