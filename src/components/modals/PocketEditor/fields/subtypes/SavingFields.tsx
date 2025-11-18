import { GlassField } from '@/components/IOSModal';
import GlassDropdown from '@/components/GlassDropdown';
import GlassDatePicker from '@/components/GlassDatePicker';
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
      <div className="space-y-1">
        <p className="font-monda text-[10px] tracking-[0.35em] text-white/70 uppercase">BOLSA DE AHORRO</p>
        <p className="font-roboto text-[11px] text-white/60">Define tu objetivo y frecuencia de aporte.</p>
      </div>

      <GlassField
        label="Monto objetivo"
        type="number"
        step="0.01"
        value={state.targetAmount}
        onChange={(e) => setState((prev) => ({ ...prev, targetAmount: e.target.value }))}
        required
        placeholder="0.00"
      />

      <GlassDropdown
        label="Frecuencia de aporte"
        value={state.frequency}
        onChange={(value) => setState((prev) => ({ ...prev, frequency: value as any }))}
        options={[
          { value: 'none', label: 'Sin frecuencia' },
          { value: 'monthly', label: 'Mensual' },
          { value: 'weekly', label: 'Semanal' },
        ]}
      />

      {/* Selector de modo de fecha */}
      <div className="space-y-3">
        <label className="font-monda text-[10px] tracking-[0.35em] text-white/60 uppercase">¿Tienes fecha límite? (opcional)</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, savingDateMode: 'days' }))}
            className={`rounded-[18px] border px-4 py-3 text-left transition-all ${
              state.savingDateMode === 'days'
                ? 'border-[#67F690] bg-black/70 text-white shadow-[0_20px_45px_rgba(0,0,0,0.7)]'
                : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30'
            }`}
          >
            <div className="font-monda text-[11px] tracking-[0.35em] uppercase">Por días</div>
            <div className="font-roboto text-[11px] text-white/60 mt-1">Cantidad de días</div>
          </button>
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, savingDateMode: 'dates' }))}
            className={`rounded-[18px] border px-4 py-3 text-left transition-all ${
              state.savingDateMode === 'dates'
                ? 'border-[#67F690] bg-black/70 text-white shadow-[0_20px_45px_rgba(0,0,0,0.7)]'
                : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30'
            }`}
          >
            <div className="font-monda text-[11px] tracking-[0.35em] uppercase">Por fecha</div>
            <div className="font-roboto text-[11px] text-white/60 mt-1">Fecha específica</div>
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
        <GlassDatePicker
          label="Fecha límite (opcional)"
          value={state.endsAt ? new Date(state.endsAt) : undefined}
          onChange={(date) => setState((prev) => ({ ...prev, endsAt: date.toISOString().split('T')[0] }))}
          placeholder="Selecciona la fecha"
        />
      )}

      {/* Preview de contribución recomendada */}
      {recommendedContribution && (
        <div className="text-[11px] text-[#67F690] font-roboto p-3 rounded-xl bg-green-950/30 border border-green-800/30 tracking-[0.08em]">
          🎯 {recommendedContribution}
        </div>
      )}

      {!hasDeadline && state.frequency !== 'none' && (
        <div className="text-[10px] font-roboto text-white/60">
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
        <label
          htmlFor="allowWithdrawals"
          className="font-monda text-[10px] tracking-[0.35em] text-white/70 uppercase"
          style={{ marginBottom: 0 }}
        >
          Permitir retiros antes de completar
        </label>
      </div>
    </div>
  );
}
