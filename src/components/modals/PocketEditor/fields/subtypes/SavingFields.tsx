import { GlassField, GlassSelect } from '../../../IOSModal';
import { PocketFieldsProps } from '../../types';

export function SavingFields({ state, setState }: PocketFieldsProps) {
  return (
    <div className="space-y-5">
      <GlassField
        label="Monto objetivo"
        type="number"
        step="0.01"
        value={state.targetAmount}
        onChange={(e) => setState((prev) => ({ ...prev, targetAmount: e.target.value }))}
        required
        placeholder="0.00"
      />

      <GlassSelect
        label="Frecuencia de aporte"
        value={state.frequency}
        onChange={(e) => setState((prev) => ({ ...prev, frequency: e.target.value as any }))}
      >
        <option value="monthly">Mensual</option>
        <option value="weekly">Semanal</option>
        <option value="none">Sin frecuencia</option>
      </GlassSelect>

      <div className="grid grid-cols-2 gap-4">
        <GlassField
          label="Fecha inicio"
          type="date"
          value={state.startsAt}
          onChange={(e) => setState((prev) => ({ ...prev, startsAt: e.target.value }))}
        />
        <GlassField
          label="Fecha fin (opcional)"
          type="date"
          value={state.endsAt}
          onChange={(e) => setState((prev) => ({ ...prev, endsAt: e.target.value }))}
        />
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="allowWithdrawals"
          checked={state.allowWithdrawals}
          onChange={(e) => setState((prev) => ({ ...prev, allowWithdrawals: e.target.checked }))}
          className="w-5 h-5 rounded"
          style={{ accentColor: '#0A84FF' }}
        />
        <label htmlFor="allowWithdrawals" className="ios-label" style={{ marginBottom: 0 }}>
          Permitir retiros antes de completar
        </label>
      </div>
    </div>
  );
}
