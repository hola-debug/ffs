import { MonthSummary } from '../../../lib/types';
import { BaseCard } from '../BaseCard';

interface MonthlyIncomeModuleProps {
  data: MonthSummary | null;
}

export function MonthlyIncomeModule({ data }: MonthlyIncomeModuleProps) {
  return (
    <BaseCard>
      <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide">
        Ingreso Mes
      </h2>

      <div className="text-2xl sm:text-6xl font-bold mb-2 sm:mb-6 break-all px-1">
        ${(data?.total_income || 0).toLocaleString('es-UY')}
      </div>

      <button className="w-full py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold uppercase text-xs sm:text-base tracking-wide transition-colors">
        Gestionar
      </button>
    </BaseCard>
  );
}
