import { useEffect, useRef, useState } from 'react';
import type { Account } from '../../../lib/types';
import { formatCurrency } from '../utils';
import GlassSurface from '../../../components/GlassSurface';

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
      <GlassSurface
        width="100%"
        borderRadius={26}
        borderWidth={0.05}
        brightness={90}
        opacity={0.85}
        blur={18}
        backgroundOpacity={0.35}
        saturation={1.25}
        displace={0.5}
        className="shadow-lg"
        innerClassName="p-0"
        innerStyle={{ padding: 0 }}
      >
        <button
          type="button"
          onClick={() => setOpen((state) => !state)}
          className="flex w-full items-center justify-between rounded-[21px] px-5 py-4 text-left text-sm uppercase outline-none transition focus-visible:ring-2 focus-visible:ring-[#0A84FF]"
        >
          {selectedAccount ? (
            <div>
              <p className="text-[11px] tracking-wide text-[#1E1E1E]/70">Cuenta seleccionada</p>
              <p className="text-base font-semibold text-[#0F172A]">{selectedAccount.name}</p>
              <p className="text-[11px] text-[#0F172A]/60">
                {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#0F172A]/70">Seleccioná una cuenta</p>
          )}
          <span className="ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-lg font-semibold text-[#0F172A] shadow-inner">
            {open ? '−' : '＋'}
          </span>
        </button>
      </GlassSurface>

      {open && (
        <div className="absolute z-20 mt-3 w-full">
          <GlassSurface
            width="100%"
            borderRadius={22}
            borderWidth={0.05}
            brightness={95}
            opacity={0.92}
            blur={22}
            backgroundOpacity={0.4}
            saturation={1.3}
            displace={0.6}
            className="shadow-xl"
            innerClassName="p-0"
            innerStyle={{ padding: 0 }}
          >
            <ul className="max-h-64 overflow-auto py-2">
              {accounts.map((account) => {
                const isSelected = account.id === selectedAccount?.id;
                return (
                  <li key={account.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(account.id)}
                      className={`flex w-full flex-col gap-1 px-5 py-3 text-left text-[11px] uppercase tracking-wide transition ${
                        isSelected
                          ? 'bg-white/25 font-semibold text-[#0F172A]'
                          : 'text-[#0F172A]/80 hover:bg-white/15'
                      }`}
                    >
                      <span className="text-base normal-case">{account.name}</span>
                      <span className="text-[11px] text-[#0F172A]/70">
                        {formatCurrency(account.balance, account.currency)} · {account.type}
                      </span>
                    </button>
                  </li>
                );
              })}
              {accounts.length === 0 && (
                <li className="px-5 py-3 text-center text-xs uppercase text-[#0F172A]/60">
                  No hay cuentas disponibles
                </li>
              )}
            </ul>
          </GlassSurface>
        </div>
      )}
    </div>
  );
}
