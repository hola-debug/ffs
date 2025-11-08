import { DailySpendable, DailyProjection } from '../../../lib/types';
import { useDailyProjection } from '../../../hooks/useDailyProjection';
import { DailyLimitModal } from './DailyLimitModal';
import { EyeIcon } from '@heroicons/react/24/outline';
import AnimatedList from '../../ui/AnimatedList';

interface DailyBalanceModuleProps {
  data: DailySpendable | null;
  onRefresh?: () => void;
}

export function DailyBalanceModule({ data, onRefresh }: DailyBalanceModuleProps) {
  // Calcular días restantes del mes para mostrar todo
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const daysRemaining = daysInMonth - currentDay;
  
  const { projections, loading: projectionsLoading } = useDailyProjection(daysRemaining);

  if (!data) {
    return null;
  }

  const autoCalculatedLimit = data?.disponible_mes / (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate());

  const handleSuccess = () => {
    if (onRefresh) onRefresh();
  };

  return (
    <div className="bg-black rounded-2xl p-5 text-white font-sans relative overflow-hidden max-w-sm">
      {/* Header */}
      <div className="flex items-center mb-6 justify-center">
        <h2 className="text-[10px] uppercase  text-[#ffffff] font-regular text-center">
          SALDO DIRIO
        </h2>
        <div className="flex items-center gap-2">
          <DailyLimitModal
            currentLimit={data.saldo_diario_base}
            autoCalculatedLimit={autoCalculatedLimit}
            onSuccess={handleSuccess}
          />
        </div>
      </div>

      {/* Main Amount */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between  mb-3">
          <span className="text-[10px] font-normal ">HOY</span>
          <div>
          <span className="text-[19px] font-bold ">$</span>

          <span className="text-[39px] font-bold  leading-none">
            {Math.round(data.saldo_acumulado_hoy ?? data.saldo_diario_restante_hoy).toLocaleString('es-UY', { minimumFractionDigits: 0 })}
          </span>
          </div>
          
          <EyeIcon className="w-5 h-5 text-white" />

        </div>
        
        <div className="text-[7px] uppercase text-center text-[#FFFFFF] font-bold">
          TOTAL MENSUAL {Math.round(data.total_mensual_teorico ?? data.disponible_mes).toLocaleString('es-UY', { minimumFractionDigits: 0 })}
        </div>
      </div>

      {/* Projections List */}
      {projectionsLoading ? (
        <div className="text-xs text-gray-500">Cargando...</div>
      ) : projections.length > 0 ? (
        <AnimatedList<DailyProjection>
          items={projections}
          showGradients={true}
          enableArrowNavigation={false}
          displayScrollbar={false}
          className="w-full"
          maxHeight="200px"

          renderItem={(proj, index, isSelected) => {
            const isToday = new Date(proj.date).toDateString() === new Date().toDateString();
            return (
              <div 
                className={`flex justify-between items-center ${
                  isToday ? 'border border-red-600 px-2 py-1 -mx-2 rounded' : 'py-0.5'
                }`}
              >
                <span className="text-xs tracking-wide font-medium">
                  {proj.day_number}/{proj.month_number} {proj.day_name.substring(0, 3).toUpperCase()}
                </span>
                <span className="text-base font-semibold tabular-nums">
                  {Math.round(proj.accumulated_balance).toLocaleString('es-UY', { minimumFractionDigits: 0 })}
                </span>
              </div>
            );
          }}
        />
      ) : null}
    </div>
  );
}
