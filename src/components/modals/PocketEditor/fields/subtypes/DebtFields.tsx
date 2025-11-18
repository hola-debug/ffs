import { GlassField } from '@/components/IOSModal';
import GlassDropdown from '@/components/GlassDropdown';
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
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, debtInputMode: 'installments' }))}
            className={`p-3 rounded-xl transition-all ${
              state.debtInputMode === 'installments'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <div className="text-sm font-semibold">Cantidad de cuotas</div>
            <div className="text-xs mt-1 opacity-75">Se calcula el monto</div>
          </button>
          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, debtInputMode: 'amount' }))}
            className={`p-3 rounded-xl transition-all ${
              state.debtInputMode === 'amount'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            <div className="text-sm font-semibold">Monto por cuota</div>
            <div className="text-xs mt-1 opacity-75">Se calcula la cantidad</div>
          </button>
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
          value={String(state.debtDueDay)}
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

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="automaticPayment"
          checked={state.automaticPayment}
          onChange={(e) => setState((prev) => ({ ...prev, automaticPayment: e.target.checked }))}
          className="w-5 h-5 rounded"
          style={{ accentColor: '#0A84FF' }}
        />
        <label
          htmlFor="automaticPayment"
          className="font-monda text-[10px] tracking-[0.35em] text-white/70 uppercase"
          style={{ marginBottom: 0 }}
        >
          Pago automático
        </label>
      </div>

      <div className="text-[10px] font-roboto text-white/60">
        ℹ️ El sistema calculará automáticamente la próxima fecha de vencimiento
      </div>
    </div>
  );
}
