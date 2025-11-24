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
}

export function PocketSummaryModule({ pocket }: PocketSummaryModuleProps) {
  if (pocket.type === 'expense') {
    // Check if it's a fixed expense pocket
    if (pocket.subtype === 'fixed') {
      return <FixedExpensePocketSummary pocket={pocket} />;
    }
    // For other expense types (period, recurrent, shared)
    return <ExpensePocketSummary pocket={pocket} />;
  }
  if (pocket.type === 'saving') {
    return <SavingPocketSummary pocket={pocket} />;
  }
  if (pocket.type === 'debt') {
    return <DebtPocketSummary pocket={pocket} />;
  }
  return null;
}

export default PocketSummaryModule;

