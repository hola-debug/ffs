import { useState } from 'react';
import { PocketFormState } from '../../types';

type WizardStep = 'type' | 'subtype' | 'common' | 'details';

const initialState: PocketFormState = {
  name: '',
  pocketType: 'saving',
  pocketSubtype: null,
  emoji: 'wallet',
  accountId: '',
  linkedAccountId: '',
  currency: '',
  
  // SAVING
  targetAmount: '',
  frequency: 'none',
  allowWithdrawals: true,
  savingDateMode: 'days',
  savingDaysDuration: '',
  startsAt: new Date().toISOString().split('T')[0],
  endsAt: '',
  
  // EXPENSE.PERIOD
  allocatedAmount: '',
  periodDateMode: 'days',
  periodDaysDuration: '',
  
  // EXPENSE.RECURRENT
  averageAmount: '',
  lastPaymentAmount: '',
  notificationDaysBefore: 3,
  recurrentDueDay: 10,
  
  // EXPENSE.FIXED
  monthlyAmount: '',
  dueDay: 15,
  autoRegister: false,
  
  // DEBT
  originalAmount: '',
  debtInputMode: 'installments',
  installmentsTotal: '',
  installmentAmount: '',
  interestRate: '',
  automaticPayment: false,
  debtDueDay: 15,
};

export function useCreateWizard() {
  const [step, setStep] = useState<WizardStep>('type');
  const [state, setState] = useState<PocketFormState>(initialState);

  const goToStep = (newStep: WizardStep) => {
    setStep(newStep);
  };

  const nextStep = () => {
    if (step === 'type') {
      setStep(state.pocketType === 'expense' ? 'subtype' : 'common');
    } else if (step === 'subtype') {
      setStep('common');
    } else if (step === 'common') {
      setStep('details');
    }
  };

  const prevStep = () => {
    if (step === 'details') {
      setStep('common');
    } else if (step === 'common') {
      setStep(state.pocketType === 'expense' ? 'subtype' : 'type');
    } else if (step === 'subtype') {
      setStep('type');
    }
  };

  const reset = () => {
    setStep('type');
    setState(initialState);
  };

  return { step, state, setState, nextStep, prevStep, reset, goToStep };
}
