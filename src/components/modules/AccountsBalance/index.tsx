import { Account, getAccountBalance } from '../../../lib/types';
import { BaseCard } from '../BaseCard';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

interface AccountsBalanceModuleProps {
  accounts: Account[];
}

export function AccountsBalanceModule({ accounts }: AccountsBalanceModuleProps) {
  // Calcular el balance total de todas las cuentas (divisas primarias)
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => sum + getAccountBalance(account), 0);
  }, [accounts]);

  // Agrupar por moneda
  const balancesByCurrency = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    accounts.forEach(account => {
      // Agrupar cada divisa de cada cuenta
      account.currencies?.forEach(curr => {
        if (!grouped[curr.currency]) {
          grouped[curr.currency] = 0;
        }
        grouped[curr.currency] += curr.balance;
      });
    });

    return Object.entries(grouped)
      .map(([currency, balance]) => ({ currency, balance }))
      .sort((a, b) => b.balance - a.balance);
  }, [accounts]);

  return (
    <BaseCard className="bg-gradient-to-br from-blue-600 to-blue-800 text-white h-[150px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] sm:text-xs uppercase font-regular">
          BALANCE CUENTAS
        </h2>
        <BanknotesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      {/* Main Amount */}
      <div className="mb-3">
        <div className="flex items-baseline justify-center">
          <span className="text-[16px] font-bold">$</span>
          <span className="text-[32px] font-bold leading-none tracking-tighter">
            {Math.round(totalBalance).toLocaleString('es-UY')}
          </span>
        </div>
      </div>

      {/* Breakdown by Currency */}
      <div className="space-y-1">
        {balancesByCurrency.length > 1 ? (
          <div className="text-center space-y-0.5">
            {balancesByCurrency.map(({ currency, balance }) => (
              <div key={currency} className="text-[9px] opacity-70">
                {currency}: ${Math.round(balance).toLocaleString('es-UY')}
              </div>
            ))}
          </div>
        ) : balancesByCurrency.length === 1 ? (
          <div className="text-center">
            <div className="text-[9px] opacity-70">
              {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
            </div>
          </div>
        ) : (
          <div className="text-center text-[10px] opacity-70">
            Sin cuentas
          </div>
        )}
      </div>
    </BaseCard>
  );
}
