import { GlassField } from '@/components/IOSModal';
import GlassDropdown from '@/components/GlassDropdown';
import { PocketFieldsProps } from '../../types';

export function ExpenseRecurrentFields({ state, setState }: PocketFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="font-monda text-[10px] tracking-[0.35em] text-white/70 uppercase">GASTO RECURRENTE</p>
        <p className="font-roboto text-[11px] text-white/60">Controla vencimientos y montos variables.</p>
      </div>

      <GlassField
        label="Monto promedio"
        type="number"
        step="0.01"
        value={state.averageAmount}
        onChange={(e) => setState((prev) => ({ ...prev, averageAmount: e.target.value }))}
        required
        placeholder="0.00"
      />

      <GlassDropdown
        label="Día de vencimiento"
        value={String(state.recurrentDueDay)}
        onChange={(value) => setState((prev) => ({ ...prev, recurrentDueDay: parseInt(value, 10) }))}
        options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
      />

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

      <div className="text-[11px] font-roboto text-white/70 p-3 rounded-2xl bg-black/50 border border-white/10">
        ℹEl sistema calculará automáticamente la próxima fecha de vencimiento y mantendrá un promedio
      </div>
    </div>
  );
}
