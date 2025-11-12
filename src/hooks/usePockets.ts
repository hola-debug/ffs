import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ActivePocketSummary } from '../lib/types';

export function usePockets() {
  const [pockets, setPockets] = useState<ActivePocketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPockets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Obtener bolsas activas desde la vista
      const { data, error: fetchError } = await supabase
        .from('active_pockets_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPockets(data || []);
    } catch (err: any) {
      console.error('Error fetching pockets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPockets();
  }, []);

  return {
    pockets,
    expensePockets: pockets.filter(p => p.type === 'expense'),
    savingPockets: pockets.filter(p => p.type === 'saving'),
    loading,
    error,
    refetch: fetchPockets,
  };
}
