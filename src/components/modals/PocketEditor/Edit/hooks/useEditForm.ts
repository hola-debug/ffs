import { useState, useEffect } from 'react';
import { Pocket } from '../../../../lib/types';
import {
  isSavingPocket,
  isExpensePeriodPocket,
  isExpenseRecurrentPocket,
  isExpenseFixedPocket,
  isDebtPocket,
} from '../../../../lib/types';
import { PocketFormState } from '../../types';

export function useEditForm(pocket: Pocket | undefined) {
  const [state, setState] = useState<PocketFormState>({
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
  });

  useEffect(() => {
    if (pocket) {
      const newState: PocketFormState = {
        name: pocket.name || '',
        pocketType: pocket.type || 'saving',
        pocketSubtype: pocket.subtype || null,
        emoji: pocket.emoji || '💰',
        accountId: pocket.account_id || '',
        linkedAccountId: pocket.linked_account_id || '',

        targetAmount: isSavingPocket(pocket) ? pocket.target_amount : '',
        frequency: isSavingPocket(pocket) ? pocket.frequency : 'monthly',
        allowWithdrawals: isSavingPocket(pocket) ? pocket.allow_withdrawals !== false : true,
        startsAt: pocket.starts_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        endsAt: pocket.ends_at?.split('T')[0] || '',

        allocatedAmount: isExpensePeriodPocket(pocket) ? pocket.allocated_amount : '',

        averageAmount: isExpenseRecurrentPocket(pocket) ? pocket.average_amount : '',
        lastPaymentAmount: isExpenseRecurrentPocket(pocket) ? pocket.last_payment_amount : '',
        notificationDaysBefore: isExpenseRecurrentPocket(pocket) ? pocket.notification_days_before : 3,
        recurrentDueDay: isExpenseRecurrentPocket(pocket) ? pocket.due_day : 10,

        monthlyAmount: isExpenseFixedPocket(pocket) ? pocket.monthly_amount : '',
        dueDay: isExpenseFixedPocket(pocket) ? pocket.due_day : 15,
        autoRegister: isExpenseFixedPocket(pocket) ? pocket.auto_register : false,

        originalAmount: isDebtPocket(pocket) ? pocket.original_amount : '',
        installmentsTotal: isDebtPocket(pocket) ? pocket.installments_total : '',
        installmentAmount: isDebtPocket(pocket) ? pocket.installment_amount : '',
        interestRate: isDebtPocket(pocket) ? pocket.interest_rate : '',
        automaticPayment: isDebtPocket(pocket) ? pocket.automatic_payment : false,
        debtDueDay: isDebtPocket(pocket) ? pocket.due_day : 15,
      };

      setState(newState);
    }
  }, [pocket]);

  return { state, setState };
}
