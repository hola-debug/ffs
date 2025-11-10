import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DailyExpensesAccumulated, DailyExpensesProjection } from '../lib/types';
import { subscribeToDashboardRefresh } from '../lib/dashboardEvents';

interface UseDailyExpensesAccumulatedResult {
  data: DailyExpensesAccumulated | null;
  projections: DailyExpensesProjection[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDailyExpensesAccumulated(daysAhead: number = 30): UseDailyExpensesAccumulatedResult {
  const [data, setData] = useState<DailyExpensesAccumulated | null>(null);
  const [projections, setProjections] = useState<DailyExpensesProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el user_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Obtener datos actuales de gastos acumulados
      const { data: viewData, error: viewError } = await supabase
        .from('vw_daily_expenses_accumulated')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (viewError && viewError.code !== 'PGRST116') { // PGRST116 = no rows
        throw viewError;
      }

      setData(viewData || null);

      // Obtener proyección de gastos futuros
      const { data: projectionData, error: projectionError } = await supabase.rpc(
        'get_daily_expenses_projection',
        {
          p_user_id: user.id,
          p_days_ahead: daysAhead,
        }
      );

      if (projectionError) throw projectionError;

      // Transformar los datos
      const formattedProjections: DailyExpensesProjection[] = (projectionData || []).map((item: any) => ({
        date: item.date,
        day_name: item.day_name,
        day_number: item.day_number,
        month_number: item.month_number,
        accumulated_expenses: parseFloat(item.accumulated_expenses),
        projected_daily_avg: parseFloat(item.projected_daily_avg),
      }));

      setProjections(formattedProjections);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching daily expenses accumulated:', err);
    } finally {
      setLoading(false);
    }
  }, [daysAhead]);

  useEffect(() => {
    fetchData();
    const unsubscribeRefresh = subscribeToDashboardRefresh(() => fetchData());
    const intervalId = setInterval(() => fetchData(), 15000);

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('expenses-accumulated-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          console.log('Transaction changed, refetching expenses accumulated...');
          fetchData();
        }
      )
      .subscribe();

    // Cleanup al desmontar
    return () => {
      supabase.removeChannel(channel);
      unsubscribeRefresh();
      clearInterval(intervalId);
    };
  }, [fetchData]);

  return { data, projections, loading, error, refetch: fetchData };
}
