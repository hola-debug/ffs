import { GlassField } from '@/components/IOSModal';
import GlassDropdown from '@/components/GlassDropdown';
import GlassToggle from '@/components/GlassToggle';
import { PocketFieldsProps } from '../../types';
import { useMemo, useEffect } from 'react';

export function DebtFields({ state, setState }: PocketFieldsProps) {
  // Auto-calcular según el modo seleccionado
  useEffect(() => {
    const original = parseFloat(state.originalAmount);
    if (!original || original <= 0) return;

    if (state.debtInputMode === 'installments' && state.installmentsTotal) {
      const installments = parseInt(state.installmentsTotal);
      if (installments > 0) {
        const calculated = (original / installments).toFixed(2);
        setState((prev) => ({ ...prev, installmentAmount: calculated }));
      }
    } else if (state.debtInputMode === 'amount' && state.installmentAmount) {
      const amount = parseFloat(state.installmentAmount);
      if (amount > 0) {
        const calculated = Math.ceil(original / amount).toString();
        setState((prev) => ({ ...prev, installmentsTotal: calculated }));
      }
    }
  }, [state.debtInputMode, state.originalAmount, state.installmentsTotal, state.installmentAmount, setState]);

  // Preview de información
  const debtInfo = useMemo(() => {
    const original = parseFloat(state.originalAmount);
    const installments = parseInt(state.installmentsTotal);
    const amount = parseFloat(state.installmentAmount);

    if (original > 0 && installments > 0 && amount > 0) {
      const total = amount * installments;
      const difference = total - original;
      return {
        installments,
        amount: amount.toFixed(2),
        total: total.toFixed(2),
        difference: difference.toFixed(2),
      };
    }
    return null;
  }, [state.originalAmount, state.installmentsTotal, state.installmentAmount]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="font-monda text-[10px] tracking-[0.35em] text-white/70 uppercase">DEUDA</p>
        <p className="font-roboto text-[11px] text-white/60">Define cuotas, intereses y vencimientos.</p>
      </div>

      <GlassField
        label="Monto total de la deuda"
        type="number"
        step="0.01"
        value={state.originalAmount}
        onChange={(e) => setState((prev) => ({ ...prev, originalAmount: e.target.value }))}
        required
        placeholder="0.00"
      />

      {/* Selector de modo de entrada */}
      <div className="space-y-3">
        <label className="font-monda text-[10px] tracking-[0.35em] text-white/60 uppercase">¿Qué dato conoces?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              mode: 'installments' as const,
              title: 'Cantidad de cuotas',
              description: 'Calculamos el monto por cuota',
            },
            {
              mode: 'amount' as const,
              title: 'Monto por cuota',
              description: 'Calculamos cuántas cuotas necesitas',
            },
          ].map((option) => {
            const isSelected = state.debtInputMode === option.mode;
            return (
              <button
                key={option.mode}
                type="button"
                onClick={() => setState((prev) => ({ ...prev, debtInputMode: option.mode }))}
                className={`w-full text-left rounded-[20px] border px-5 py-4 transition-all ${
                  isSelected
                    ? 'border-[#67F690] bg-black/70 text-white shadow-[0_20px_45px_rgba(0,0,0,0.65)]'
                    : 'border-white/12 bg-black/40 text-white/70 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-monda text-[11px] tracking-[0.35em] uppercase">{option.title}</p>
                    <p className="font-roboto text-[11px] text-white/60 mt-1">{option.description}</p>
                  </div>
                  <span
                    className={`ml-3 flex h-7 w-7 items-center justify-center rounded-[12px] border transition-all ${
                      isSelected
                        ? 'bg-[#67F690] border-[#67F690] text-black shadow-[0_0_15px_rgba(103,246,144,0.45)]'
                        : 'bg-black/20 border-white/15 text-white/40'
                    }`}
                  >
                    {isSelected && (
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <path
                          d="M1 5L4.5 8.5L13 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campos según modo seleccionado */}
      <div className="grid grid-cols-2 gap-4">
        {state.debtInputMode === 'installments' ? (
          <>
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
              placeholder="Auto-calculado"
              disabled
            />
          </>
        ) : (
          <>
            <GlassField
              label="Monto por cuota"
              type="number"
              step="0.01"
              value={state.installmentAmount}
              onChange={(e) => setState((prev) => ({ ...prev, installmentAmount: e.target.value }))}
              required
              placeholder="0.00"
            />
            <GlassField
              label="Total de cuotas"
              type="number"
              value={state.installmentsTotal}
              onChange={(e) => setState((prev) => ({ ...prev, installmentsTotal: e.target.value }))}
              placeholder="Auto-calculado"
              disabled
            />
          </>
        )}
      </div>

      {/* Preview de información */}
      {debtInfo && (
        <div className="text-[11px] font-roboto p-3 rounded-2xl bg-purple-950/30 border border-purple-800/30">
          <div className="text-[#67F690] font-semibold mb-2 tracking-[0.08em] uppercase">📊 Resumen de la deuda:</div>
          <div className="text-white/80 space-y-1 text-[10px]">
            <div>• {debtInfo.installments} cuotas de ${debtInfo.amount}</div>
            <div>• Total a pagar: ${debtInfo.total}</div>
            {parseFloat(debtInfo.difference) > 0 && (
              <div className="text-red-400">• Intereses: +${debtInfo.difference}</div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <GlassDropdown
          label="Día de vencimiento"
          placeholder="Seleccionar día"
          value={state.debtDueDay ? String(state.debtDueDay) : undefined}
          onChange={(value) => setState((prev) => ({ ...prev, debtDueDay: parseInt(value, 10) }))}
          options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
        />
        <GlassField
          label="Tasa de interés (%) opcional"
          type="number"
          step="0.01"
          value={state.interestRate}
          onChange={(e) => setState((prev) => ({ ...prev, interestRate: e.target.value }))}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-3">
        <p className="font-monda text-[10px] tracking-[0.35em] text-white/60 uppercase">Pago automático</p>
        <GlassToggle
          label="Pago automático"
          activeLabel="Pago automático activado"
          inactiveLabel="Activar pago automático"
          descriptionOn="Registraremos cada cuota en la fecha de vencimiento."
          descriptionOff="Pulsa para que registremos los pagos automáticamente."
          value={state.automaticPayment}
          onChange={(value) => setState((prev) => ({ ...prev, automaticPayment: value }))}
        />
      </div>

      <div className="text-[10px] font-roboto text-white/60">
        ℹEl sistema calculará automáticamente la próxima fecha de vencimiento
      </div>
    </div>
  );
}
