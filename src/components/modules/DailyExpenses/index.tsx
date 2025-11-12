import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import CountUp from '../../ui/CountUp';
import logo from '../../../assets/logo.svg';

interface DailyExpensesModuleProps {
  onRefresh?: () => void;
}

interface ExpenseByPocket {
  pocket_id: string;
  pocket_name: string;
  total: number;
}

export function DailyExpensesModule({ onRefresh }: DailyExpensesModuleProps) {
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [expensesByPocket, setExpensesByPocket] = useState<ExpenseByPocket[]>([]);
  const [loading, setLoading] = useState(false);

  const todayISO = new Date().toISOString().split('T')[0];

  // Fetch today's expenses from all pockets
  useEffect(() => {
    const fetchTodayExpenses = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get today's pocket expenses
        const { data: movements, error } = await supabase
          .from('movements')
          .select(`
            amount,
            pocket_id,
            pockets!inner(name)
          `)
          .eq('user_id', user.id)
          .eq('type', 'pocket_expense')
          .eq('date', todayISO);

        if (error) throw error;

        // Calculate total
        const total = movements?.reduce((sum, m) => sum + m.amount, 0) ?? 0;
        setTodayTotal(total);

        // Group by pocket
        const grouped = movements?.reduce((acc: Record<string, ExpenseByPocket>, m) => {
          const pocketId = m.pocket_id!;
          if (!acc[pocketId]) {
            acc[pocketId] = {
              pocket_id: pocketId,
              pocket_name: (m.pockets as any)?.name || 'Sin nombre',
              total: 0
            };
          }
          acc[pocketId].total += m.amount;
          return acc;
        }, {});

        setExpensesByPocket(Object.values(grouped || {}));
      } catch (err) {
        console.error('Error fetching today expenses:', err);
        setTodayTotal(0);
        setExpensesByPocket([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayExpenses();
  }, [todayISO]);

  const sectionColor = '#00D73D'; // Verde por defecto

  return (
    <div className="bg-black text-white font-sans w-full rounded-[14px] h-[269px] flex flex-col">
      {/* Colored Section - Top */}
      <div 
        className="flex-1 p-4 rounded-t-[14px] flex flex-col items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: sectionColor }}
      >
        <h2 className="text-[10px] sm:text-xs mb-2 uppercase text-white font-regular text-center">
          GASTOS DE HOY
        </h2>
        <h3 className="text-[10px] sm:text-xs uppercase text-white/70 font-regular text-center mb-3">
          DESDE BOLSAS
        </h3>
        
        {/* Main Amount */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-0">
            <span className="text-[19px] font-bold">$</span>
            <CountUp
              from={0}
              to={Math.round(todayTotal)}
              separator="."
              direction="up"
              duration={1}
              className="text-[50px] font-bold leading-none text-center tracking-tighter"
            />
          </div>
        </div>

        {/* Breakdown by pocket */}
        {expensesByPocket.length > 0 && (
          <div className="mt-3 w-full max-w-[200px] space-y-1">
            {expensesByPocket.map((pocket) => (
              <div key={pocket.pocket_id} className="flex justify-between text-[10px] text-white/80">
                <span className="truncate">{pocket.pocket_name}</span>
                <span className="font-semibold">${pocket.total.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Black Section - Bottom */}
      <div className="flex flex-col h-[100px] items-center justify-center">
        <img src={logo} alt="FFS Finance" width={141} height={33.84} />
      </div>
    </div>
  );
}
