import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserMonthlySummary } from '../lib/types';

export function useMonthlySummary() {
  const [summary, setSummary] = useState<UserMonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Obtener movimientos del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: movements, error: fetchError } = await supabase
        .from('movements')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (fetchError) throw fetchError;

      // Calcular resumen desde movimientos
      if (movements && movements.length > 0) {
        const summary: UserMonthlySummary = {
          user_id: user.id,
          total_income: 0,
          total_expenses: 0,
          total_savings: 0,
          balance: 0,
        };

        movements.forEach((movement: any) => {
          if (movement.type === 'income') {
            summary.total_income += movement.amount;
          } else if (
            movement.type === 'fixed_expense' ||
            movement.type === 'pocket_expense' ||
            movement.type === 'debt_payment' ||
            movement.type === 'fixed_expense_auto'
          ) {
            summary.total_expenses += movement.amount;
          } else if (movement.type === 'saving_deposit') {
            summary.total_savings += movement.amount;
          }
        });

        summary.balance = summary.total_income - summary.total_expenses - summary.total_savings;
        setSummary(summary);
      } else {
        setSummary({
          user_id: user.id,
          total_income: 0,
          total_expenses: 0,
          total_savings: 0,
          balance: 0,
        });
      }
    } catch (err: any) {
      console.error('Error fetching monthly summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
