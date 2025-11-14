import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Account } from '@/lib/types';

export function useAccountsLoader(isOpen: boolean) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('No user logged in');

      // Cargar cuentas simples (sin is_primary en accounts)
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching accounts:', error);
        return;
      }

      if (data) {
        setAccounts(data);
      }
    } catch (err) {
      console.error('Error in fetchAccounts:', err);
    } finally {
      setLoading(false);
    }
  };

  return { accounts, loading };
}
