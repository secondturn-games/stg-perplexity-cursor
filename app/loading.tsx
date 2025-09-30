/**
 * Root Loading State
 * Default loading UI for the entire application
 */

import DiceLoader from '@/components/ui/DiceLoader';

export default function Loading() {
  return <DiceLoader isVisible={true} text='Loading...' variant='roll' />;
}
