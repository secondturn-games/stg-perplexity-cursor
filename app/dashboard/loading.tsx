/**
 * Dashboard Loading State
 * Loading UI for dashboard pages
 */

import DiceLoader from '@/components/ui/DiceLoader';

export default function DashboardLoading() {
  return (
    <DiceLoader isVisible={true} text='Loading dashboard...' variant='spin' />
  );
}
