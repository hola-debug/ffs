import { ActivePocketSummary } from '@/lib/types';
import { usePocketSummary } from './usePocketSummary';
import { StatItem } from './StatItem';
import { PocketSummaryCard } from './PocketSummaryCard';

interface PocketSummaryProps {
  pocket: ActivePocketSummary;
}

export const SavingPocketSummary = ({ pocket }: PocketSummaryProps) => {
  const { config, format } = usePocketSummary(pocket);
  const target = pocket.target_amount ?? 0;
  const saved = pocket.amount_saved ?? pocket.current_balance ?? 0;
  const remaining = pocket.remaining_amount ?? Math.max(target - saved, 0);
  const progress = pocket.progress_percentage ?? (target ? Math.min((saved / target) * 100, 100) : 0);

  return (
    <PocketSummaryCard pocket={pocket}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatItem label="Ahorrado" value={format(saved)} hint="Lo que ya llevas acompañado" />
          <StatItem label="Meta" value={format(target)} hint="Objetivo planeado" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatItem label="Falta" value={format(remaining)} hint="Monto restante" />
          <StatItem
            label="Recomendado"
            value={pocket.recommended_contribution ? format(pocket.recommended_contribution) : 'No definido'}
            hint="Contribución sugerida (si la hay)"
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Progreso</p>
          <div className="h-2 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: config.accent,
              }}
            />
          </div>
        </div>
      </div>
    </PocketSummaryCard>
  );
};
