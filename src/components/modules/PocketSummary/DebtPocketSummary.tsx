import { ActivePocketSummary } from '@/lib/types';
import { usePocketSummary } from './usePocketSummary';
import { StatItem } from './StatItem';
import { PocketSummaryCard } from './PocketSummaryCard';

interface PocketSummaryProps {
  pocket: ActivePocketSummary;
}

export const DebtPocketSummary = ({ pocket }: PocketSummaryProps) => {
  const { config, format } = usePocketSummary(pocket);
  const remaining = pocket.remaining_amount ?? 0;
  const installmentAmount = pocket.installment_amount ?? 0;
  const installmentCurrent = pocket.installment_current ?? 0;
  const installmentsTotal = pocket.installments_total ?? 0;
  const progress =
    installmentsTotal > 0 ? Math.min((installmentCurrent / installmentsTotal) * 100, 100) : 0;

  return (
    <PocketSummaryCard pocket={pocket}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatItem label="Restante" value={format(remaining)} hint="Capital por pagar" />
          <StatItem
            label="Cuota actual"
            value={format(installmentAmount)}
            hint={`Cuota ${installmentCurrent || 0} / ${installmentsTotal || 0}`}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatItem
            label="Interés"
            value={pocket.interest_rate ? `${pocket.interest_rate.toFixed(2)}%` : 'Sin dato'}
            hint="Si aplica"
          />
          <StatItem
            label="Vencimiento"
            value={pocket.next_payment ? pocket.next_payment.split('T')[0] : 'Pendiente'}
            hint="Próxima fecha considerada"
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Avance</p>
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
