import { UserMonthlySummary } from '../../../lib/types';
import CountUp from '../../ui/CountUp';

interface DailyBalanceModuleProps {
  monthlySummary: UserMonthlySummary | null;
}

export function DailyBalanceModule({ monthlySummary }: DailyBalanceModuleProps) {
  return (
    <div className="bg-black rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white font-sans relative w-full overflow-x-hidden min-h-[269px]">
      {/* Header */}
      <div className="flex items-center mb-4 sm:mb-6 justify-center gap-2">
        <h2 className="text-[10px] sm:text-xs uppercase text-[#ffffff] font-regular text-center">
          DISPONIBLE
        </h2>
      </div>

      {/* Main Amount */}
      {!monthlySummary ? (
        <div className="flex flex-col items-center justify-center h-[180px]">
          <p className="text-xs opacity-70">Cargando...</p>
        </div>
      ) : (
        <div className="mb-4 sm:mb-5">
          <div className="flex items-baseline justify-between mb-2 sm:mb-3">
            <div className="flex items-baseline">
              <span className="text-[19px] font-bold">$</span>
              <CountUp
                from={0}
                to={Math.round(monthlySummary.available_balance)}
                separator="."
                direction="up"
                duration={1}
                className="text-[39px] font-bold leading-none text-center tracking-tighter"
              />
            </div>
          </div>

          {/* Desglose */}
          <div className="space-y-2 mt-6">
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Ingreso mensual</span>
              <span className="font-semibold">${(monthlySummary.monthly_income || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Gastos fijos</span>
              <span className="font-semibold text-red-400">-${(monthlySummary.fixed_expenses_month || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Ahorro directo</span>
              <span className="font-semibold text-blue-400">-${(monthlySummary.saving_deposits_month || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">En bolsas</span>
              <span className="font-semibold text-purple-400">-${(monthlySummary.pockets_allocated_month || 0).toLocaleString()}</span>
            </div>
            <div className="h-px bg-white/20 my-2"></div>
            <div className="flex justify-between text-base font-bold">
              <span>Disponible</span>
              <span className="text-green-400">${(monthlySummary.available_balance || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
