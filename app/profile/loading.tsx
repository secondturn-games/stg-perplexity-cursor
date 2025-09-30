/**
 * Profile Loading State
 * Loading UI for profile pages
 */

import DiceLoader from '@/components/ui/DiceLoader';

export default function ProfileLoading() {
  return (
    <DiceLoader isVisible={true} text='Loading profile...' variant='bounce' />
  );
}
