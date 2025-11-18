import { memo, useMemo, useEffect } from 'react';
import { GlassField, GlassSelect } from '@/components/IOSModal';
import GlassDropdown from '@/components/GlassDropdown';
import { PocketFieldsProps } from '../types';
import { CurrencyCode } from '@/lib/types';

const formatBalance = (value: number, currency: CurrencyCode) =>
  value.toLocaleString('es-UY', { style: 'currency', currency });

const EMOJIS = ['💰', '🎯', '🛒', '🏖️', '🏠', '🚗', '🎮', '📚', '✈️', '🎉', '🍔', '⚡', '📱', '🎬', '🏋️'] as const;

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
        <label className="font-monda text-[10px] tracking-[0.35em] text-white/60 uppercase">Emoji</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setState((prev) => ({ ...prev, emoji: e }))}
              className="text-2xl p-2 rounded transition-all"
              style={{
                background: state.emoji === e ? 'rgba(10, 132, 255, 0.9)' : 'rgba(120, 120, 128, 0.16)',
                border: state.emoji === e ? '2px solid rgba(10, 132, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
                transform: state.emoji === e ? 'scale(1.1)' : 'scale(1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {e}
            </button>
          ))}
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
        <GlassSelect
          label="Cuenta de pago (opcional)"
          value={state.linkedAccountId}
          onChange={(e) => setState((prev) => ({ ...prev, linkedAccountId: e.target.value }))}
        >
          <option value="">No especificar</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </GlassSelect>
      )}
    </div>
  );
}

export const CommonFields = memo(CommonFieldsComponent);
