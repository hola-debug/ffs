import { useState } from 'react';
import { Period, Account } from '../../../lib/types';
import { BaseCard } from '../BaseCard';
import CountUp from '../../ui/CountUp';
import { CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { finishPeriod } from '../../../lib/edgeFunctions';
import { dispatchDashboardRefresh } from '../../../lib/dashboardEvents';

interface PeriodBalanceModuleProps {
  periods: Period[];
  accounts: Account[];
  onRefresh?: () => void;
}

export function PeriodBalanceModule({ periods, accounts, onRefresh }: PeriodBalanceModuleProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const activePeriod = periods.find(p => p.status === 'active');
  
  // Buscar cuenta principal para la devolución
  const primaryAccount = accounts.find(a => a.is_primary) || accounts[0];

  if (!activePeriod) {
    return (
      <BaseCard className="bg-gradient-to-br from-purple-900 to-purple-700 text-white h-[150px]">
        <div className="flex flex-col items-center justify-center h-full">
          <CalendarIcon className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs opacity-70">No hay periodo activo</p>
        </div>
      </BaseCard>
    );
  }

  const handleFinishPeriod = async () => {
    if (!activePeriod) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await finishPeriod({
        period_id: activePeriod.id,
        create_refund_transaction: activePeriod.remaining_amount > 0,
        refund_to_account_id: primaryAccount?.id,
      });
      
      if (!result.success) {
        setError(result.error || 'Error al finalizar periodo');
        return;
      }
      
      // Refrescar datos
      dispatchDashboardRefresh();
      if (onRefresh) onRefresh();
      setShowConfirm(false);
    } catch (err) {
      console.error('Error finishing period:', err);
      setError('Error inesperado al finalizar periodo');
    } finally {
      setLoading(false);
    }
  };

  // Calcular días restantes
  const endsAt = activePeriod.ends_at ? new Date(activePeriod.ends_at) : null;
  const today = new Date();
  const daysRemaining = endsAt 
    ? Math.max(0, Math.ceil((endsAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : activePeriod.days;

  return (
    <BaseCard className="bg-gradient-to-br from-purple-900 to-purple-700 text-white h-[150px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] sm:text-xs uppercase font-regular">
          SALDO DEL PERIODO
        </h2>
        <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      {/* Main Amount */}
      <div className="mb-3">
        <div className="flex items-baseline justify-center">
          <span className="text-[16px] font-bold">$</span>
          <CountUp
            from={0}
            to={Math.round(activePeriod.remaining_amount)}
            separator="."
            direction="up"
            duration={1}
            className="text-[32px] font-bold leading-none tracking-tighter"
          />
        </div>
      </div>

      {/* Period Info */}
      <div className="space-y-1 text-center mb-3">
        <div className="text-[10px] opacity-80">
          {activePeriod.name}
        </div>
        <div className="text-[10px] opacity-70">
          {daysRemaining} {daysRemaining === 1 ? 'día restante' : 'días restantes'}
        </div>
        <div className="text-[9px] opacity-60">
          Gastado: ${Math.round(activePeriod.spent_amount).toLocaleString('es-UY')} / ${Math.round(activePeriod.allocated_amount).toLocaleString('es-UY')}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-2 p-2 bg-red-500/20 border border-red-500 rounded text-red-200 text-[9px]">
          {error}
        </div>
      )}

      {/* Finish Period Button or Confirmation */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-medium uppercase tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CheckCircleIcon className="w-4 h-4" />
          Finalizar Periodo
        </button>
      ) : (
        <div className="space-y-2">
          <div className="text-[9px] text-center opacity-90 mb-2">
            {activePeriod.remaining_amount > 0 
              ? `¿Devolver $${Math.round(activePeriod.remaining_amount)} a ${primaryAccount?.name || 'cuenta principal'}?`
              : '¿Finalizar este periodo?'
            }
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded text-[9px] font-medium uppercase transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleFinishPeriod}
              disabled={loading}
              className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 rounded text-[9px] font-medium uppercase transition-colors disabled:opacity-50"
            >
              {loading ? 'Finalizando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </BaseCard>
  );
}
