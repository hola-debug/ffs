import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Movement, MovementType } from '../lib/types';

interface UseMovementsOptions {
  type?: MovementType;
  pocketId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export function useMovements(options: UseMovementsOptions = {}) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      let query = supabase
        .from('movements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Aplicar filtros opcionales
      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.pocketId) {
        query = query.eq('pocket_id', options.pocketId);
      }

      if (options.startDate) {
        query = query.gte('date', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('date', options.endDate);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setMovements(data || []);
    } catch (err: any) {
      console.error('Error fetching movements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [options.type, options.pocketId, options.startDate, options.endDate, options.limit]);

  return {
    movements,
    loading,
    error,
    refetch: fetchMovements,
  };
}

// Hook especializado para gastos de hoy
export function useTodayExpenses() {
  const today = new Date().toISOString().split('T')[0];
  
  return useMovements({
    type: 'pocket_expense',
    startDate: today,
    endDate: today,
  });
}

// Hook especializado para gastos fijos del mes
export function useFixedExpensesThisMonth() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  return useMovements({
    type: 'fixed_expense',
    startDate: startOfMonth,
    endDate: endOfMonth,
  });
}
