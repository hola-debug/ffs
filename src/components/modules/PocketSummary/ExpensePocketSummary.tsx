import { ActivePocketSummary } from '@/lib/types';
import { usePocketSummary } from './usePocketSummary';
import { StatItem } from './StatItem';
import { PocketSummaryCard } from './PocketSummaryCard';

interface PocketSummaryProps {
  pocket: ActivePocketSummary;
}

export const ExpensePocketSummary = ({ pocket }: PocketSummaryProps) => {
  const { config, format } = usePocketSummary(pocket);
  const allocated = pocket.allocated_amount ?? 0;
  const currentBalance = pocket.current_balance ?? 0;
  const daysRemaining = pocket.days_remaining ?? 0;
  const dailyAllowance = pocket.daily_allowance ?? 0;
  const remainingDaily = pocket.remaining_daily_allowance ?? 0;
  const progress = allocated > 0 ? Math.min((currentBalance / allocated) * 100, 100) : 0;

  return (
    <PocketSummaryCard pocket={pocket}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatItem label="Disponible" value={format(currentBalance)} hint="Saldo actual en la bolsa" />
          <StatItem label="Meta" value={format(allocated)} hint="Presupuesto total asignado" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatItem label="Límite diario" value={format(dailyAllowance)} hint="Monto ideal por día" />
          <StatItem
            label="Queda hoy"
            value={format(remainingDaily)}
            hint={`${daysRemaining} días restantes`}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Progreso</p>
          <div className="h-2 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: config.accent,
              }}
            />
          </div>
        </div>
      </div>
    </PocketSummaryCard>
  );
};
