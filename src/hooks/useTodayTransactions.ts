import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Transaction, Category, Account } from '../lib/types';
import { subscribeToDashboardRefresh } from '../lib/dashboardEvents';

export interface TodayTransaction extends Transaction {
  category?: Category;
  account?: Account;
}

interface UseTodayTransactionsResult {
  transactions: TodayTransaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTodayTransactions(): UseTodayTransactionsResult {
  const [transactions, setTransactions] = useState<TodayTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el user_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Obtener la fecha de hoy en formato YYYY-MM-DD en zona horaria local
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Buscar transacciones del día de tipo expense
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*),
          account:accounts(*)
        `)
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', todayStr)
        .lt('date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      setTransactions(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching today transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const unsubscribeRefresh = subscribeToDashboardRefresh(() => fetchTransactions());
    const intervalId = setInterval(() => fetchTransactions(), 15000);

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('today-transactions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          console.log('Transaction changed, refetching today transactions...');
          fetchTransactions();
        }
      )
      .subscribe();

    // Cleanup al desmontar
    return () => {
      supabase.removeChannel(channel);
      unsubscribeRefresh();
      clearInterval(intervalId);
    };
  }, []);

  return { transactions, loading, error, refetch: fetchTransactions };
}
