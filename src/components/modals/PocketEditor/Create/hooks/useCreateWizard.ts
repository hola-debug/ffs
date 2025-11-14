import { useState } from 'react';
import { PocketFormState } from '../../types';

type WizardStep = 'type' | 'subtype' | 'config';

const initialState: PocketFormState = {
  name: '',
  pocketType: 'saving',
  pocketSubtype: null,
  emoji: '💰',
  accountId: '',
  linkedAccountId: '',
  targetAmount: '',
  frequency: 'monthly',
  allowWithdrawals: true,
  startsAt: new Date().toISOString().split('T')[0],
  endsAt: '',
  allocatedAmount: '',
  averageAmount: '',
  lastPaymentAmount: '',
  notificationDaysBefore: 3,
  recurrentDueDay: 10,
  monthlyAmount: '',
  dueDay: 15,
  autoRegister: false,
  originalAmount: '',
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
      setStep(state.pocketType === 'expense' ? 'subtype' : 'config');
    } else if (step === 'subtype') {
      setStep('config');
    }
  };

  const prevStep = () => {
    if (step === 'config') {
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
