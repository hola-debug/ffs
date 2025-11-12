import { Pocket } from '../../../lib/types';
import { BaseCard } from '../BaseCard';
import CountUp from '../../ui/CountUp';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

interface TotalSavingsModuleProps {
  pockets: Pocket[];
}

export function TotalSavingsModule({ pockets }: TotalSavingsModuleProps) {
  // Calcular el total de ahorros
  const totalSavings = useMemo(() => {
    return pockets
      .filter(p => p.type === 'saving' && p.status === 'active')
      .reduce((sum, pocket) => sum + pocket.current_balance, 0);
  }, [pockets]);

  // Agrupar ahorros por currency
  const savingsByCurrency = useMemo(() => {
    const grouped = pockets
      .filter(p => p.type === 'saving' && p.status === 'active')
      .reduce((acc, pocket) => {
        if (!acc[pocket.currency]) {
          acc[pocket.currency] = 0;
        }
        acc[pocket.currency] += pocket.current_balance;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [pockets]);

  // Contar bolsas de ahorro activas
  const activeSavingPockets = useMemo(() => {
    return pockets.filter(p => p.type === 'saving' && p.status === 'active').length;
  }, [pockets]);

  return (
    <BaseCard className="bg-gradient-to-br from-red-600 to-red-800 text-white h-[150px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] sm:text-xs uppercase font-regular">
          AHORRO TOTAL
        </h2>
        <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      {/* Main Amount */}
      <div className="mb-3">
        <div className="flex items-baseline justify-center">
          <span className="text-[16px] font-bold">$</span>
          <CountUp
            from={0}
            to={Math.round(totalSavings)}
            separator="."
            direction="up"
            duration={1}
            className="text-[32px] font-bold leading-none tracking-tighter"
          />
        </div>
      </div>

      {/* Savings Info */}
      <div className="space-y-1">
        {savingsByCurrency.length > 1 ? (
          <div className="text-center space-y-0.5">
            {savingsByCurrency.map(([currency, balance]) => (
              <div key={currency} className="text-[9px] opacity-70">
                {currency}: ${Math.round(balance).toLocaleString('es-UY')}
              </div>
            ))}
          </div>
        ) : savingsByCurrency.length === 1 ? (
          <div className="text-center space-y-0.5">
            <div className="text-[9px] opacity-70">
              CRITPO: ${Math.round(savingsByCurrency[0][1]).toLocaleString('es-UY')}
            </div>
          </div>
        ) : (
          <div className="text-center text-[10px] opacity-70">
            Sin ahorros
          </div>
        )}
        {activeSavingPockets > 0 && (
          <div className="text-center text-[10px] opacity-70">
            {activeSavingPockets} {activeSavingPockets === 1 ? 'bolsa' : 'bolsas'}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
