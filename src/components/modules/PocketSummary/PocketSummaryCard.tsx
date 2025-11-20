import { ActivePocketSummary } from '@/lib/types';
import { PocketIcon } from '@/components/PocketIcon';
import { usePocketSummary } from './usePocketSummary';

interface PocketSummaryCardProps {
  pocket: ActivePocketSummary;
  children: React.ReactNode;
}

export const PocketSummaryCard = ({ pocket, children }: PocketSummaryCardProps) => {
  const { config, subtypeLabel } = usePocketSummary(pocket);

  return (
    <div
      className="w-full overflow-hidden rounded-[28px] border border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.55)]"
      style={{
        backgroundImage: config.gradient,
      }}
    >
      <div className="space-y-4 bg-black/50 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-[0.4em] text-white/60">{config.label}</p>
            <h3 className="text-lg font-semibold text-white">{pocket.name}</h3>
            {subtypeLabel && (
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">{subtypeLabel}</p>
            )}
          </div>
          <div className="flex items-center justify-center rounded-full border border-white/20 bg-black/30 p-2">
            <PocketIcon iconId={pocket.emoji} className="w-6 h-6 text-white" fallbackClassName="text-lg" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
