import { Period, DailyProjection } from '../../../lib/types';
import { useDailyProjection } from '../../../hooks/useDailyProjection';
import { EyeIcon } from '@heroicons/react/24/outline';
import AnimatedList from '../../ui/AnimatedList';
import CountUp from '../../ui/CountUp';

interface DailyBalanceModuleProps {
  periods: Period[];
  onRefresh?: () => void;
}

export function DailyBalanceModule({ periods, onRefresh }: DailyBalanceModuleProps) {
  // Find active period
  const activePeriod = periods.find(p => p.status === 'active');
  
  console.log('🔍 DailyBalance - Active period:', activePeriod);
  console.log('🔍 DailyBalance - daily_amount:', activePeriod?.daily_amount, 'type:', typeof activePeriod?.daily_amount);
  console.log('🔍 DailyBalance - spent_amount:', activePeriod?.spent_amount, 'type:', typeof activePeriod?.spent_amount);
  console.log('🔍 DailyBalance - allocated_amount:', activePeriod?.allocated_amount, 'type:', typeof activePeriod?.allocated_amount);

  // Calculate days data
  const today = new Date();
  const endsAt = activePeriod?.ends_at ? new Date(activePeriod.ends_at) : null;
  const startsAt = activePeriod?.starts_at ? new Date(activePeriod.starts_at) : today;
  
  // Calculate days remaining in period
  const daysRemaining = endsAt 
    ? Math.max(0, Math.ceil((endsAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : activePeriod?.days || 0;

  // Calculate days passed in period
  const daysPassed = activePeriod
    ? Math.max(1, Math.ceil((today.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  // Calculate accumulated balance: (daily_amount * days_passed) - spent_amount
  const dailyAmount = Number(activePeriod?.daily_amount) || 0;
  const spentAmount = Number(activePeriod?.spent_amount) || 0;
  const accumulatedBalance = activePeriod
    ? (dailyAmount * daysPassed) - spentAmount
    : 0;

  // Calculate total theoretical for the whole period
  const totalTheoretical = Number(activePeriod?.allocated_amount) || 0;
  
  const { projections, loading: projectionsLoading, refetch: refetchProjections } = useDailyProjection(daysRemaining, activePeriod?.id);

  const handleSuccess = () => {
    if (onRefresh) onRefresh();
    if (refetchProjections) refetchProjections();
  };

  return (
    <div className="bg-black rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white font-sans relative w-full overflow-x-hidden h-[269px]">
      {/* Header */}
      <div className="flex items-center mb-4 sm:mb-6 justify-center gap-2">
        <h2 className="text-[10px] sm:text-xs uppercase text-[#ffffff] font-regular text-center">
          {activePeriod ? activePeriod.name.toUpperCase() : 'SALDO DIARIO'}
        </h2>
      </div>

      {/* Main Amount */}
      {!activePeriod ? (
        <div className="flex flex-col items-center justify-center h-[180px]">
          <p className="text-xs opacity-70">No hay periodo activo</p>
          <p className="text-[9px] opacity-50 mt-2">Crea un periodo para ver tu saldo diario</p>
        </div>
      ) : (
        <>
          <div className="mb-4 sm:mb-5">
            <div className="flex items-baseline justify-between mb-2 sm:mb-3">
              <span className="text-[10px] font-normal">ACUMULADO</span>
              <div className="flex items-baseline">
                <span className="text-[19px] font-bold">$</span>
                <CountUp
                  from={0}
                  to={Math.round(accumulatedBalance)}
                  separator="."
                  direction="up"
                  duration={1}
                  className="text-[39px] font-bold leading-none text-center tracking-tighter"
                />
              </div>
              <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            
      
          </div>
        </>
      )}

      {/* Projections List */}
      {activePeriod && (projectionsLoading ? (
        <div className="text-xs text-gray-500"></div>
      ) : projections.length > 0 ? (
        <div className="relative z-10">
        <AnimatedList<DailyProjection>
          items={projections}
          onItemSelect={(item, index) => console.log(item, index)}
          showGradients={true}
          enableArrowNavigation={true}
          displayScrollbar={false}
          className="w-full"
          maxHeight="120px"
          gradientColor="#000000"
          renderItem={(proj, index, isSelected) => {
            const isToday = new Date(proj.date).toDateString() === new Date().toDateString();
            return (
              <div 
                className={`flex justify-between items-center ${
                  isToday ? 'border px-2 py-1 -mx-2 rounded' : 'py-0.5'
                }`}
                style={isToday ? { borderColor: '#FF0000' } : undefined}
              >
                <span className="text-[10px] sm:text-xs tracking-wide font-medium">
                  {proj.day_number}/{proj.month_number} {proj.day_name.substring(0, 3).toUpperCase()}
                </span>
                <span className="text-sm sm:text-base font-semibold tabular-nums">
                  {Math.round(Number(proj.accumulated_balance) || 0).toLocaleString('es-UY', { minimumFractionDigits: 0 })}
                </span>
              </div>
            );
          }}
        />
        </div>
      ) : null)}
    </div>
  );
}
