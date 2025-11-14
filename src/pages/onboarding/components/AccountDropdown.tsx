import { useEffect, useRef, useState } from 'react';
import type { Account } from '../../../lib/types';
import { formatCurrency } from '../utils';

interface AccountDropdownProps {
  accounts: Account[];
  selectedId?: string;
  onSelect: (accountId: string) => void;
}

export function AccountDropdown({ accounts, selectedId, onSelect }: AccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedAccount = accounts.find((account) => account.id === selectedId) ?? accounts[0];

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('click', handler);
    }

    return () => document.removeEventListener('click', handler);
  }, [open]);

  const handleSelect = (accountId: string) => {
    onSelect(accountId);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm uppercase outline-none transition hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-black"
      >
        {selectedAccount ? (
          <div>
            <p className="text-xs text-gray-500">Cuenta seleccionada</p>
            <p className="text-base font-semibold text-gray-900">{selectedAccount.name}</p>
            <p className="text-xs text-gray-500">
              {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Seleccioná una cuenta</p>
        )}
        <span className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-base">
          {open ? '−' : '＋'}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-lg">
          <ul className="max-h-60 overflow-auto py-2">
            {accounts.map((account) => {
              const isSelected = account.id === selectedAccount?.id;
              return (
                <li key={account.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(account.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left text-xs uppercase transition hover:bg-gray-100 ${
                      isSelected ? 'bg-gray-100 font-semibold' : ''
                    }`}
                  >
                    <span className="text-base">{account.name}</span>
                    <span className="text-[11px] text-gray-500">
                      {formatCurrency(account.balance, account.currency)} · {account.type}
                    </span>
                  </button>
                </li>
              );
            })}
            {accounts.length === 0 && (
              <li className="px-4 py-3 text-center text-xs uppercase text-gray-400">
                No hay cuentas disponibles
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
