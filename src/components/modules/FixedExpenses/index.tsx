import { useEffect, useState } from 'react';
import { BaseCard } from '../BaseCard';
import { supabase } from '../../../lib/supabaseClient';
import { Account, Category } from '../../../lib/types';
import AnimatedList from '../../ui/AnimatedList';

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
  accounts, 
  categories, 
  onRefresh 
}: FixedExpensesModuleProps) {
  const [monthTotal, setMonthTotal] = useState(0);
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="bg-black rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white font-sans relative w-full overflow-x-hidden h-[269px]">
      {/* Header */}
      <div className="flex items-center mb-4 sm:mb-6 justify-center gap-2">
        <h2 className="text-[10px] sm:text-xs uppercase text-[#ffffff] font-regular text-center">
          GASTOS FIJOS DEL MES
        </h2>
      </div>

      {/* Main Amount */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[180px]">
          <p className="text-xs opacity-70">Cargando...</p>
        </div>
      ) : expenses.length === 0 ? (
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
                <span className="text-[39px] font-bold leading-none text-center tracking-tighter">
                  {Math.round(monthTotal).toLocaleString('es-UY')}
                </span>
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="relative">
            <AnimatedList<DailyExpenseGroup>
              items={(() => {
                // Group expenses by date
                const grouped = expenses.reduce((acc, expense) => {
                  const existing = acc.find(g => g.date === expense.date);
                  if (existing) {
                    existing.total += expense.amount;
                    existing.count += 1;
                  } else {
                    acc.push({
                      date: expense.date,
                      total: expense.amount,
                      count: 1
                    });
                  }
                  return acc;
                }, [] as DailyExpenseGroup[]);
                return grouped;
              })()}
              onItemSelect={(item, index) => console.log(item, index)}
              showGradients={true}
              enableArrowNavigation={true}
              displayScrollbar={false}
              className="w-full"
              maxHeight="110px"
              gradientColor="#000000"
              renderItem={(group, index, isSelected) => {
                const expDate = new Date(group.date + 'T00:00:00');
                const dayNum = expDate.getDate();
                const monthNum = expDate.getMonth() + 1;
                
                return (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[10px] sm:text-xs tracking-wide font-medium">
                      {dayNum}/{monthNum}
                    </span>
                    <span className="text-sm sm:text-base font-semibold tabular-nums">
                      {Math.round(Number(group.total) || 0).toLocaleString('es-UY', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
