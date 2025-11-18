import { useMemo } from 'react';
import { SavingFields } from '../../fields/subtypes/SavingFields';
import { ExpensePeriodFields } from '../../fields/subtypes/ExpensePeriodFields';
import { ExpenseRecurrentFields } from '../../fields/subtypes/ExpenseRecurrentFields';
import { ExpenseFixedFields } from '../../fields/subtypes/ExpenseFixedFields';
import { DebtFields } from '../../fields/subtypes/DebtFields';
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

interface Step4Props extends PocketFieldsProps {
  onSubmit: () => void;
  onBack: () => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}

export function Step4_Config({ state, setState, accounts, onSubmit, onBack, onClose, loading, error }: Step4Props) {
  const typeLabel = TYPE_LABELS[state.pocketType];
  const subtypeLabel = state.pocketType === 'expense' && state.pocketSubtype ? SUBTYPE_LABELS[state.pocketSubtype] : null;
  const configLabel = subtypeLabel ? `${typeLabel} · ${subtypeLabel}` : typeLabel;

  const subtypeFields = useMemo(() => {
    if (state.pocketType === 'saving') {
      return <SavingFields state={state} setState={setState} accounts={accounts} />;
    }
    if (state.pocketType === 'expense' && state.pocketSubtype === 'period') {
      return <ExpensePeriodFields state={state} setState={setState} accounts={accounts} />;
    }
    if (state.pocketType === 'expense' && state.pocketSubtype === 'recurrent') {
      return <ExpenseRecurrentFields state={state} setState={setState} accounts={accounts} />;
    }
    if (state.pocketType === 'expense' && state.pocketSubtype === 'fixed') {
      return <ExpenseFixedFields state={state} setState={setState} accounts={accounts} />;
    }
    if (state.pocketType === 'debt') {
      return <DebtFields state={state} setState={setState} accounts={accounts} />;
    }
    return null;
  }, [state.pocketType, state.pocketSubtype, state, setState, accounts]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <p className="font-monda text-xs tracking-[0.35em] text-white/60 uppercase">
          Detalles específicos · <span className="text-white">{configLabel}</span>
        </p>
      </div>

      {error && (
        <div className="rounded-[22px] border border-[#ff7a7a]/60 bg-black/55 px-4 py-3 font-roboto text-[11px] text-white/85 tracking-[0.08em] shadow-[0_25px_55px_rgba(0,0,0,0.65)]">
          ⚠️ {error}
        </div>
      )}

      {subtypeFields ? (
        <div className="rounded-[28px] border border-white/10 bg-black/40 px-5 py-6 shadow-[0_25px_60px_rgba(0,0,0,0.65)]">
          {subtypeFields}
        </div>
      ) : (
        <div className="rounded-[20px] border border-white/15 bg-black/40 px-4 py-4 font-roboto text-[11px] text-white/70 tracking-[0.08em]">
          Selecciona un tipo de bolsa válido para configurar sus detalles.
        </div>
      )}

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
          disabled={loading || !subtypeFields}
          className="font-roboto text-[10px] tracking-[0.08em] flex-1 rounded-[18px] border-2 px-4 py-3 text-white transition disabled:opacity-50"
          style={{
            borderColor: ACCENT_COLOR,
            boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 15px ${ACCENT_COLOR}40`,
          }}
        >
          {loading ? 'Creando...' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
