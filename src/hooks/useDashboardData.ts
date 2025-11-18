import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Category,
  ActivePocketSummary,
  UserMonthlySummary,
} from '../lib/types';
import { useAccountsStore } from './useAccountsStore';

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pockets, setPockets] = useState<ActivePocketSummary[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<UserMonthlySummary | null>(null);
  const { accounts } = useAccountsStore();

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
        categoriesRes,
        pocketsRes,
      ] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
        supabase.from('pockets').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (pocketsRes.data) {
        console.log('[Dashboard] Pockets updated:', pocketsRes.data.length);
        setPockets(pocketsRes.data);
      } else {
        setPockets([]);
      }

      // TODO: Calculate monthly summary from movements if needed
      setMonthlySummary(null);

      // Trigger flash animation when data updates from realtime
      if (isRefresh) {
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 600);
      }

    } catch (err: any) {
      console.error('[Dashboard] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pockets' }, () => {
        console.log('[Dashboard] Pocket changed');
        fetchData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movements' }, () => {
        console.log('[Dashboard] Movement changed');
        fetchData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return {
    loading,
    isRefreshing,
    justUpdated,
    error,
    accounts,
    categories,
    pockets,
    expensePockets: pockets.filter(p => p.type === 'expense'),
    savingPockets: pockets.filter(p => p.type === 'saving'),
    monthlySummary,
    refetch: () => fetchData(true),
  };
}
