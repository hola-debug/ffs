import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAccountsStore } from '../../hooks/useAccountsStore';
import IOSModal, { GlassField } from '../IOSModal';
import GlassDropdown from '../GlassDropdown';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CurrencyBalance {
  currency: string;
  balance: string;
  isPrimary: boolean;
}

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Banco' },
  { value: 'fintech', label: 'Fintech / Billetera Digital' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'crypto', label: 'Criptomonedas' },
  { value: 'investment', label: 'Inversiones' },
  { value: 'other', label: 'Otro' },
] as const;

const CURRENCIES = [
  { value: 'ARS', label: 'ARS - Peso Argentino' },
  { value: 'USD', label: 'USD - Dólar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'UYU', label: 'UYU - Peso Uruguayo' },
  { value: 'BRL', label: 'BRL - Real Brasileño' },
  { value: 'CLP', label: 'CLP - Peso Chileno' },
  { value: 'PEN', label: 'PEN - Sol Peruano' },
  { value: 'COP', label: 'COP - Peso Colombiano' },
  { value: 'MXN', label: 'MXN - Peso Mexicano' },
  { value: 'BTC', label: 'BTC - Bitcoin' },
] as const;

export default function AddAccountModal({ isOpen, onClose, onSuccess }: AddAccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'fintech' | 'crypto' | 'investment' | 'other'>('bank');
  const [currencyBalances, setCurrencyBalances] = useState<CurrencyBalance[]>([
    { currency: 'ARS', balance: '', isPrimary: true },
  ]);
  const { refetch } = useAccountsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCurrency = () => {
    const newCurrency = currencyBalances[0].currency === 'ARS' ? 'USD' : 'ARS';
    const alreadyExists = currencyBalances.some(cb => cb.currency === newCurrency);

    if (!alreadyExists) {
      setCurrencyBalances([
        ...currencyBalances,
        { currency: newCurrency, balance: '', isPrimary: false },
      ]);
    }
  };

  const handleRemoveCurrency = (index: number) => {
    if (currencyBalances.length > 1) {
      const newBalances = currencyBalances.filter((_, i) => i !== index);

      // Si removemos la primaria, marcar la primera como primaria
      if (currencyBalances[index].isPrimary && newBalances.length > 0) {
        newBalances[0].isPrimary = true;
      }

      setCurrencyBalances(newBalances);
    }
  };

  const handleCurrencyChange = (index: number, newCurrency: string) => {
    const newBalances = [...currencyBalances];
    newBalances[index].currency = newCurrency;
    setCurrencyBalances(newBalances);
  };

  const handleBalanceChange = (index: number, newBalance: string) => {
    const newBalances = [...currencyBalances];
    newBalances[index].balance = newBalance;
    setCurrencyBalances(newBalances);
  };

  const handlePrimaryChange = (index: number) => {
    const newBalances = currencyBalances.map((cb, i) => ({
      ...cb,
      isPrimary: i === index,
    }));
    setCurrencyBalances(newBalances);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Validar que hay al menos una divisa con balance
      if (currencyBalances.length === 0) {
        throw new Error('Debes agregar al menos una divisa');
      }

      // 1. Insertar la cuenta
      const { data: accountsData, error: insertError } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name,
          type,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error insertando cuenta:', insertError);
        throw new Error(`Error al crear cuenta: ${insertError.message}`);
      }

      if (!accountsData?.id) throw new Error('No se pudo crear la cuenta');

      const newAccountId = accountsData.id;

      // 2. Insertar todas las divisas en account_currencies con sus balances
      const currencyRecords = currencyBalances.map(cb => ({
        account_id: newAccountId,
        currency: cb.currency,
        is_primary: cb.isPrimary,
        balance: 0, // El balance se actualizará via trigger cuando se cree el movimiento
      }));

      let currenciesError = null;

      console.log('Insertando divisas para account_id:', newAccountId);
      console.log('Registros a insertar:', currencyRecords);

      // Insertar una por una para mejor diagnostico
      for (const record of currencyRecords) {
        console.log('Insertando record:', record);
        const result = await supabase
          .from('account_currencies')
          .insert([record]);

        console.log('Resultado del insert:', result);

        if (result.error) {
          console.error('Error insertando divisa', record.currency, ':', result.error);
          console.error('Error details:', {
            code: result.error.code,
            message: result.error.message,
            details: result.error.details,
            hint: result.error.hint,
          });
          currenciesError = result.error;
          break;
        }
      }

      if (currenciesError) {
        console.error('Error final:', currenciesError);
        throw new Error(`Error al guardar divisas: ${currenciesError.message || 'Error desconocido'}`);
      }

      // 3. Si hay saldos iniciales, crear movimientos de income (opcional)
      // NOTA: El balance ya se guardó en account_currencies, pero podemos registrar
      // un movimiento de "saldo inicial" para tener historial
      const balancesWithAmount = currencyBalances.filter(cb => parseFloat(cb.balance) > 0);
      if (balancesWithAmount.length > 0) {
        const movementRecords = balancesWithAmount.map(cb => ({
          user_id: user.id,
          account_id: newAccountId,
          type: 'income',
          amount: parseFloat(cb.balance) || 0,
          currency: cb.currency,
          description: `Saldo inicial en ${cb.currency}`,
          date: new Date().toISOString().split('T')[0],
        }));

        const { error: movementError } = await supabase
          .from('movements')
          .insert(movementRecords);

        if (movementError) {
          console.warn('Cuenta creada pero no se pudieron registrar los movimientos iniciales:', movementError);
        }
      }

      await refetch();

      // Reset form
      setName('');
      setType('bank');
      setCurrencyBalances([{ currency: 'ARS', balance: '', isPrimary: true }]);

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} title="Agregar Cuenta">
      {error && (
        <div className="mb-4 ios-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlassField
          label="Nombre"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ej: Banco Nación, Billetera..."
        />

        <GlassDropdown
          label="Tipo de cuenta"
          value={type}
          onChange={(val) => setType(val as any)}
          options={ACCOUNT_TYPES.map(t => ({
            value: t.value,
            label: t.label
          }))}
        />

        {/* Sección de divisas */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleAddCurrency}
              className="text-sm text-white "
              disabled={currencyBalances.length >= CURRENCIES.length}
            >
              + Agregar divisa
            </button>
          </div>

          {currencyBalances.map((cb, index) => (
            <div key={index} className="space-y-2 p-3 rounded">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <GlassDropdown
                    label={`Divisa ${index + 1}`}
                    value={cb.currency}
                    onChange={(val) => handleCurrencyChange(index, val)}
                    options={CURRENCIES.map(c => ({
                      value: c.value,
                      label: c.label
                    }))}
                  />
                </div>

                {currencyBalances.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCurrency(index)}
                    className="text-red-500 hover:text-red-600 font-bold mt-6"
                    title="Eliminar esta divisa"
                  >
                    ✕
                  </button>
                )}
              </div>

              <GlassField
                label={`Saldo inicial en ${cb.currency} (opcional)`}
                type="number"
                step="0.01"
                value={cb.balance}
                onChange={(e) => handleBalanceChange(index, e.target.value)}
                inputMode="decimal"
                onWheel={(event) => {
                  event.preventDefault();
                  event.currentTarget.blur();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    event.preventDefault();
                  }
                }}
                placeholder="0.00"
              />

              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id={`isPrimary-${index}`}
                  name="primary-currency"
                  checked={cb.isPrimary}
                  onChange={() => handlePrimaryChange(index)}
                  className="w-5 h-5 accent-blue-500"
                  style={{
                    accentColor: '#0A84FF'
                  }}
                />
                <label htmlFor={`isPrimary-${index}`} className="ios-label" style={{ marginBottom: 0 }}>
                  Divisa principal
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 ios-button-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 ios-button"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </IOSModal>
  );
}
