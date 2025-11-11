import { useMemo } from 'react';
import { Account, Category, Period } from '../../../lib/types';
import { useTodayTransactions } from '../../../hooks/useTodayTransactions';
import { usePeriodRandomDaily } from '../../../hooks/usePeriodRandomDaily';
import AddExpensePopover from '../../AddExpensePopover';
import CountUp from '../../ui/CountUp';
import logo from '../../../assets/logo.svg';

interface DailyExpensesModuleProps {
  accounts: Account[];
  categories: Category[];
  periods: Period[];
  onRefresh: () => void;
}

export function DailyExpensesModule({ 
  accounts, 
  categories,
  periods,
  onRefresh 
}: DailyExpensesModuleProps) {
  // Find active period
  const activePeriod = useMemo(
    () => periods?.find((period) => period.status === 'active'),
    [periods]
  );
  
  // Get today's transactions and period random daily data
  const { transactions, refetch: refetchTransactions } = useTodayTransactions();
  const { data: periodRandomDaily, refetch: refetchPeriodRandom } = usePeriodRandomDaily(activePeriod?.id);

  // Calculate today's expenses
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayPeriodRandom = useMemo(
    () => periodRandomDaily.find((entry) => entry.date === todayISO),
    [periodRandomDaily, todayISO]
  );

  // Calculate values for display
  const todayRandomAmount = todayPeriodRandom?.daily_random_total ?? 0;
  const periodDailyBudget = activePeriod?.daily_amount ?? 0;
  const periodTodayRemaining = Math.max(periodDailyBudget - todayRandomAmount, 0);
  const periodTotalRemaining = activePeriod?.remaining_amount ?? 0;
  
  // Calculate total expenses from today's transactions
  const todayTotalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Determine main value and color
  const mainValue = activePeriod ? todayRandomAmount : todayTotalExpenses;
  const sectionColor = activePeriod 
    ? (todayRandomAmount > periodDailyBudget ? '#FF0000' : '#00D73D')
    : '#00D73D';

  const mainTitle = activePeriod ? 'GASTOS RANDOM DEL PERIODO' : 'GASTOS DIARIOS';
  const mainSubtitle = activePeriod ? 'HOY' : 'TOTAL HOY';

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: activePeriod?.currency ?? 'UYU',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const handleSuccess = () => {
    onRefresh();
    refetchTransactions();
    refetchPeriodRandom();
  };

  return (
    <div className="bg-black text-white font-sans w-full rounded-t-[20px] rounded-b-[14px] h-[269px]">
      {/* Colored Section - Top */}
      <div 
        className="w-full p-2 h-[169px] rounded-[14px] flex flex-col items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: sectionColor }}
      >
        {/* Header */}
        <h2 className="text-[10px] sm:text-xs mb-2 uppercase text-white font-regular text-center">
          {mainTitle}
        </h2>
        <h3 className="text-[10px] sm:text-xs uppercase text-white font-regular text-center sm:mb-6 mb-4">
          {mainSubtitle}
        </h3>
        
        {/* Main Amount */}
        <div className="mb-4 sm:mb-5 flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-0 mb-2 sm:mb-3">
            <span className="text-[19px] font-bold">$</span>
            <CountUp
              from={0}
              to={Math.round(mainValue)}
              separator="."
              direction="up"
              duration={1}
              className="text-[50px] font-bold leading-none text-center tracking-tighter"
            />
          </div>
        </div>
        
        {/* Period Stats (only show if there's an active period) */}
        {activePeriod && (
          <div className="w-full grid grid-cols-2 gap-2 text-white text-[10px] px-3 pb-2 uppercase tracking-wide">
            <div className="text-center">
              <p className="opacity-80">Restante hoy</p>
              <p className="text-base font-bold">
                {formatCurrency(periodTodayRemaining)}
              </p>
            </div>
            <div className="text-center">
              <p className="opacity-80">Restante período</p>
              <p className="text-base font-bold">
                {formatCurrency(periodTotalRemaining)}
              </p>
            </div>
          </div>
        )}
        
        {/* Add Expense Button */}
        <AddExpensePopover
          accounts={accounts}
          categories={categories}
          periods={periods}
          isRandom={activePeriod ? true : false}
          onSuccess={handleSuccess}
          trigger={
            <button className="bg-black text-white font-regular text-[10px] rounded-[9px] h-[25px] w-[174px] transition-colors duration-200 flex items-center justify-center uppercase tracking-[0.3em]">
              AGREGAR GASTO
            </button>
          }
        />
      </div>
      
      {/* Black Section - Bottom */}
      <div className="flex flex-col h-[100px] items-center justify-center">
        <img src={logo} alt="FFS Finance" width={141} height={33.84} />
      </div>
    </div>
  );
}
