import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Pocket, Account } from '../../../lib/types';
import { PocketFormState } from '../types';

export function usePocketSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (state: PocketFormState): string | null => {
    if (!state.name.trim()) return 'Ingresa el nombre de la bolsa';
    if (!state.accountId) return 'Selecciona una cuenta válida';

    if (state.pocketType === 'saving' && !state.targetAmount) {
      return 'Ingresa el monto objetivo';
    }

    if (state.pocketType === 'expense' && state.pocketSubtype === 'period') {
      if (!state.allocatedAmount || !state.endsAt) return 'Completa monto y período';
    }

    if (state.pocketType === 'expense' && state.pocketSubtype === 'recurrent') {
      if (!state.averageAmount || !state.recurrentDueDay) return 'Completa monto promedio y día de vencimiento';
    }

    if (state.pocketType === 'expense' && state.pocketSubtype === 'fixed') {
      if (!state.monthlyAmount || !state.dueDay) return 'Completa monto y día de vencimiento';
    }

    if (state.pocketType === 'debt') {
      if (!state.originalAmount || !state.installmentsTotal) return 'Completa monto e instalaciones';
    }

    return null;
  };

  const buildPocketData = (state: PocketFormState, accounts: Account[], userId: string) => {
    const selectedAccount = accounts.find((a) => a.id === state.accountId);
    if (!selectedAccount) throw new Error('Selecciona una cuenta válida');

    const pocketData: any = {
      user_id: userId,
      name: state.name,
      type: state.pocketType,
      emoji: state.emoji,
      account_id: state.accountId,
      currency: selectedAccount.currency || 'ARS',
      status: 'active',
    };

    if (state.pocketType === 'expense') {
      pocketData.subtype = state.pocketSubtype;
    }

    if (state.linkedAccountId) {
      pocketData.linked_account_id = state.linkedAccountId;
    }

    if (state.pocketType === 'saving') {
      pocketData.target_amount = parseFloat(state.targetAmount);
      pocketData.amount_saved = 0;
      pocketData.frequency = state.frequency;
      pocketData.allow_withdrawals = state.allowWithdrawals;
      pocketData.starts_at = state.startsAt;
      if (state.endsAt) pocketData.ends_at = state.endsAt;
    }

    if (state.pocketType === 'expense' && state.pocketSubtype === 'period') {
      pocketData.allocated_amount = parseFloat(state.allocatedAmount);
      pocketData.spent_amount = 0;
      pocketData.starts_at = state.startsAt;
      pocketData.ends_at = state.endsAt;
    }

    if (state.pocketType === 'expense' && state.pocketSubtype === 'recurrent') {
      pocketData.average_amount = parseFloat(state.averageAmount);
      pocketData.spent_amount = 0;
      pocketData.due_day = state.recurrentDueDay;
      pocketData.notification_days_before = state.notificationDaysBefore;
      if (state.lastPaymentAmount) pocketData.last_payment_amount = parseFloat(state.lastPaymentAmount);
    }

    if (state.pocketType === 'expense' && state.pocketSubtype === 'fixed') {
      pocketData.monthly_amount = parseFloat(state.monthlyAmount);
      pocketData.due_day = state.dueDay;
      pocketData.auto_register = state.autoRegister;
    }

    if (state.pocketType === 'debt') {
      pocketData.original_amount = parseFloat(state.originalAmount);
      pocketData.remaining_amount = parseFloat(state.originalAmount);
      pocketData.installments_total = parseInt(state.installmentsTotal);
      pocketData.installment_current = 0;
      if (state.installmentAmount) pocketData.installment_amount = parseFloat(state.installmentAmount);
      if (state.interestRate) pocketData.interest_rate = parseFloat(state.interestRate);
      pocketData.due_day = state.debtDueDay;
      pocketData.automatic_payment = state.automaticPayment;
    }

    return pocketData;
  };

  const submit = async (
    state: PocketFormState,
    accounts: Account[],
    mode: 'create' | 'edit',
    pocket?: Pocket,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const validationError = validateForm(state);
      if (validationError) throw new Error(validationError);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const pocketData = buildPocketData(state, accounts, user.id);

      if (mode === 'create') {
        const { error: insertError } = await supabase.from('pockets').insert(pocketData);
        if (insertError) throw insertError;
      } else if (mode === 'edit' && pocket) {
        const { error: updateError } = await supabase
          .from('pockets')
          .update(pocketData)
          .eq('id', pocket.id);
        if (updateError) throw updateError;
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error, setError };
}
