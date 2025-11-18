import { Pocket, PocketType, PocketSubtype, Account, CurrencyCode } from '@/lib/types';

export interface PocketEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: 'create' | 'edit';
  pocket?: Pocket;
}

export type FormStep = 'type' | 'subtype' | 'common' | 'details';

export type DateInputMode = 'days' | 'dates';
export type DebtInputMode = 'installments' | 'amount';

export interface PocketFormState {
  // Comunes
  name: string;
  pocketType: PocketType;
  pocketSubtype: PocketSubtype | null;
  emoji: string;
  accountId: string;
  linkedAccountId: string;
  currency: CurrencyCode | '';

  // SAVING
  targetAmount: string;
  frequency: 'monthly' | 'weekly' | 'none';
  allowWithdrawals: boolean;
  savingDateMode: DateInputMode; // 'days' o 'dates'
  savingDaysDuration: string;    // Cantidad de días
  startsAt: string;
  endsAt: string;

  // EXPENSE.PERIOD
  allocatedAmount: string;
  periodDateMode: DateInputMode; // 'days' o 'dates'
  periodDaysDuration: string;    // Cantidad de días

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
  debtInputMode: DebtInputMode;  // 'installments' o 'amount'
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
