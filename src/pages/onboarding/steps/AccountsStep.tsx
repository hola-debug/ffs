import type { Dispatch, SetStateAction } from 'react';
import type { Account } from '../../../lib/types';
import type { AccountFormState } from '../types';
import { formatCurrency } from '../utils';

interface AccountsStepProps {
  accounts: Account[];
  totalBalance: number;
  accountForm: AccountFormState;
  setAccountForm: Dispatch<SetStateAction<AccountFormState>>;
  onAddAccount: () => void;
  savingAccount: boolean;
}

export function AccountsStep({
  accounts,
  totalBalance,
  accountForm,
  setAccountForm,
  onAddAccount,
  savingAccount,
}: AccountsStepProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-xl font-semibold uppercase">¿Dónde guardás tu plata?</p>
        <p className="text-sm text-gray-500 uppercase">
          Agregá tus cuentas o billeteras para calcular tu saldo real
        </p>
      </header>

      <div className="rounded-[32px] bg-gray-100 p-4 text-center">
        <p className="text-sm uppercase text-gray-600">Agregá tus billeteras</p>
        <button
          type="button"
          onClick={onAddAccount}
          disabled={savingAccount}
          className="mt-2 rounded-full bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide disabled:opacity-50"
        >
          {savingAccount ? '...' : '+'}
        </button>
        <div className="mt-4 space-y-3 text-left">
          <label className="text-xs uppercase tracking-wide text-gray-500">Nombre</label>
          <input
            type="text"
            value={accountForm.name}
            onChange={(event) =>
              setAccountForm((state) => ({ ...state, name: event.target.value }))
            }
            placeholder="Nombre de la cuenta"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm uppercase outline-none"
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Divisa
              </label>
              <input
                type="text"
                value={accountForm.currency}
                maxLength={3}
                onChange={(event) =>
                  setAccountForm((state) => ({ ...state, currency: event.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm uppercase outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Tipo</label>
              <select
                value={accountForm.type}
                onChange={(event) =>
                  setAccountForm((state) => ({
                    ...state,
                    type: event.target.value as AccountFormState['type'],
                  }))
                }
                className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm uppercase outline-none"
              >
                <option value="cash">Efectivo</option>
                <option value="bank">Banco</option>
                <option value="wallet">Wallet</option>
                <option value="crypto">Cripto</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Saldo 
              </label>
              <input
                type="number"
                value={accountForm.balance}
                onChange={(event) =>
                  setAccountForm((state) => ({ ...state, balance: event.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm uppercase outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="rounded-[28px] bg-gray-100 px-5 py-4 text-sm uppercase"
          >
            <p className="text-base font-semibold">{account.name}</p>
            <div className="mt-3 grid grid-cols-2 gap-1 text-gray-600">
              <div>
                <p className="text-[11px] tracking-wide">Saldo actual</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(account.balance, account.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] tracking-wide">Divisa</p>
                <p className="text-lg font-semibold">{account.currency}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] bg-gray-900 px-5 py-4 text-white">
        <p className="text-sm uppercase tracking-wide text-gray-300">Total</p>
        <p className="text-3xl font-semibold">{formatCurrency(totalBalance)}</p>
        <p className="mt-1 text-xs uppercase text-gray-300">
          Este valor será tu punto cero: el saldo inicial desde donde partimos.
        </p>
      </div>
    </div>
  );
}
