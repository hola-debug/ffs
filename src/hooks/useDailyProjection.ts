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

export function useDailyProjection(daysAhead: number = 4, periodId?: string): UseDailyProjectionResult {
  const [projections, setProjections] = useState<DailyProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjections = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!periodId) {
        setProjections([]);
        setLoading(false);
        return;
      }

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Get period data
      const { data: period, error: periodError } = await supabase
        .from('periods')
        .select('*')
        .eq('id', periodId)
        .single();

      if (periodError) throw periodError;
      if (!period) {
        setProjections([]);
        setLoading(false);
        return;
      }

      // Get transactions for this period
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('amount, date, type')
        .eq('period_id', periodId)
        .eq('scope', 'period');

      if (txError) throw txError;

      // Calculate projections
      const today = new Date();
      const startsAt = new Date(period.starts_at);
      const dailyAmount = Number(period.daily_amount) || 0;
      const spentAmount = Number(period.spent_amount) || 0;
      
      // Calculate current accumulated balance
      const daysPassed = Math.max(1, Math.ceil((today.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const currentAccumulated = (dailyAmount * daysPassed) - spentAmount;

      // Generate projections
      const projectionsList: DailyProjection[] = [];
      
      for (let i = 0; i <= daysAhead; i++) {
        const projDate = new Date(today);
        projDate.setDate(today.getDate() + i);
        
        const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
        const dayName = dayNames[projDate.getDay()];
        
        // Accumulated balance = current + (daily_amount * days_ahead)
        const accumulatedBalance = Number(currentAccumulated) + (Number(dailyAmount) * i);
        
        projectionsList.push({
          date: projDate.toISOString().split('T')[0],
          day_name: dayName,
          day_number: projDate.getDate(),
          month_number: projDate.getMonth() + 1,
          accumulated_balance: accumulatedBalance,
        });
      }

      setProjections(projectionsList);
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

    // Subscribe to realtime changes
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
        { event: '*', schema: 'public', table: 'periods' },
        () => {
          console.log('Period changed, refetching projection...');
          fetchProjections();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
      unsubscribeRefresh();
      clearInterval(intervalId);
    };
  }, [daysAhead, periodId]);

  return { projections, loading, error, refetch: fetchProjections };
}
