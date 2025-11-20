import { ActivePocketSummary } from '@/lib/types';
import {
  DebtPocketSummary,
  ExpensePocketSummary,
  SavingPocketSummary,
} from './PocketSummary';

interface PocketSummaryModuleProps {
  pocket: ActivePocketSummary;
  pockets?: ActivePocketSummary[];
  onRefresh?: () => void;
}

export function PocketSummaryModule({ pocket }: PocketSummaryModuleProps) {
  if (pocket.type === 'expense') {
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
