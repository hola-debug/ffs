import { Account } from '../../../lib/types';
import { BaseCard } from '../BaseCard';
import CountUp from '../../ui/CountUp';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

interface AccountsBalanceModuleProps {
  accounts: Account[];
}

export function AccountsBalanceModule({ accounts }: AccountsBalanceModuleProps) {
  // Calcular el saldo total de todas las cuentas
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }, [accounts]);

  // Agrupar cuentas por currency para mostrar desglose
  const balanceByCurrency = useMemo(() => {
    const grouped = accounts.reduce((acc, account) => {
      if (!acc[account.currency]) {
        acc[account.currency] = 0;
      }
      acc[account.currency] += account.balance;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [accounts]);

  return (
    <BaseCard className="bg-gradient-to-br from-blue-900 to-blue-700 text-white h-[150px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] sm:text-xs uppercase font-regular">
          SALDO GENERAL
        </h2>
        <BanknotesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      {/* Main Amount */}
      <div className="mb-3">
        <div className="flex items-baseline justify-center">
          <span className="text-[16px] font-bold">$</span>
          <CountUp
            from={0}
            to={Math.round(totalBalance)}
            separator="."
            direction="up"
            duration={1}
            className="text-[32px] font-bold leading-none tracking-tighter"
          />
        </div>
      </div>

      {/* Accounts Info */}
      <div className="space-y-1">
        {balanceByCurrency.length > 1 ? (
          <div className="text-center space-y-0.5">
            {balanceByCurrency.map(([currency, balance]) => (
              <div key={currency} className="text-[9px] opacity-70">
                {currency}: ${Math.round(balance).toLocaleString('es-UY')}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[10px] opacity-70">
            {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
