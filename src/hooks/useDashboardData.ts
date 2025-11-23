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

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfMonthStr = startOfMonth.toISOString();

      const [
        categoriesRes,
        pocketsRes,
        movementsRes
      ] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
        supabase.from('pockets' as any).select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }),
        supabase
          .from('movements' as any)
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startOfMonthStr)
          .eq('type', 'saving_deposit')
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data as any);
      
      if (pocketsRes.data) {
        console.log('[Dashboard] Pockets updated:', pocketsRes.data.length);
        
        const processedPockets = pocketsRes.data.map((pocket: any) => {
          // Calcular contribución del periodo actual
          const periodMovements = (movementsRes.data as any[])?.filter((m: any) => m.pocket_id === pocket.id) || [];
          const currentPeriodContribution = periodMovements.reduce((sum: number, m: any) => sum + Number(m.amount), 0);
          
          // Calcular contribución recomendada
          let recommendedContribution = 0;
          if (pocket.type === 'saving' && pocket.target_amount && pocket.ends_at) {
            const target = Number(pocket.target_amount);
            const saved = Number(pocket.amount_saved || 0); // Asumiendo que amount_saved viene de BD o deberíamos recalcularlo?
            // Por ahora confiamos en BD, si no, habría que sumar TODOS los movimientos históricos
            
            const remaining = Math.max(0, target - saved);
            const today = new Date();
            const endDate = new Date(pocket.ends_at);
            
            // Diferencia en meses
            const monthsDiff = (endDate.getFullYear() - today.getFullYear()) * 12 + (endDate.getMonth() - today.getMonth());
            const monthsLeft = Math.max(1, monthsDiff); // Al menos 1 mes para evitar división por 0
            
            recommendedContribution = remaining / monthsLeft;
          }

          return {
            ...pocket,
            current_period_contribution: currentPeriodContribution,
            recommended_contribution: recommendedContribution,
          };
        });

        setPockets(processedPockets);
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
