import { useEffect, useMemo, useRef } from 'react';
import CountUp from '../../ui/CountUp';
import { Account, getAccountBalance } from '../../../lib/types';
import { BaseCard } from '../BaseCard';
import { BanknotesIcon } from '@heroicons/react/24/outline';

interface AccountsBalanceModuleProps {
  accounts: Account[];
}

export function AccountsBalanceModule({ accounts }: AccountsBalanceModuleProps) {
  // Calcular el balance total de todas las cuentas (divisas primarias)
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => sum + getAccountBalance(account), 0);
  }, [accounts]);

  const prevTotalBalanceRef = useRef(0);
  const totalDirection = totalBalance < prevTotalBalanceRef.current ? 'down' : 'up';

  useEffect(() => {
    prevTotalBalanceRef.current = totalBalance;
  }, [totalBalance]);

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

  const prevBalancesRef = useRef<Record<string, number>>({});
  const balancesWithPrevious = useMemo(() => {
    return balancesByCurrency.map((entry) => ({
      ...entry,
      previousBalance: prevBalancesRef.current[entry.currency] ?? entry.balance
    }));
  }, [balancesByCurrency]);

  useEffect(() => {
    const next: Record<string, number> = {};
    balancesByCurrency.forEach(({ currency, balance }) => {
      next[currency] = balance;
    });
    prevBalancesRef.current = next;
  }, [balancesByCurrency]);

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
          <CountUp
            to={Math.round(totalBalance)}
            from={Math.round(prevTotalBalanceRef.current)}
            direction={totalDirection}
            duration={1}
            separator="."
            className="text-[32px] font-bold leading-none tracking-tighter"
          />
        </div>
      </div>

      {/* Breakdown by Currency */}
      <div className="space-y-1">
        {balancesByCurrency.length > 1 ? (
          <div className="text-center space-y-0.5">
            {balancesWithPrevious.map(({ currency, balance, previousBalance }) => (
              <div key={currency} className="text-[9px] opacity-70">
                {currency}:{' '}
                <CountUp
                  to={Math.round(balance)}
                  from={Math.round(previousBalance)}
                  direction={balance < previousBalance ? 'down' : 'up'}
                  duration={0.8}
                  separator="."
                  className="text-[9px] font-semibold"
                />
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
