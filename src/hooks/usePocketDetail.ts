import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ActivePocketSummary, Movement } from '../lib/types';

interface PocketDetailData {
  pocket: ActivePocketSummary | null;
  movements: Movement[];
  stats: {
    totalSpent: number;
    totalAllocated: number;
    totalRemaining: number;
    percentageUsed: number;
    dailyAverage: number;
    daysElapsed: number;
    daysRemaining: number;
  } | null;
}

export function usePocketDetail(pocketId: string | undefined) {
  const [data, setData] = useState<PocketDetailData>({
    pocket: null,
    movements: [],
    stats: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPocketDetail = async () => {
    if (!pocketId) {
      setError('Pocket ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Obtener datos de la bolsa desde la vista
      const { data: pocketData, error: pocketError } = await supabase
        .from('active_pockets_summary')
        .select('*')
        .eq('id', pocketId)
        .eq('user_id', user.id)
        .single();

      if (pocketError) throw pocketError;

      // Obtener movimientos asociados a la bolsa
      const { data: movementsData, error: movementsError } = await supabase
        .from('movements')
        .select('*')
        .eq('pocket_id', pocketId)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (movementsError) throw movementsError;

      // Calcular estadísticas
      const totalSpent = pocketData.allocated_amount - pocketData.current_balance;
      const totalAllocated = pocketData.allocated_amount;
      const totalRemaining = pocketData.current_balance;
      const percentageUsed = (totalSpent / totalAllocated) * 100;

      const daysElapsed = pocketData.days_elapsed || 0;
      const daysRemaining = pocketData.days_remaining || 0;
      const dailyAverage = daysElapsed > 0 ? totalSpent / daysElapsed : 0;

      setData({
        pocket: pocketData,
        movements: movementsData || [],
        stats: {
          totalSpent,
          totalAllocated,
          totalRemaining,
          percentageUsed,
          dailyAverage,
          daysElapsed,
          daysRemaining,
        },
      });
    } catch (err: any) {
      console.error('Error fetching pocket detail:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPocketDetail();
  }, [pocketId]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchPocketDetail,
  };
}
