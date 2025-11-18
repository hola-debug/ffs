import { useState, useEffect } from 'react';
import { Pocket } from '@/lib/types';
import {
  isSavingPocket,
  isExpensePeriodPocket,
  isExpenseRecurrentPocket,
  isExpenseFixedPocket,
  isDebtPocket,
} from '@/lib/types';
import { PocketFormState } from '../../types';

export function useEditForm(pocket: Pocket | undefined) {
  const [state, setState] = useState<PocketFormState>({
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
  });

  useEffect(() => {
    if (pocket) {
      // Detectar modo de entrada para EXPENSE.PERIOD y SAVING
      // Si ya tiene days_duration en BD, usar modo 'days', sino 'dates'
      const periodDateMode = isExpensePeriodPocket(pocket) && pocket.days_duration ? 'days' : 'dates';
      const savingDateMode = isSavingPocket(pocket) && pocket.days_duration ? 'days' : 'dates';
      
      // Detectar modo de entrada para DEBT
      // Si tiene installments_total, usar modo 'installments', sino 'amount'
      const debtInputMode = isDebtPocket(pocket) && pocket.installments_total ? 'installments' : 'amount';

      const newState: PocketFormState = {
        name: pocket.name || '',
        pocketType: pocket.type || 'saving',
        pocketSubtype: pocket.subtype || null,
        emoji: pocket.emoji || 'wallet',
        accountId: pocket.account_id || '',
        linkedAccountId: pocket.linked_account_id || '',
        currency: pocket.currency || '',

        // SAVING
        targetAmount: isSavingPocket(pocket) ? pocket.target_amount : '',
        frequency: isSavingPocket(pocket) ? pocket.frequency || 'none' : 'none',
        allowWithdrawals: isSavingPocket(pocket) ? pocket.allow_withdrawals !== false : true,
        savingDateMode,
        savingDaysDuration: isSavingPocket(pocket) && pocket.days_duration ? String(pocket.days_duration) : '',
        startsAt: pocket.starts_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        endsAt: pocket.ends_at?.split('T')[0] || '',

        // EXPENSE.PERIOD
        allocatedAmount: isExpensePeriodPocket(pocket) ? pocket.allocated_amount : '',
        periodDateMode,
        periodDaysDuration: isExpensePeriodPocket(pocket) && pocket.days_duration ? String(pocket.days_duration) : '',

        // EXPENSE.RECURRENT
        averageAmount: isExpenseRecurrentPocket(pocket) ? pocket.average_amount : '',
        lastPaymentAmount: isExpenseRecurrentPocket(pocket) ? pocket.last_payment_amount : '',
        notificationDaysBefore: isExpenseRecurrentPocket(pocket) ? pocket.notification_days_before : 3,
        recurrentDueDay: isExpenseRecurrentPocket(pocket) ? pocket.due_day : 10,

        // EXPENSE.FIXED
        monthlyAmount: isExpenseFixedPocket(pocket) ? pocket.monthly_amount : '',
        dueDay: isExpenseFixedPocket(pocket) ? pocket.due_day : 15,
        autoRegister: isExpenseFixedPocket(pocket) ? pocket.auto_register : false,

        // DEBT
        originalAmount: isDebtPocket(pocket) ? pocket.original_amount : '',
        debtInputMode,
        installmentsTotal: isDebtPocket(pocket) && pocket.installments_total ? String(pocket.installments_total) : '',
        installmentAmount: isDebtPocket(pocket) && pocket.installment_amount ? String(pocket.installment_amount) : '',
        interestRate: isDebtPocket(pocket) && pocket.interest_rate ? String(pocket.interest_rate) : '',
        automaticPayment: isDebtPocket(pocket) ? pocket.automatic_payment : false,
        debtDueDay: isDebtPocket(pocket) && pocket.due_day ? pocket.due_day : 15,
      };

      setState(newState);
    }
  }, [pocket]);

  return { state, setState };
}
