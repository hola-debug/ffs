import { memo } from 'react';
import { PocketType } from '@/lib/types';
import { PocketFormState } from '../../types';

interface Step1Props {
  state: PocketFormState;
  setState: React.Dispatch<React.SetStateAction<PocketFormState>>;
  onNext: () => void;
  onClose: () => void;
}

const ACCENT_COLOR = '#67F690';
const POCKET_TYPES: Array<{ value: PocketType; label: string; emoji: string; description: string }> = [
  { value: 'saving', label: 'Ahorro', emoji: '💰', description: 'Juntar dinero para una meta' },
  { value: 'expense', label: 'Gasto', emoji: '💳', description: 'Controlar gastos con límite' },
  { value: 'debt', label: 'Deuda', emoji: '📊', description: 'Gestionar préstamos y cuotas' },
];

function Step1TypeComponent({ state, setState, onNext, onClose }: Step1Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="font-monda text-xs tracking-[0.35em] text-white/60 uppercase">Tipo de bolsa</p>
        <div className="h-px w-16 bg-white/40" />
      </div>

      <div className="space-y-3">
        {POCKET_TYPES.map((type) => {
          const isSelected = state.pocketType === type.value;
          return (
            <label
              key={type.value}
              className={`group flex cursor-pointer items-center gap-4 rounded-[20px] border px-5 py-4 transition-all ${
                isSelected ? 'bg-black/80 shadow-[0_25px_55px_rgba(0,0,0,0.75)]' : 'bg-black/40'
              }`}
              style={{
                borderColor: isSelected ? ACCENT_COLOR : 'rgba(255,255,255,0.08)',
              }}
            >
              <input
                type="radio"
                name="type"
                value={type.value}
                checked={isSelected}
                onChange={(e) => {
                  setState((prev) => ({
                    ...prev,
                    pocketType: e.target.value as PocketType,
                    pocketSubtype: e.target.value === 'expense' ? 'period' : null,
                  }));
                }}
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
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full border text-2xl transition-transform"
                  style={{
                    borderColor: 'rgba(255,255,255,0.18)',
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    boxShadow: 'inset 0 -4px 10px rgba(0,0,0,0.6)',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                  }}
                >
                  {type.emoji}
                </span>
              </span>

              <div className="flex flex-col text-sm font-roboto">
                <span className="font-monda font-semibold uppercase text-white text-xs" style={{ letterSpacing: '0.5em' }}>
                  {type.label}
                </span>
                <span className="font-roboto text-white/70 text-[10px]">{type.description}</span>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex space-x-3 pt-2 text-sm">
        <button
          type="button"
          onClick={onClose}
          className="font-roboto  text-[10px] tracking-[0.08em] flex-1 rounded-[18px] border border-white/15 bg-black/60 px-4 py-3 text-white transition hover:border-white/40"
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

export const Step1_Type = memo(Step1TypeComponent);
