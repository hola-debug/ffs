import { CommonFields } from '../../fields/CommonFields';
import { PocketFieldsProps } from '../../types';
import { PocketSubtype, PocketType } from '@/lib/types';

const ACCENT_COLOR = '#67F690';

const TYPE_LABELS: Record<PocketType, string> = {
  saving: 'Ahorro',
  expense: 'Gasto',
  debt: 'Deuda',
};

const SUBTYPE_LABELS: Record<Exclude<PocketSubtype, null>, string> = {
  period: 'Por período',
  recurrent: 'Recurrente',
  fixed: 'Fijo',
  shared: 'Compartido',
};

interface Step3Props extends PocketFieldsProps {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}
export function Step3_Config({ state, setState, accounts, onNext, onBack, onClose }: Step3Props) {
  const typeLabel = TYPE_LABELS[state.pocketType];
  const subtypeLabel = state.pocketType === 'expense' && state.pocketSubtype ? SUBTYPE_LABELS[state.pocketSubtype] : null;
  const configLabel = subtypeLabel ? `${typeLabel} · ${subtypeLabel}` : typeLabel;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <p className="font-monda text-xs tracking-[0.35em] text-white/60 uppercase">
          Configura tu bolsa · <span className="text-white">{configLabel}</span>
        </p>
      </div>

      {accounts.length === 0 && (
        <div className="rounded-[20px] border border-[#ff7a7a]/60 bg-black/50 px-4 py-3 font-roboto text-[11px] text-white/80 tracking-[0.08em] shadow-[0_20px_45px_rgba(0,0,0,0.6)]">
          ⚠️ Necesitas crear una cuenta antes de continuar con esta bolsa.
        </div>
      )}

      <div className="rounded-[28px] border border-white/10 bg-black/40 px-5 py-6 shadow-[0_25px_60px_rgba(0,0,0,0.65)]">
        <CommonFields state={state} setState={setState} accounts={accounts} />
      </div>

      <div className="flex space-x-3 pt-2 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="font-roboto text-[10px] tracking-[0.08em] flex-1 rounded-[18px] border border-white/15 bg-black/60 px-4 py-3 text-white transition hover:border-white/40"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onClose}
          className="font-roboto text-[10px] tracking-[0.08em] flex-1 rounded-[18px] border border-white/15 bg-black/60 px-4 py-3 text-white transition hover:border-white/40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="font-roboto text-[10px] tracking-[0.08em] flex-1 rounded-[18px] border-2 px-4 py-3 text-white transition"
          style={{
            borderColor: ACCENT_COLOR,
            boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 15px ${ACCENT_COLOR}40`,
          }}
        >
          Siguiente
        </button>
      </div>
    </form>
  );
}
