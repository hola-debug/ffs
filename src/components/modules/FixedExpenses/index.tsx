import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Account, Category } from '../../../lib/types';
import CountUp from '../../ui/CountUp';

interface FixedExpensesModuleProps {
  accounts: Account[];
  categories: Category[];
  onRefresh: () => void;
}

interface FixedExpense {
  id: string;
  amount: number;
  description: string | null;
  category_name: string | null;
  date: string;
}

interface DailyExpenseGroup {
  date: string;
  total: number;
  count: number;
}

export function FixedExpensesModule({
  accounts: _accounts,
  categories: _categories,
  onRefresh
}: FixedExpensesModuleProps) {
  const [monthTotal, setMonthTotal] = useState(0);
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const monthTotalRef = useRef(Math.round(0));
  const dailyTotalsRef = useRef<Record<string, number>>({});

  const groupedExpenses = useMemo(() => {
    const map: Record<string, DailyExpenseGroup> = {};
    expenses.forEach((expense) => {
      const existing = map[expense.date];
      if (existing) {
        existing.total += expense.amount;
        existing.count += 1;
      } else {
        map[expense.date] = {
          date: expense.date,
          total: expense.amount,
          count: 1
        };
      }
    });
    const groups = Object.values(map);
    groups.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    return groups;
  }, [expenses]);

  const groupedWithPrevious = useMemo(
    () =>
      groupedExpenses.map((group) => ({
        ...group,
        roundedTotal: Math.round(group.total),
        previousRoundedTotal: dailyTotalsRef.current[group.date] ?? Math.round(group.total)
      })),
    [groupedExpenses]
  );

  useEffect(() => {
    const nextTotals: Record<string, number> = {};
    groupedExpenses.forEach((group) => {
      nextTotals[group.date] = Math.round(group.total);
    });
    dailyTotalsRef.current = nextTotals;
  }, [groupedExpenses]);

  useEffect(() => {
    monthTotalRef.current = Math.round(monthTotal);
  }, [monthTotal]);

  // Fetch fixed expenses for current month
  const fetchFixedExpenses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get first and last day of current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('movements')
        .select(`
          id,
          amount,
          description,
          date,
          category_id,
          categories (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('type', 'fixed_expense')
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedExpenses = data?.map((exp: any) => ({
        id: exp.id,
        amount: exp.amount,
        description: exp.description,
        category_name: exp.categories?.name || null,
        date: exp.date,
      })) || [];

      setExpenses(formattedExpenses);
      
      const total = data?.reduce((sum, t) => sum + t.amount, 0) ?? 0;
      setMonthTotal(total);
    } catch (err) {
      console.error('Error fetching fixed expenses:', err);
      setMonthTotal(0);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixedExpenses();

    // Subscribe to new fixed expenses in realtime
    const channel = supabase
      .channel('fixed-expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'movements',
          filter: 'type=eq.fixed_expense',
        },
        (payload) => {
          console.log('Fixed expense change detected:', payload);
          fetchFixedExpenses();
          onRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);

  const hasExpenses = expenses.length > 0;
  const shouldShowLoader = loading && !hasExpenses;

  return (
    <div className="bg-black rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white font-sans relative w-full overflow-x-hidden h-[269px]">
      {/* Header */}
      <div className="flex items-center mb-4 sm:mb-6 justify-center gap-2">
        <h2 className="text-[10px] sm:text-xs uppercase text-[#ffffff] font-regular text-center">
          GASTOS FIJOS DEL MES
        </h2>
      </div>

      {/* Main Amount */}
      {shouldShowLoader ? (
        <div className="flex flex-col items-center justify-center h-[180px]">
          <p className="text-xs opacity-70">Cargando...</p>
        </div>
      ) : !hasExpenses ? (
        <div className="flex flex-col items-center justify-center h-[180px]">
          <p className="text-xs opacity-70">No hay gastos fijos</p>
          <p className="text-[9px] opacity-50 mt-2">Este mes no hay gastos fijos registrados</p>
        </div>
      ) : (
        <>
          <div className="mb-4 sm:mb-5">
            <div className="flex items-baseline justify-between mb-2 sm:mb-3">
              <div className="flex items-baseline">
                <span className="text-[19px] font-bold">$</span>
                <CountUp
                  to={Math.round(monthTotal)}
                  from={monthTotalRef.current}
                  duration={0.8}
                  separator="."
                  startWhen={!loading}
                  className="text-[39px] font-bold leading-none text-center tracking-tighter"
                />
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="relative">
            <div className="max-h-[110px] overflow-y-auto pr-2 space-y-2">
              {groupedWithPrevious.map((group) => {
                const expDate = new Date(`${group.date}T00:00:00`);
                const dayNum = expDate.getDate();
                const monthNum = expDate.getMonth() + 1;

                return (
                  <div key={group.date} className="flex justify-between items-center py-1">
                    <span className="text-[10px] sm:text-xs tracking-wide font-medium">
                      {dayNum}/{monthNum}
                    </span>
                    <CountUp
                      to={group.roundedTotal}
                      from={group.previousRoundedTotal}
                      duration={0.6}
                      separator="."
                      startWhen={!loading}
                      className="text-sm sm:text-base font-semibold tabular-nums"
                    />
                  </div>
                );
              })}
            </div>
            <div
              className="absolute inset-x-0 top-0 h-[60px] pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.95), transparent)'
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-[80px] pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)'
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
