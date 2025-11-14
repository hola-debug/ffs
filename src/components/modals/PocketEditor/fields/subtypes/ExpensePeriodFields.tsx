import { GlassField } from '../../../IOSModal';
import { PocketFieldsProps } from '../../types';

export function ExpensePeriodFields({ state, setState }: PocketFieldsProps) {
  return (
    <div className="space-y-5">
      <GlassField
        label="Monto asignado"
        type="number"
        step="0.01"
        value={state.allocatedAmount}
        onChange={(e) => setState((prev) => ({ ...prev, allocatedAmount: e.target.value }))}
        required
        placeholder="0.00"
      />

      <div className="grid grid-cols-2 gap-4">
        <GlassField
          label="Desde"
          type="date"
          value={state.startsAt}
          onChange={(e) => setState((prev) => ({ ...prev, startsAt: e.target.value }))}
          required
        />
        <GlassField
          label="Hasta"
          type="date"
          value={state.endsAt}
          onChange={(e) => setState((prev) => ({ ...prev, endsAt: e.target.value }))}
          required
        />
      </div>

      <div className="text-sm text-gray-400 p-3 rounded bg-gray-900/50">
        ℹ️ El sistema calculará automáticamente la duración en días y el presupuesto diario
      </div>
    </div>
  );
}
