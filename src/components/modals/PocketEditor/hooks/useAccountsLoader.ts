import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Account } from '../../../lib/types';

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
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('is_primary', { ascending: false });

      if (data) {
        setAccounts(data);
      }
      if (error) console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  return { accounts, loading };
}
