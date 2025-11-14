import { GlassField, GlassSelect } from '@/components/IOSModal';
import { PocketFieldsProps } from '../../types';
import { useMemo } from 'react';

export function SavingFields({ state, setState }: PocketFieldsProps) {
  // Calcular contribución recomendada
  const recommendedContribution = useMemo(() => {
    const target = parseFloat(state.targetAmount);
    if (!target || state.frequency === 'none') return null;

    let periods = 0;
    if (state.savingDateMode === 'days' && state.savingDaysDuration) {
      const days = parseInt(state.savingDaysDuration);
      periods = state.frequency === 'weekly' ? Math.ceil(days / 7) : Math.ceil(days / 30);
    } else if (state.savingDateMode === 'dates' && state.endsAt) {
      const end = new Date(state.endsAt);
      const today = new Date();
      const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      periods = state.frequency === 'weekly' ? Math.ceil(days / 7) : Math.ceil(days / 30);
    }

    if (periods > 0) {
      const contribution = (target / periods).toFixed(2);
      const label = state.frequency === 'weekly' ? 'semanal' : 'mensual';
      return `Aporte ${label} sugerido: $${contribution} (${periods} ${state.frequency === 'weekly' ? 'semanas' : 'meses'})`;
    }
    return null;
  }, [state.targetAmount, state.frequency, state.savingDateMode, state.savingDaysDuration, state.endsAt]);

  const hasDeadline = state.savingDateMode === 'days' ? !!state.savingDaysDuration : !!state.endsAt;

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
        <option value="none">Sin frecuencia</option>
        <option value="monthly">Mensual</option>
        <option value="weekly">Semanal</option>
      </GlassSelect>

      {/* Selector de modo de fecha */}
      <div className="space-y-3">
        <label className="ios-label">¿Tienes fecha límite? (opcional)</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, savingDateMode: 'days' }))}
            className={`p-3 rounded-xl transition-all ${
              state.savingDateMode === 'days'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <div className="text-sm font-semibold">Por días</div>
            <div className="text-xs mt-1 opacity-75">Cantidad de días</div>
          </button>
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, savingDateMode: 'dates' }))}
            className={`p-3 rounded-xl transition-all ${
              state.savingDateMode === 'dates'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <div className="text-sm font-semibold">Por fecha</div>
            <div className="text-xs mt-1 opacity-75">Fecha específica</div>
          </button>
        </div>
      </div>

      {/* Campos según modo seleccionado */}
      {state.savingDateMode === 'days' ? (
        <GlassField
          label="Cantidad de días (opcional)"
          type="number"
          value={state.savingDaysDuration}
          onChange={(e) => setState((prev) => ({ ...prev, savingDaysDuration: e.target.value }))}
          placeholder="180 (6 meses)"
        />
      ) : (
        <GlassField
          label="Fecha límite (opcional)"
          type="date"
          value={state.endsAt}
          onChange={(e) => setState((prev) => ({ ...prev, endsAt: e.target.value }))}
        />
      )}

      {/* Preview de contribución recomendada */}
      {recommendedContribution && (
        <div className="text-sm text-green-400 p-3 rounded-xl bg-green-950/30 border border-green-800/30">
          🎯 {recommendedContribution}
        </div>
      )}

      {!hasDeadline && state.frequency !== 'none' && (
        <div className="text-xs text-gray-500">
          ℹ️ Sin fecha límite, no se puede calcular aporte recomendado
        </div>
      )}

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
