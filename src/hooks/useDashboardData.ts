import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { subscribeToDashboardRefresh } from '../lib/dashboardEvents';
import {
  Account,
  Category,
  Period,
} from '../lib/types';

export function useDashboardData() {
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Obtener el usuario autenticado actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      setUserId(user.id);

      const [
        accountsRes,
        categoriesRes,
        periodsRes,
      ] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', user.id).order('is_primary', { ascending: false }),
        supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
        supabase.from('periods').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (periodsRes.data) {
        console.log('[Dashboard] Periods updated:', periodsRes.data.map(p => ({
          name: p.name,
          spent: p.spent_amount,
          remaining: p.remaining_amount
        })));
        setPeriods(periodsRes.data);
      } else {
        setPeriods([]);
      }

      // Trigger flash animation when data updates from realtime
      if (isRefresh) {
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 600);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Solo escuchar el evento de refresh global, no crear canales duplicados
    const unsubscribeRefresh = subscribeToDashboardRefresh(() => {
      console.log('[Dashboard] Refresh event received');
      fetchData(true);
    });

    return () => {
      unsubscribeRefresh();
    };
  }, [fetchData]);

  return {
    loading,
    isRefreshing,
    justUpdated,
    error,
    accounts,
    categories,
    periods,
    refetch: () => fetchData(true),
  };
}
