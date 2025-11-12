import { Account, Pocket } from '../../../lib/types';
import { BaseCard } from '../BaseCard';
import CountUp from '../../ui/CountUp';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

interface TotalMoneyModuleProps {
  accounts: Account[];
  pockets: Pocket[];
}

export function TotalMoneyModule({ accounts, pockets }: TotalMoneyModuleProps) {
  // Calcular el total de dinero disponible
  const totalMoney = useMemo(() => {
    // Sumar saldo de cuentas
    const accountsTotal = accounts.reduce((sum, account) => sum + account.balance, 0);
    
    // Sumar saldo de bolsas de GASTO (expense)
    const pocketsTotal = pockets
      .filter(p => p.type === 'expense' && p.status === 'active')
      .reduce((sum, pocket) => sum + pocket.current_balance, 0);
    
    return accountsTotal + pocketsTotal;
  }, [accounts, pockets]);

  // Agrupar por currency para mostrar desglose
  const breakdownByCurrency = useMemo(() => {
    const grouped: Record<string, { accounts: number; pockets: number }> = {};

    // Agrupar cuentas
    accounts.forEach(account => {
      if (!grouped[account.currency]) {
        grouped[account.currency] = { accounts: 0, pockets: 0 };
      }
      grouped[account.currency].accounts += account.balance;
    });

    // Agrupar bolsas de gasto
    pockets
      .filter(p => p.type === 'expense' && p.status === 'active')
      .forEach(pocket => {
        if (!grouped[pocket.currency]) {
          grouped[pocket.currency] = { accounts: 0, pockets: 0 };
        }
        grouped[pocket.currency].pockets += pocket.current_balance;
      });

    return Object.entries(grouped)
      .map(([currency, values]) => ({
        currency,
        total: values.accounts + values.pockets,
        accounts: values.accounts,
        pockets: values.pockets,
      }))
      .sort((a, b) => b.total - a.total);
  }, [accounts, pockets]);

  return (
    <BaseCard className="bg-gradient-to-br from-green-600 to-green-800 text-white h-[150px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] sm:text-xs uppercase font-regular">
          PLATA TOTAL
        </h2>
        <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      {/* Main Amount */}
      <div className="mb-3">
        <div className="flex items-baseline justify-center">
          <span className="text-[16px] font-bold">$</span>
          <CountUp
            from={0}
            to={Math.round(totalMoney)}
            separator="."
            direction="up"
            duration={1}
            className="text-[32px] font-bold leading-none tracking-tighter"
          />
        </div>
      </div>

      {/* Breakdown Info */}
      <div className="space-y-1">
        {breakdownByCurrency.length > 1 ? (
          <div className="text-center space-y-0.5">
            {breakdownByCurrency.map(({ currency, total }) => (
              <div key={currency} className="text-[9px] opacity-70">
                {currency}: ${Math.round(total).toLocaleString('es-UY')}
              </div>
            ))}
          </div>
        ) : breakdownByCurrency.length === 1 ? (
          <div className="text-center space-y-0.5">
            {breakdownByCurrency[0].accounts > 0 && (
              <div className="text-[9px] opacity-70">
                CA CUENTAS: ${Math.round(breakdownByCurrency[0].accounts).toLocaleString('es-UY')}
              </div>
            )}
            {breakdownByCurrency[0].pockets > 0 && (
              <div className="text-[9px] opacity-70">
                CA PESOS: ${Math.round(breakdownByCurrency[0].pockets).toLocaleString('es-UY')}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-[10px] opacity-70">
            Sin fondos
          </div>
        )}
      </div>
    </BaseCard>
  );
}
