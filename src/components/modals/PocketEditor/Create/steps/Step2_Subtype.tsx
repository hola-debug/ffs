import { memo } from 'react';
import { PocketSubtype } from '@/lib/types';
import { PocketFormState } from '../../types';

interface Step2Props {
  state: PocketFormState;
  setState: React.Dispatch<React.SetStateAction<PocketFormState>>;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const ACCENT_COLOR = '#67F690';
const EXPENSE_SUBTYPES: Array<{ value: PocketSubtype; label: string; emoji: string; description: string }> = [
  { value: 'period', label: 'Por Período', emoji: '📅', description: 'Presupuesto con inicio/fin (comida, viajes)' },
  { value: 'recurrent', label: 'Recurrente Variable', emoji: '🔄', description: 'Vence cada mes, monto varía (luz, agua)' },
  { value: 'fixed', label: 'Fijo Mensual', emoji: '📌', description: 'Vence cada mes, mismo monto (alquiler, Netflix)' },
];

function Step2SubtypeComponent({ state, setState, onNext, onBack, onClose }: Step2Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="font-monda text-xs tracking-[0.35em] text-white/60 uppercase">Tipo de gasto</p>
      </div>

      <div className="space-y-3">
        {EXPENSE_SUBTYPES.map((subtype) => {
          const isSelected = state.pocketSubtype === subtype.value;
          return (
            <label
              key={subtype.value}
              className={`group flex cursor-pointer items-center gap-4 rounded-[20px] border px-5 py-4 transition-all ${
                isSelected ? 'bg-black/80 shadow-[0_25px_55px_rgba(0,0,0,0.75)]' : 'bg-black/40'
              }`}
              style={{
                borderColor: isSelected ? ACCENT_COLOR : 'rgba(255,255,255,0.08)',
              }}
            >
              <input
                type="radio"
                name="subtype"
                value={subtype.value || ''}
                checked={isSelected}
                onChange={(e) => setState((prev) => ({ ...prev, pocketSubtype: (e.target.value as PocketSubtype) || null }))}
                className="sr-only"
              />

              <span className="flex items-center gap-4">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isSelected ? ACCENT_COLOR : 'rgba(255,255,255,0.08)',
                    boxShadow: isSelected ? `0 0 25px ${ACCENT_COLOR}80` : 'inset 0 0 4px rgba(0,0,0,0.45)',
                  }}
                />
              </span>

              <div className="flex flex-col text-sm font-roboto">
                <span className="font-monda font-semibold uppercase text-white text-xs" style={{ letterSpacing: '0.5em' }}>
                  {subtype.label}
                </span>
                <span className="font-roboto text-white/70 text-[10px]">{subtype.description}</span>
              </div>
            </label>
          );
        })}
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
          type="button"
          onClick={onNext}
          className="font-roboto text-[10px] tracking-[0.08em] flex-1 rounded-[18px] border-2 px-4 py-3 text-white transition"
          style={{
            borderColor: ACCENT_COLOR,
            boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 15px ${ACCENT_COLOR}40`,
          }}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export const Step2_Subtype = memo(Step2SubtypeComponent);
