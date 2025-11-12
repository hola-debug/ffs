import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserMonthlySummary } from '../lib/types';

export function useMonthlySummary() {
  const [summary, setSummary] = useState<UserMonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Obtener resumen desde la vista
      const { data, error: fetchError } = await supabase
        .from('user_monthly_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setSummary(data);
    } catch (err: any) {
      console.error('Error fetching monthly summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
