import { useMemo, useState } from 'react';
import { ActivePocketSummary } from '@/lib/types';
import { usePocketSummary } from './usePocketSummary';
import CountUp from '@/components/ui/CountUp';
import AddSavingModal from '../../modals/AddSavingModal';

interface PocketSummaryProps {
  pocket: ActivePocketSummary;
  openModal?: (modalId: string, data?: { pocketId?: string }) => void;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const formatShortDate = (date: Date) =>
  date.toLocaleDateString('es-UY', {
    day: 'numeric',
    month: 'numeric',
  });

export const SavingPocketSummary = ({ pocket }: PocketSummaryProps) => {
  const { config, format } = usePocketSummary(pocket);
  const [isAddSavingModalOpen, setIsAddSavingModalOpen] = useState(false);

  const target = pocket.target_amount ?? 0;
  const saved = pocket.amount_saved ?? pocket.current_balance ?? 0;
  const remaining = Math.max(target - saved, 0);

  const progress = target
    ? Math.min((saved / target) * 100, 100)
    : 0;

  const startsAt = pocket.starts_at ? new Date(pocket.starts_at) : null;
  const endsAt = pocket.ends_at ? new Date(pocket.ends_at) : null;

  const { daysLeft, hasEnd } = useMemo(() => {
    if (!endsAt) return { daysLeft: 0, hasEnd: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endsAt);
    end.setHours(0, 0, 0, 0);

    const diff = end.getTime() - today.getTime();
    const d = Math.max(0, Math.ceil(diff / MS_PER_DAY));
    return { daysLeft: d, hasEnd: true };
  }, [endsAt]);

  const roundedProgress = Math.round(progress || 0);

  let bottomText = '';
  if (target > 0 && remaining > 0 && hasEnd) {
    bottomText = `Te falta ${daysLeft} días ${format(
      remaining
    )} para llegar a tu objetivo`;
  } else if (target > 0 && remaining > 0) {
    bottomText = `Te falta ${format(remaining)} para llegar a tu objetivo`;
  } else if (target > 0 && remaining === 0) {
    bottomText = '¡Objetivo alcanzado!';
  }

  return (
    <div className="relative w-full h-[269px] flex rounded-[18px] overflow-hidden font-[Monda] bg-black">
      {/* LADO IZQUIERDO - FONDO NEGRO */}
      <div className="w-1/2 flex flex-col justify-between px-6 py-6 text-white">
        <p className="text-[10px] uppercase tracking-[0.25em] opacity-90">
          Vas recaudando un
        </p>

        <div className="-mt-2">
          <div className="flex items-end gap-1">
            <span style={{ color: '#4F0E42' }} className="text-[72px] font-bold leading-none">
              <CountUp
                from={0}
                to={roundedProgress}
                duration={1}
              />
            </span>
            <span className="text-[40px] font-bold mb-2" style={{ color: '#4F0E42' }}>%</span>
          </div>
        </div>

        <p className="text-[11px] leading-tight uppercase tracking-[0.12em] max-w-[210px] opacity-90">
          {bottomText}
        </p>
      </div>

      {/* LADO DERECHO - IMAGEN DE FONDO */}
      <div
        className="w-1/2 relative flex flex-col justify-between p-6 text-white rounded-[18px] overflow-hidden"
        style={{
          backgroundImage: "url('/saving_expenses.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Nombre */}
        <div>
          <p className="text-[10px] uppercase opacity-70 mb-1 tracking-[0.15em]">
            Nombre de tu bolsa
          </p>
          <h3 className="text-[20px] font-bold leading-none text-white">
            {pocket.name || 'Bolsa Objetivo'}
          </h3>
        </div>

        {/* Objetivos */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="opacity-70">Ahorrado mes</span>
            <span className="font-semibold">
              {format(pocket.current_period_contribution || 0)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-70">Meta mensual</span>
            <span className="font-semibold">
              {format(pocket.recommended_contribution || 0)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-70">Objetivo</span>
            <span className="font-semibold">USD {target}</span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-70">Inicio</span>
            <span className="font-semibold">
              {startsAt ? formatShortDate(startsAt) : '-'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="opacity-70">Fin</span>
            <span className="font-semibold">
              {endsAt ? formatShortDate(endsAt) : '-'}
            </span>
          </div>
        </div>

        {/* BOTÓN */}
        <button
          type="button"
          onClick={() => setIsAddSavingModalOpen(true)}
          className="w-full text-white uppercase tracking-[0.25em] text-[11px] font-semibold py-2 rounded-full transition-transform active:scale-95"
          style={{
            backgroundColor: '#1E1614',
          }}
        >
          Ahorrar
        </button>
      </div>

      <AddSavingModal
        isOpen={isAddSavingModalOpen}
        onClose={() => setIsAddSavingModalOpen(false)}
        onSuccess={() => setIsAddSavingModalOpen(false)} // Just close the modal on success for now
        savingPockets={[pocket]}
      />
    </div>
  );
};
