import { Pocket, PocketType, PocketSubtype, Account } from '../../lib/types';

export interface PocketEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: 'create' | 'edit';
  pocket?: Pocket;
}

export type FormStep = 'type' | 'subtype' | 'config';

export interface PocketFormState {
  // Comunes
  name: string;
  pocketType: PocketType;
  pocketSubtype: PocketSubtype | null;
  emoji: string;
  accountId: string;
  linkedAccountId: string;

  // SAVING
  targetAmount: string;
  frequency: 'monthly' | 'weekly' | 'none';
  allowWithdrawals: boolean;
  startsAt: string;
  endsAt: string;

  // EXPENSE.PERIOD
  allocatedAmount: string;

  // EXPENSE.RECURRENT
  averageAmount: string;
  lastPaymentAmount: string;
  notificationDaysBefore: number;
  recurrentDueDay: number;

  // EXPENSE.FIXED
  monthlyAmount: string;
  dueDay: number;
  autoRegister: boolean;

  // DEBT
  originalAmount: string;
  installmentsTotal: string;
  installmentAmount: string;
  interestRate: string;
  automaticPayment: boolean;
  debtDueDay: number;
}

export interface PocketFieldsProps {
  state: PocketFormState;
  setState: React.Dispatch<React.SetStateAction<PocketFormState>>;
  accounts: Account[];
}
