import { GlassField } from '@/components/IOSModal';
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
        <label className="ios-label">¿Cómo quieres definir el período?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, periodDateMode: 'days' }))}
            className={`p-3 rounded-xl transition-all ${
              state.periodDateMode === 'days'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <div className="text-sm font-semibold">Por días</div>
            <div className="text-xs mt-1 opacity-75">Cantidad de días</div>
          </button>
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, periodDateMode: 'dates' }))}
            className={`p-3 rounded-xl transition-all ${
              state.periodDateMode === 'dates'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <div className="text-sm font-semibold">Por fechas</div>
            <div className="text-xs mt-1 opacity-75">Inicio y fin</div>
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
      )}

      {/* Preview info */}
      {previewInfo && (
        <div className="text-sm text-blue-400 p-3 rounded-xl bg-blue-950/30 border border-blue-800/30">
          💡 {previewInfo}
        </div>
      )}

      {state.periodDateMode === 'days' && (
        <div className="text-xs text-gray-500">
          ℹ️ La bolsa comenzará hoy y durará {state.periodDaysDuration || '0'} días
        </div>
      )}
    </div>
  );
}
