import { GlassField, GlassSelect } from '../../../IOSModal';
import { PocketFieldsProps } from '../../types';

export function ExpenseFixedFields({ state, setState }: PocketFieldsProps) {
  return (
    <div className="space-y-5">
      <GlassField
        label="Monto mensual"
        type="number"
        step="0.01"
        value={state.monthlyAmount}
        onChange={(e) => setState((prev) => ({ ...prev, monthlyAmount: e.target.value }))}
        required
        placeholder="0.00"
      />

      <GlassSelect
        label="Día de vencimiento"
        value={state.dueDay}
        onChange={(e) => setState((prev) => ({ ...prev, dueDay: parseInt(e.target.value) }))}
      >
        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </GlassSelect>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="autoRegister"
          checked={state.autoRegister}
          onChange={(e) => setState((prev) => ({ ...prev, autoRegister: e.target.checked }))}
          className="w-5 h-5 rounded"
          style={{ accentColor: '#0A84FF' }}
        />
        <label htmlFor="autoRegister" className="ios-label" style={{ marginBottom: 0 }}>
          Registrar automáticamente cada mes
        </label>
      </div>

      <div className="text-sm text-gray-400 p-3 rounded bg-gray-900/50">
        ℹ️ El sistema calculará la próxima fecha de vencimiento automáticamente
      </div>
    </div>
  );
}
