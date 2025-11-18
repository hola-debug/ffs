import { memo, useMemo, useEffect, useRef } from 'react';
import type { WheelEvent } from 'react';
import { GlassField } from '@/components/IOSModal';
import GlassDropdown from '@/components/GlassDropdown';
import { PocketIcon, POCKET_ICON_OPTIONS } from '@/components/PocketIcon';
import { PocketFieldsProps } from '../types';
import { CurrencyCode } from '@/lib/types';

const formatBalance = (value: number, currency: CurrencyCode) =>
  value.toLocaleString('es-UY', { style: 'currency', currency });

function CommonFieldsComponent({ state, setState, accounts }: PocketFieldsProps) {
  // Obtener las divisas disponibles de la cuenta seleccionada
  const availableCurrencies = useMemo(() => {
    const account = accounts.find(a => a.id === state.accountId);
    return account?.currencies || [];
  }, [accounts, state.accountId]);

  // Cuando cambia la cuenta, actualizar la divisa
  useEffect(() => {
    if (state.accountId && availableCurrencies.length > 0) {
      // Si no hay divisa seleccionada o la divisa actual no existe en la nueva cuenta
      const currencyExists = availableCurrencies.some(c => c.currency === state.currency);
      if (!state.currency || !currencyExists) {
        // Seleccionar la primaria o la primera disponible
        const primaryCurrency = availableCurrencies.find(c => c.is_primary);
        if (primaryCurrency) {
          setState((prev) => ({ ...prev, currency: primaryCurrency.currency }));
        } else {
          setState((prev) => ({ ...prev, currency: availableCurrencies[0].currency }));
        }
      }
    }
  }, [state.accountId, availableCurrencies]);
  const accountOptions = useMemo(
    () =>
      accounts.map((acc) => ({
        value: acc.id,
        label: acc.name,
        description:
          acc.currencies
            ?.map((curr) => `${formatBalance(curr.balance, curr.currency)}${curr.is_primary ? ' · Principal' : ''}`)
            .join(' · ') || undefined,
      })),
    [accounts]
  );
  const hasAccounts = accountOptions.length > 0;
  const paymentAccountOptions = useMemo(
    () => [
      { value: '', label: 'No especificar', description: 'Cuenta con la que se paga la deuda' },
      ...accountOptions,
    ],
    [accountOptions]
  );

  const currencyOptions = useMemo(
    () =>
      availableCurrencies.map((curr) => ({
        value: curr.currency,
        label: curr.currency,
        description: `Saldo: ${formatBalance(curr.balance, curr.currency)}${curr.is_primary ? ' · Principal' : ''}`,
      })),
    [availableCurrencies]
  );

  const currencyDisabled = !state.accountId || availableCurrencies.length === 0;

  const iconOptionsLoop = useMemo(
    () => [...POCKET_ICON_OPTIONS, ...POCKET_ICON_OPTIONS, ...POCKET_ICON_OPTIONS],
    []
  );
  const iconScrollRef = useRef<HTMLDivElement>(null);
  const handleIconWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!iconScrollRef.current) return;
    if (event.deltaY === 0) return;
    event.preventDefault();
    iconScrollRef.current.scrollLeft += event.deltaY;
  };

  useEffect(() => {
    const el = iconScrollRef.current;
    if (!el) return;
    // Start roughly in the middle so there are icons to both sides
    el.scrollLeft = el.scrollWidth / 3;
  }, []);

  return (
    <div className="space-y-5">
      <GlassField
        label="Nombre"
        type="text"
        value={state.name}
        onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value }))}
        required
        placeholder="Ej: Supermercado, Ahorro, Netflix..."
      />

      <div>
        <label className="font-monda text-[10px] tracking-[0.35em] text-white/60 uppercase">Icono</label>
        <div
          ref={iconScrollRef}
          className="relative mt-2 overflow-x-auto overflow-y-hidden scrollbar-hide rounded-[22px] border border-white/10 bg-black/25"
          onWheel={handleIconWheel}
        >
          <div
            className="flex gap-2 min-w-max py-2 px-1"
          >
            {iconOptionsLoop.map((option, index) => {
              const key = `${option.id}-${index}`;
              const isSelected = state.emoji === option.id;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, emoji: option.id }))}
                  className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-2 min-w-[84px] shrink-0 transition-all ${
                    isSelected
                      ? 'border-[#67F690] bg-black/70 text-white shadow-[0_12px_30px_rgba(0,0,0,0.55)]'
                      : 'border-white/12 bg-black/30 text-white/70 hover:border-white/30'
                  }`}
                  aria-pressed={isSelected}
                >
                  <PocketIcon iconId={option.id} className="w-5 h-5" />
                  <span className="text-[9px] text-center font-roboto tracking-[0.08em] leading-tight">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <GlassDropdown
        label="Cuenta"
        value={state.accountId || undefined}
        onChange={(accountId) => setState((prev) => ({ ...prev, accountId }))}
        placeholder={hasAccounts ? 'Selecciona una cuenta' : 'No hay cuentas disponibles'}
        options={accountOptions}
        className={`w-full ${hasAccounts ? '' : 'pointer-events-none opacity-40'}`}
      />

      <GlassDropdown
        label="Divisa"
        value={state.currency || undefined}
        onChange={(currency) => setState((prev) => ({ ...prev, currency: currency as CurrencyCode }))}
        placeholder={currencyDisabled ? 'Selecciona una cuenta primero' : 'Seleccionar divisa'}
        options={currencyOptions}
        className={`w-full ${currencyDisabled ? 'pointer-events-none opacity-40' : ''}`}
      />

      {state.pocketType === 'debt' && (
        <GlassDropdown
          label="Cuenta de pago (opcional)"
          value={state.linkedAccountId ?? ''}
          onChange={(linkedAccountId) => setState((prev) => ({ ...prev, linkedAccountId }))}
          options={paymentAccountOptions}
          placeholder="No especificar"
        />
      )}
    </div>
  );
}

export const CommonFields = memo(CommonFieldsComponent);
