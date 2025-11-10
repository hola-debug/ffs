import { DailySpendable, DailyProjection } from '../../../lib/types';
import { useDailyProjection } from '../../../hooks/useDailyProjection';
import { DailyLimitModal } from './DailyLimitModal';
import { EyeIcon } from '@heroicons/react/24/outline';
import AnimatedList from '../../ui/AnimatedList';
import CountUp from '../../ui/CountUp';

interface DailyBalanceModuleProps {
  data: DailySpendable | null;
  onRefresh?: () => void;
}

export function DailyBalanceModule({ data, onRefresh }: DailyBalanceModuleProps) {
  const fallbackData: DailySpendable = {
    user_id: 'placeholder',
    ingresos_mes: 0,
    gastos_fijos_mes: 0,
    ahorro_mes: 0,
    disponible_mes: 0,
    dias_restantes: 0,
    saldo_diario_hoy: 0,
    gastos_hoy: 0,
    saldo_diario_restante_hoy: 0,
    saldo_diario_base: 0,
    saldo_acumulado_hoy: 0,
    total_mensual_teorico: 0,
  };
  const safeData = data ?? fallbackData;

  // Calcular días restantes del mes para mostrar todo
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const daysRemaining = daysInMonth - currentDay;
  
  const { projections, loading: projectionsLoading, refetch: refetchProjections } = useDailyProjection(daysRemaining);

  const autoCalculatedLimit = safeData.disponible_mes / (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate());

  const handleSuccess = () => {
    if (onRefresh) onRefresh();
    if (refetchProjections) refetchProjections();
  };

  return (
    <div className="bg-black rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white font-sans relative w-full overflow-x-hidden h-[269px]">
      {/* Header */}
      <div className="flex items-center mb-4 sm:mb-6 justify-center gap-2">
        <h2 className="text-[10px] sm:text-xs uppercase text-[#ffffff] font-regular text-center">
          SALDO DIARIO
        </h2>
        <DailyLimitModal
          currentLimit={safeData.saldo_diario_base}
          autoCalculatedLimit={autoCalculatedLimit}
          onSuccess={handleSuccess}
        />
      </div>

      {/* Main Amount */}
      <div className="mb-4 sm:mb-5">
        <div className="flex items-baseline justify-between mb-2 sm:mb-3">
          <span className="text-[10px] font-normal">HOY</span>
          <div className="flex items-baseline">
            <span className=" text-[19px] font-bold">$</span>
            <CountUp
              from={0}
              to={Math.round(safeData.saldo_acumulado_hoy ?? safeData.saldo_diario_restante_hoy)}
              separator="."
              direction="up"
              duration={1}
              className="text-[39px] font-bold leading-none text-center tracking-tighter"
            />
          </div>
          <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        
        <div className="text-[7px] sm:text-[8px] uppercase text-center text-[#FFFFFF] font-bold">
          TOTAL MENSUAL {Math.round(safeData.total_mensual_teorico ?? safeData.disponible_mes).toLocaleString('es-UY', { minimumFractionDigits: 0 })}
        </div>
      </div>

      {/* Projections List */}
      {projectionsLoading ? (
        <div className="text-xs text-gray-500"></div>
      ) : projections.length > 0 ? (
        <div className="relative z-10">
        <AnimatedList<DailyProjection>
          items={projections}
          showGradients={true}
          enableArrowNavigation={false}
          displayScrollbar={false}
          className="w-full"
          maxHeight="80px"
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
                  {Math.round(proj.accumulated_balance).toLocaleString('es-UY', { minimumFractionDigits: 0 })}
                </span>
              </div>
            );
          }}
        />
        </div>
      ) : null}
    </div>
  );
}
