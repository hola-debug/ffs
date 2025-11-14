import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import IOSModal, { GlassField } from '../IOSModal';
import GlassDropdown from '../GlassDropdown';
import GlassDatePicker from '../GlassDatePicker';
import { Account, AccountCurrency, CurrencyCode } from '../../lib/types';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddIncomeModal({ isOpen, onClose, onSuccess }: AddIncomeModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode | ''>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*, currencies:account_currencies(*)')
      .order('created_at', { ascending: false });
    
    if (data && data.length > 0) {
      setAccounts(data);
      setAccountId(data[0].id);
      // Auto-seleccionar la divisa primaria de la primera cuenta
      const primaryCurrency = data[0].currencies?.find(c => c.is_primary);
      if (primaryCurrency) {
        setCurrency(primaryCurrency.currency);
      } else if (data[0].currencies && data[0].currencies.length > 0) {
        setCurrency(data[0].currencies[0].currency);
      }
    }
    if (error) console.error(error);
  };

  // Obtener las divisas disponibles de la cuenta seleccionada
  const availableCurrencies = useMemo(() => {
    const account = accounts.find(a => a.id === accountId);
    return account?.currencies || [];
  }, [accounts, accountId]);

  // Cuando cambia la cuenta, actualizar la divisa
  useEffect(() => {
    if (accountId && availableCurrencies.length > 0) {
      // Intentar mantener la divisa actual si existe en la nueva cuenta
      const currencyExists = availableCurrencies.some(c => c.currency === currency);
      if (!currencyExists) {
        // Si no existe, seleccionar la primaria o la primera disponible
        const primaryCurrency = availableCurrencies.find(c => c.is_primary);
        if (primaryCurrency) {
          setCurrency(primaryCurrency.currency);
        } else {
          setCurrency(availableCurrencies[0].currency);
        }
      }
    }
  }, [accountId, availableCurrencies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      if (!accountId) throw new Error('Selecciona una cuenta');
      if (!currency) throw new Error('Selecciona una divisa');

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      // 1. Crear el movimiento de ingreso
      const { error: insertError } = await supabase
        .from('movements')
        .insert({
          user_id: user.id,
          type: 'income',
          account_id: accountId,
          amount: amountValue,
          currency: currency,
          date: date.toISOString().split('T')[0],
          description: description || 'Ingreso',
        });

      if (insertError) throw insertError;

      // 2. Actualizar el balance en account_currencies
      const accountCurrency = availableCurrencies.find(c => c.currency === currency);
      if (accountCurrency) {
        const { error: updateError } = await supabase
          .from('account_currencies')
          .update({
            balance: (accountCurrency.balance || 0) + amountValue
          })
          .eq('id', accountCurrency.id);

        if (updateError) {
          console.error('Error actualizando balance:', updateError);
          // No lanzamos error porque el movimiento ya se creó
        }
      }

      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date());
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} title="Agregar Ingreso">
      {error && (
        <div className="mb-4 ios-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlassField
          label="Monto"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="0.00"
        />

        <GlassDropdown
          label="Cuenta"
          value={accountId}
          onChange={setAccountId}
          placeholder="Seleccionar cuenta"
          options={accounts.map(acc => ({
            value: acc.id,
            label: acc.name
          }))}
        />

        <GlassDropdown
          label="Divisa"
          value={currency}
          onChange={(val) => setCurrency(val as CurrencyCode)}
          placeholder="Seleccionar divisa"
          options={availableCurrencies.map(curr => ({
            value: curr.currency,
            label: curr.currency,
            description: curr.is_primary ? 'Principal' : undefined
          }))}
        />

        <GlassDatePicker
          label="Fecha"
          value={date}
          onChange={setDate}
        />

        <GlassField
          label="Descripción (opcional)"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Salario, Freelance..."
        />

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
