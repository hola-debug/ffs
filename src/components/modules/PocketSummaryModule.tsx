import { ActivePocketSummary } from '@/lib/types';
import {
  DebtPocketSummary,
  ExpensePocketSummary,
  SavingPocketSummary,
  FixedExpensePocketSummary,
} from './PocketSummary';

interface PocketSummaryModuleProps {
  pocket: ActivePocketSummary;
  pockets?: ActivePocketSummary[];
  onRefresh?: () => void;
  openModal?: (modalId: string, data?: { pocketId?: string }) => void;
}

export function PocketSummaryModule({ pocket, openModal }: PocketSummaryModuleProps) {
  if (pocket.type === 'expense') {
    // Check if it's a fixed expense pocket
    if (pocket.subtype === 'fixed') {
      return <FixedExpensePocketSummary pocket={pocket} openModal={openModal} />;
    }
    // For other expense types (period, recurrent, shared)
    return <ExpensePocketSummary pocket={pocket} openModal={openModal} />;
  }
  if (pocket.type === 'saving') {
    return <SavingPocketSummary pocket={pocket} openModal={openModal} />;
  }
  if (pocket.type === 'debt') {
    return <DebtPocketSummary pocket={pocket} openModal={openModal} />;
  }
  return null;
}

export default PocketSummaryModule;

