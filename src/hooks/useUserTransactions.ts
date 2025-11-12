import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Account, Category, Transaction } from '../lib/types';
import { subscribeToDashboardRefresh } from '../lib/dashboardEvents';

export interface UserTransaction extends Transaction {
  account?: Account;
  category?: Category;
}

interface UseUserTransactionsResult {
  transactions: UserTransaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserTransactions(): UseUserTransactionsResult {
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(
          `
            *,
            category:categories(*),
            account:accounts(*)
          `
        )
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const unsubscribeRefresh = subscribeToDashboardRefresh(() => fetchTransactions());

    const channel = supabase
      .channel('user-transactions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      unsubscribeRefresh();
    };
  }, []);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}
