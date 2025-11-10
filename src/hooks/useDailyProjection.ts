import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DailyProjection } from '../lib/types';
import { subscribeToDashboardRefresh } from '../lib/dashboardEvents';

interface UseDailyProjectionResult {
  projections: DailyProjection[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDailyProjection(daysAhead: number = 4): UseDailyProjectionResult {
  const [projections, setProjections] = useState<DailyProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el user_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Llamar a la función RPC
      const { data, error: rpcError } = await supabase.rpc('get_daily_projection', {
        p_user_id: user.id,
        p_days_ahead: daysAhead,
      });

      if (rpcError) throw rpcError;

      // Transformar los datos
      const formattedData: DailyProjection[] = (data || []).map((item: any) => ({
        date: item.date,
        day_name: item.day_name,
        day_number: item.day_number,
        month_number: item.month_number,
        accumulated_balance: parseFloat(item.accumulated_balance),
      }));

      setProjections(formattedData);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching daily projection:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjections();
    const unsubscribeRefresh = subscribeToDashboardRefresh(() => fetchProjections());
    const intervalId = setInterval(() => fetchProjections(), 15000);

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('projection-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          console.log('Transaction changed, refetching projection...');
          fetchProjections();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'savings_moves' },
        () => {
          console.log('Savings move changed, refetching projection...');
          fetchProjections();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_plan' },
        () => {
          console.log('Monthly plan changed, refetching projection...');
          fetchProjections();
        }
      )
      .subscribe();

    // Cleanup al desmontar
    return () => {
      supabase.removeChannel(channel);
      unsubscribeRefresh();
      clearInterval(intervalId);
    };
  }, [daysAhead]);

  return { projections, loading, error, refetch: fetchProjections };
}
