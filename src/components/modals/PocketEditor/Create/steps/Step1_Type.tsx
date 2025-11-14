import { PocketType } from '../../../../lib/types';
import { PocketFormState } from '../../types';

interface Step1Props {
  state: PocketFormState;
  setState: React.Dispatch<React.SetStateAction<PocketFormState>>;
  onNext: () => void;
  onClose: () => void;
}

const POCKET_TYPES: Array<{ value: PocketType; label: string; emoji: string; description: string }> = [
  { value: 'saving', label: 'Ahorro', emoji: '💰', description: 'Juntar dinero para una meta' },
  { value: 'expense', label: 'Gasto', emoji: '💳', description: 'Controlar gastos con límite' },
  { value: 'debt', label: 'Deuda', emoji: '📊', description: 'Gestionar préstamos y cuotas' },
];

export function Step1_Type({ state, setState, onNext, onClose }: Step1Props) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-white mb-4">Tipo de bolsa</h3>
      {POCKET_TYPES.map((type) => (
        <label
          key={type.value}
          className="block p-4 rounded-2xl cursor-pointer transition-all"
          style={{
            background: state.pocketType === type.value ? 'rgba(10, 132, 255, 0.15)' : 'rgba(120, 120, 128, 0.16)',
            border: state.pocketType === type.value ? '2px solid rgba(10, 132, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-start">
            <input
              type="radio"
              name="type"
              value={type.value}
              checked={state.pocketType === type.value}
              onChange={(e) => {
                setState((prev) => ({
                  ...prev,
                  pocketType: e.target.value as PocketType,
                  pocketSubtype: e.target.value === 'expense' ? 'period' : null,
                }));
              }}
              className="mt-1 mr-3"
              style={{ accentColor: '#0A84FF' }}
            />
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                <span>{type.emoji}</span> {type.label}
              </div>
              <div className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {type.description}
              </div>
            </div>
          </div>
        </label>
      ))}

      <div className="flex space-x-3 pt-4">
        <button type="button" onClick={onClose} className="flex-1 ios-button-secondary">
          Cancelar
        </button>
        <button type="button" onClick={onNext} className="flex-1 ios-button">
          Siguiente
        </button>
      </div>
    </div>
  );
}
