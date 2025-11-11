import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { PeriodRandomDaily } from '../lib/types';

interface UsePeriodRandomDailyResult {
  data: PeriodRandomDaily[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePeriodRandomDaily(periodId?: string | null): UsePeriodRandomDailyResult {
  const [data, setData] = useState<PeriodRandomDaily[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!periodId) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: rows, error: fetchError } = await supabase
        .from('vw_period_random_daily')
        .select('*')
        .eq('period_id', periodId)
        .order('date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setData(rows ?? []);
    } catch (err: any) {
      console.error('Error fetching period random expenses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
