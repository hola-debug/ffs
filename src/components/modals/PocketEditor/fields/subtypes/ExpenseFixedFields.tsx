import { GlassField } from '@/components/IOSModal';
import GlassDropdown from '@/components/GlassDropdown';
import { PocketFieldsProps } from '../../types';

export function ExpenseFixedFields({ state, setState }: PocketFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="font-monda text-[10px] tracking-[0.35em] text-white/70 uppercase">GASTO FIJO</p>
        <p className="font-roboto text-[11px] text-white/60">Mantén control de tus pagos mensuales.</p>
      </div>

      <GlassField
        label="Monto mensual"
        type="number"
        step="0.01"
        value={state.monthlyAmount}
        onChange={(e) => setState((prev) => ({ ...prev, monthlyAmount: e.target.value }))}
        required
        placeholder="0.00"
      />

      <GlassDropdown
        label="Día de vencimiento"
        value={String(state.dueDay)}
        onChange={(value) => setState((prev) => ({ ...prev, dueDay: parseInt(value, 10) }))}
        options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
      />

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="autoRegister"
          checked={state.autoRegister}
          onChange={(e) => setState((prev) => ({ ...prev, autoRegister: e.target.checked }))}
          className="w-5 h-5 rounded"
          style={{ accentColor: '#0A84FF' }}
        />
        <label
          htmlFor="autoRegister"
          className="font-monda text-[10px] tracking-[0.35em] text-white/70 uppercase"
          style={{ marginBottom: 0 }}
        >
          Registrar automáticamente cada mes
        </label>
      </div>

      <div className="text-[11px] font-roboto text-white/70 p-3 rounded-2xl bg-black/50 border border-white/10">
     El sistema calculará la próxima fecha de vencimiento automáticamente
      </div>
    </div>
  );
}
