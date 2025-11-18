import { GlassField } from '@/components/IOSModal';
import GlassDatePicker from '@/components/GlassDatePicker';
import { PocketFieldsProps } from '../../types';
import { useMemo } from 'react';

export function ExpensePeriodFields({ state, setState }: PocketFieldsProps) {
  // Calcular información de preview
  const previewInfo = useMemo(() => {
    if (state.periodDateMode === 'days' && state.periodDaysDuration) {
      const days = parseInt(state.periodDaysDuration);
      const amount = parseFloat(state.allocatedAmount);
      if (days > 0 && amount > 0) {
        const dailyAllowance = (amount / days).toFixed(2);
        return `Duración: ${days} días • Presupuesto diario: $${dailyAllowance}`;
      }
    } else if (state.periodDateMode === 'dates' && state.startsAt && state.endsAt) {
      const start = new Date(state.startsAt);
      const end = new Date(state.endsAt);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const amount = parseFloat(state.allocatedAmount);
      if (days > 0 && amount > 0) {
        const dailyAllowance = (amount / days).toFixed(2);
        return `Duración: ${days} días • Presupuesto diario: $${dailyAllowance}`;
      }
    }
    return null;
  }, [state.periodDateMode, state.periodDaysDuration, state.startsAt, state.endsAt, state.allocatedAmount]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="font-monda text-[10px] tracking-[0.35em] text-white/70 uppercase">GASTO POR PERÍODO</p>
        <p className="font-roboto text-[11px] text-white/60">Configura duración y presupuesto para tu evento.</p>
      </div>

      <GlassField
        label="Monto asignado"
        type="number"
        step="0.01"
        value={state.allocatedAmount}
        onChange={(e) => setState((prev) => ({ ...prev, allocatedAmount: e.target.value }))}
        required
        placeholder="0.00"
      />

      {/* Selector de modo de entrada */}
      <div className="space-y-3">
        <label className="font-monda text-[10px] tracking-[0.35em] text-white/60 uppercase">¿Cómo quieres definir el período?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, periodDateMode: 'days' }))}
            className={`rounded-[18px] border px-4 py-3 text-left transition-all ${
              state.periodDateMode === 'days'
                ? 'border-[#67F690] bg-black/70 text-white shadow-[0_20px_45px_rgba(0,0,0,0.7)]'
                : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30'
            }`}
          >
            <div className="font-monda text-[11px] tracking-[0.35em] uppercase">Por días</div>
            <div className="font-roboto text-[11px] text-white/60 mt-1">Cantidad de días</div>
          </button>
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, periodDateMode: 'dates' }))}
            className={`rounded-[18px] border px-4 py-3 text-left transition-all ${
              state.periodDateMode === 'dates'
                ? 'border-[#67F690] bg-black/70 text-white shadow-[0_20px_45px_rgba(0,0,0,0.7)]'
                : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30'
            }`}
          >
            <div className="font-monda text-[11px] tracking-[0.35em] uppercase">Por fechas</div>
            <div className="font-roboto text-[11px] text-white/60 mt-1">Inicio y fin</div>
          </button>
        </div>
      </div>

      {/* Campos según modo seleccionado */}
      {state.periodDateMode === 'days' ? (
        <GlassField
          label="Cantidad de días"
          type="number"
          value={state.periodDaysDuration}
          onChange={(e) => setState((prev) => ({ ...prev, periodDaysDuration: e.target.value }))}
          required
          placeholder="30"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <GlassDatePicker
            className="w-full"
            label="Desde"
            value={state.startsAt ? new Date(state.startsAt) : undefined}
            onChange={(date) =>
              setState((prev) => ({ ...prev, startsAt: date.toISOString().split('T')[0] }))
            }
          />
          <GlassDatePicker
            className="w-full"
            label="Hasta"
            value={state.endsAt ? new Date(state.endsAt) : undefined}
            onChange={(date) =>
              setState((prev) => ({ ...prev, endsAt: date.toISOString().split('T')[0] }))
            }
            minDate={state.startsAt ? new Date(state.startsAt) : undefined}
          />
        </div>
      )}

      {/* Preview info */}
      {previewInfo && (
        <div className="text-[11px] text-[#67F690] font-roboto p-3 rounded-xl bg-blue-950/30 border border-blue-800/30">
          💡 {previewInfo}
        </div>
      )}

      {state.periodDateMode === 'days' && (
        <div className="text-[10px] font-roboto text-white/60">
          ℹ️ La bolsa comenzará hoy y durará {state.periodDaysDuration || '0'} días
        </div>
      )}
    </div>
  );
}
