import { GlassField, GlassSelect } from '../../../IOSModal';
import { PocketFieldsProps } from '../../types';

export function DebtFields({ state, setState }: PocketFieldsProps) {
  return (
    <div className="space-y-5">
      <GlassField
        label="Monto total de la deuda"
        type="number"
        step="0.01"
        value={state.originalAmount}
        onChange={(e) => setState((prev) => ({ ...prev, originalAmount: e.target.value }))}
        required
        placeholder="0.00"
      />

      <div className="grid grid-cols-2 gap-4">
        <GlassField
          label="Total de cuotas"
          type="number"
          value={state.installmentsTotal}
          onChange={(e) => setState((prev) => ({ ...prev, installmentsTotal: e.target.value }))}
          required
          placeholder="12"
        />
        <GlassField
          label="Monto por cuota"
          type="number"
          step="0.01"
          value={state.installmentAmount}
          onChange={(e) => setState((prev) => ({ ...prev, installmentAmount: e.target.value }))}
          placeholder="Calculado"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassSelect
          label="Día de vencimiento"
          value={state.debtDueDay}
          onChange={(e) => setState((prev) => ({ ...prev, debtDueDay: parseInt(e.target.value) }))}
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </GlassSelect>
        <GlassField
          label="Tasa de interés (%)"
          type="number"
          step="0.01"
          value={state.interestRate}
          onChange={(e) => setState((prev) => ({ ...prev, interestRate: e.target.value }))}
          placeholder="0.00"
        />
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="automaticPayment"
          checked={state.automaticPayment}
          onChange={(e) => setState((prev) => ({ ...prev, automaticPayment: e.target.checked }))}
          className="w-5 h-5 rounded"
          style={{ accentColor: '#0A84FF' }}
        />
        <label htmlFor="automaticPayment" className="ios-label" style={{ marginBottom: 0 }}>
          Pago automático
        </label>
      </div>

      <div className="text-sm text-gray-400 p-3 rounded bg-gray-900/50">
        ℹ️ El sistema calculará automáticamente la próxima fecha de vencimiento
      </div>
    </div>
  );
}
