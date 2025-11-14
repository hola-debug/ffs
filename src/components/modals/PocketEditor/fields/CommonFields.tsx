import { memo, useMemo, useEffect } from 'react';
import { GlassField, GlassSelect } from '@/components/IOSModal';
import { PocketFieldsProps } from '../types';
import { CurrencyCode } from '@/lib/types';

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
        <label className="ios-label">Emoji</label>
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

      <GlassSelect
        label="Cuenta"
        value={state.accountId}
        onChange={(e) => setState((prev) => ({ ...prev, accountId: e.target.value }))}
        required
      >
        <option value="">Selecciona una cuenta</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name}
          </option>
        ))}
      </GlassSelect>

      <GlassSelect
        label="Divisa"
        value={state.currency || ''}
        onChange={(e) => setState((prev) => ({ ...prev, currency: e.target.value as CurrencyCode }))}
        required
        disabled={!state.accountId || availableCurrencies.length === 0}
      >
        <option value="" disabled>Seleccionar divisa</option>
        {availableCurrencies.map((curr) => (
          <option key={curr.id} value={curr.currency}>
            {curr.currency} {curr.is_primary ? '(Principal)' : ''} - Saldo: ${curr.balance.toFixed(2)}
          </option>
        ))}
      </GlassSelect>

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
