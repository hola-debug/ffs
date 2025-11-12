import { useMemo, useState, useEffect } from 'react';
import { Period } from '../../../lib/types';
import { supabase } from '../../../lib/supabaseClient';
import CountUp from '../../ui/CountUp';
import logo from '../../../assets/logo.svg';

interface DailyExpensesModuleProps {
  periods: Period[];
  onRefresh: () => void;
}

export function DailyExpensesModule({ 
  periods,
  onRefresh 
}: DailyExpensesModuleProps) {
  // State for selected period
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  
  // Find active period as default
  const activePeriod = useMemo(
    () => periods?.find((period) => period.status === 'active'),
    [periods]
  );
  
  // Initialize selected period with active period
  useEffect(() => {
    if (activePeriod && !selectedPeriodId) {
      setSelectedPeriodId(activePeriod.id);
    }
  }, [activePeriod, selectedPeriodId]);
  
  // Get selected period
  const selectedPeriod = useMemo(
    () => periods?.find((period) => period.id === selectedPeriodId),
    [periods, selectedPeriodId]
  );
  
  // State for today's expenses
  const [todayExpenses, setTodayExpenses] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Calculate today's date
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Fetch today's period expenses
  useEffect(() => {
    if (!selectedPeriodId) {
      setTodayExpenses(0);
      return;
    }

    const fetchTodayExpenses = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('amount')
          .eq('period_id', selectedPeriodId)
          .eq('type', 'expense')
          .eq('scope', 'period')
          .eq('is_random', true)
          .eq('date', todayISO);

        if (error) throw error;

        const total = data?.reduce((sum, t) => sum + t.amount, 0) ?? 0;
        setTodayExpenses(total);
      } catch (err) {
        console.error('Error fetching today expenses:', err);
        setTodayExpenses(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayExpenses();
  }, [selectedPeriodId, todayISO]);

  // Calculate values for display
  const periodDailyBudget = selectedPeriod?.daily_amount ?? 0;
  
  // Determine color based on budget
  const sectionColor = todayExpenses > periodDailyBudget ? '#FF0000' : '#00D73D';

  return (
    <div className="bg-black text-white font-sans w-full rounded-[14px] h-[269px]">
      {/* Colored Section - Top */}
      <div 
        className="w-full p-4 h-[169px] rounded-[14px] flex flex-col items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: sectionColor }}
      >
        {/* Period Selector */}
        <div className="w-full mb-4">
          <select
            value={selectedPeriodId || ''}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="w-full bg-white/20 border border-white/30 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
          >
            {periods.length === 0 ? (
              <option value="">No hay períodos disponibles</option>
            ) : (
              periods.map((period) => (
                <option key={period.id} value={period.id} className="bg-gray-800">
                  {period.name} {period.status === 'active' ? '(Activo)' : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Header */}
        {selectedPeriod ? (
          <>
            <h2 className="text-[10px] sm:text-xs mb-2 uppercase text-white font-regular text-center">
              GASTOS RANDOM DEL PERIODO
            </h2>
            <h3 className="text-[10px] sm:text-xs uppercase text-white font-regular text-center mb-4">
              HOY
            </h3>
            
            {/* Main Amount */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-baseline gap-0">
                <span className="text-[19px] font-bold">$</span>
                <CountUp
                  from={0}
                  to={Math.round(todayExpenses)}
                  separator="."
                  direction="up"
                  duration={1}
                  className="text-[50px] font-bold leading-none text-center tracking-tighter"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white/70 text-sm">Selecciona un período</p>
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
