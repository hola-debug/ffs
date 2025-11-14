import { GlassField, GlassSelect } from '@/components/IOSModal';
import { PocketFieldsProps } from '../../types';

export function ExpenseRecurrentFields({ state, setState }: PocketFieldsProps) {
  return (
    <div className="space-y-5">
      <GlassField
        label="Monto promedio"
        type="number"
        step="0.01"
        value={state.averageAmount}
        onChange={(e) => setState((prev) => ({ ...prev, averageAmount: e.target.value }))}
        required
        placeholder="0.00"
      />

      <GlassSelect
        label="Día de vencimiento"
        value={state.recurrentDueDay}
        onChange={(e) => setState((prev) => ({ ...prev, recurrentDueDay: parseInt(e.target.value) }))}
      >
        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </GlassSelect>

      <GlassField
        label="Notificar con cuántos días de anticipación"
        type="number"
        value={state.notificationDaysBefore}
        onChange={(e) => setState((prev) => ({ ...prev, notificationDaysBefore: parseInt(e.target.value) }))}
        min="1"
        max="15"
      />

      <GlassField
        label="Último monto pagado (opcional)"
        type="number"
        step="0.01"
        value={state.lastPaymentAmount}
        onChange={(e) => setState((prev) => ({ ...prev, lastPaymentAmount: e.target.value }))}
        placeholder="0.00"
      />

      <div className="text-sm text-gray-400 p-3 rounded bg-gray-900/50">
        ℹ️ El sistema calculará automáticamente la próxima fecha de vencimiento y mantendrá un promedio
      </div>
    </div>
  );
}
