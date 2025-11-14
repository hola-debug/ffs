import { PocketSubtype } from '../../../../lib/types';
import { PocketFormState } from '../../types';

interface Step2Props {
  state: PocketFormState;
  setState: React.Dispatch<React.SetStateAction<PocketFormState>>;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const EXPENSE_SUBTYPES: Array<{ value: PocketSubtype; label: string; emoji: string; description: string }> = [
  { value: 'period', label: 'Por Período', emoji: '📅', description: 'Presupuesto con inicio/fin (comida, viajes)' },
  { value: 'recurrent', label: 'Recurrente Variable', emoji: '🔄', description: 'Vence cada mes, monto varía (luz, agua)' },
  { value: 'fixed', label: 'Fijo Mensual', emoji: '📌', description: 'Vence cada mes, mismo monto (alquiler, Netflix)' },
];

export function Step2_Subtype({ state, setState, onNext, onBack, onClose }: Step2Props) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-white mb-4">Tipo de gasto</h3>
      {EXPENSE_SUBTYPES.map((subtype) => (
        <label
          key={subtype.value}
          className="block p-4 rounded-2xl cursor-pointer transition-all"
          style={{
            background: state.pocketSubtype === subtype.value ? 'rgba(10, 132, 255, 0.15)' : 'rgba(120, 120, 128, 0.16)',
            border: state.pocketSubtype === subtype.value ? '2px solid rgba(10, 132, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-start">
            <input
              type="radio"
              name="subtype"
              value={subtype.value || ''}
              checked={state.pocketSubtype === subtype.value}
              onChange={(e) => setState((prev) => ({ ...prev, pocketSubtype: (e.target.value as PocketSubtype) || null }))}
              className="mt-1 mr-3"
              style={{ accentColor: '#0A84FF' }}
            />
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                <span>{subtype.emoji}</span> {subtype.label}
              </div>
              <div className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {subtype.description}
              </div>
            </div>
          </div>
        </label>
      ))}

      <div className="flex space-x-3 pt-4">
        <button type="button" onClick={onBack} className="flex-1 ios-button-secondary">
          Atrás
        </button>
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
