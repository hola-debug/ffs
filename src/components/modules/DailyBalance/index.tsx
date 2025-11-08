import { DailySpendable } from '../../../lib/types';
import { BaseCard } from '../BaseCard';

interface DailyBalanceModuleProps {
  data: DailySpendable | null;
}

export function DailyBalanceModule({ data }: DailyBalanceModuleProps) {
  if (!data) {
    return (
      <BaseCard title="SALDO DIARIO">
        <p className="text-gray-400">Sin datos</p>
      </BaseCard>
    );
  }

  return (
    <BaseCard variant="gradient">
      <h2 className="text-sm font-semibold mb-1 uppercase tracking-wide text-gray-300">
        Saldo Diario
      </h2>
      
      <div className="flex items-baseline gap-1 sm:gap-2 mb-1 min-w-0">
        <span className="text-xs sm:text-2xl flex-shrink-0">HOY</span>
        <span className="text-2xl sm:text-6xl font-bold break-all">
          ${data.saldo_diario_restante_hoy.toLocaleString('es-UY')}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-700">
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
          Total Mensual Demo
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-red-400">1/2 LUN</span>
            <span>400</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-400">1/2 MAR</span>
            <span>900</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-400">1/2 MER</span>
            <span>1100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-400">1/2 JUE</span>
            <span>1900</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-300 space-y-1">
        <p>Disponible mes: ${data.disponible_mes.toLocaleString('es-UY')}</p>
        <p>Días restantes: {data.dias_restantes}</p>
        <p>Gastos hoy: ${data.gastos_hoy.toLocaleString('es-UY')}</p>
      </div>
    </BaseCard>
  );
}
