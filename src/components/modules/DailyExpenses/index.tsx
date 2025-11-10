import { useEffect, useMemo } from 'react';
import { TodayExpenses, Account, Category } from '../../../lib/types';
import { useDailyExpensesAccumulated } from '../../../hooks/useDailyExpensesAccumulated';
import { useTodayTransactions } from '../../../hooks/useTodayTransactions';
import { useDashboardData } from '../../../hooks/useDashboardData';
import AddExpensePopover from '../../AddExpensePopover';
import AnimatedList from '../../ui/AnimatedList';
import CountUp from '../../ui/CountUp';
import type { TodayTransaction } from '../../../hooks/useTodayTransactions';
import type { DailyExpensesProjection } from '../../../lib/types';
import logo from '../../../assets/logo.svg';

interface DailyExpensesModuleProps {
  data: TodayExpenses | null;
  accounts: Account[];
  categories: Category[];
  onRefresh: () => void;
}

export function DailyExpensesModule({ 
  data, 
  accounts, 
  categories, 
  onRefresh 
}: DailyExpensesModuleProps) {
  const { transactions, loading: transactionsLoading, refetch: refetchTransactions } = useTodayTransactions();
  const { data: expensesAccum, projections, loading: accLoading, refetch: refetchAccum } = useDailyExpensesAccumulated(30);
  const { dailySpendable } = useDashboardData();

  const transactionsSignature = useMemo(
    () => transactions.map((t) => `${t.id}-${t.amount}-${t.date}`).join('|'),
    [transactions]
  );

  useEffect(() => {
    if (transactionsLoading) return;
    refetchAccum();
  }, [transactionsSignature, transactionsLoading, refetchAccum]);

  // Determinar el color según la condición
  const sectionColor = useMemo(() => {
    if (!dailySpendable) return '#00D73D';
    
    // Verificar si saldo_diario_base existe
    if (dailySpendable.saldo_diario_base === undefined || dailySpendable.saldo_diario_base === null) {
      // Fallback a saldo_diario_hoy si no existe saldo_diario_base
      return dailySpendable.gastos_hoy > dailySpendable.saldo_diario_hoy ? '#FF0000' : '#00D73D';
    }
    
    // Si gastos de hoy > saldo diario base = rojo
    return dailySpendable.gastos_hoy > dailySpendable.saldo_diario_base ? '#FF0000' : '#00D73D';
  }, [dailySpendable]);

  const handleSuccess = () => {
    onRefresh();
    refetchTransactions();
    refetchAccum();
  };

  return (
    <>
      <div className="bg-black text-white font-sans  w-full rounded-t-[20px] rounded-b-[14px]  h-[269px] ">
        {/* Green Section - Top */}
        <div 
          className="w-full p-2 h-[169px] rounded-[14px] flex flex-col items-center justify-center transition-colors duration-300"
          style={{ backgroundColor: sectionColor }}
        >
          {/* Header */}
          <h2 className="text-[10px] sm:text-xs mb-2 uppercase text-[#ffffff] font-regular text-center">
            GASTOS DIARIOS
          </h2>
          <h3 className="text-[10px] sm:text-xs uppercase text-[#ffffff] font-regular text-center sm:mb-6 mb-4">
            RESTA
          </h3>
          {/* Main Amount */}
          <div className="mb-4 sm:mb-5 flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-0 mb-2 sm:mb-3">
              <span className="text-[19px] font-bold">$</span>
              <CountUp
                from={0}
                to={Math.round(expensesAccum?.gastos_hoy ?? data?.total_today ?? 0)}
                separator="."
                direction="up"
                duration={1}
                className="text-[50px] font-bold leading-none text-center tracking-tighter"
              />
            </div>
          </div>
          {/* Add Expense Button */}
          <AddExpensePopover
            accounts={accounts}
            categories={categories}
            isRandom={false}
            onSuccess={handleSuccess}
            trigger={
              <button className="w-11/12 bg-black text-white font-regular text-[10px] rounded-[9px] h-[25px] w-[174px] transition-colors duration-200 flex items-center justify-center uppercase tracking-[0.3em]">
                AGREGAR GASTO
              </button>
            }
          />
        </div>
        {/* Black Section - Bottom */}
        <div className="flex flex-col h-[100px] items-center  justify-center ">
          <img src={logo} alt="FFS Finance" width={141} height={33.84} />
        </div>
      </div>
    </>
  );
}
