import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import IOSModal from '../IOSModal';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'bank', label: 'Banco' },
  { value: 'wallet', label: 'Billetera Digital' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Otro' },
] as const;

const CURRENCIES = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
] as const;

export default function AddAccountModal({ isOpen, onClose, onSuccess }: AddAccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'wallet' | 'crypto' | 'other'>('bank');
  const [currency, setCurrency] = useState('ARS');
  const [balance, setBalance] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error: insertError } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name,
          type,
          currency,
          balance: parseFloat(balance) || 0,
          is_primary: isPrimary,
        });

      if (insertError) throw insertError;

      // Reset form
      setName('');
      setType('bank');
      setCurrency('ARS');
      setBalance('');
      setIsPrimary(false);
      
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
        <div>
          <label className="ios-label">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ej: Banco Nación, Billetera..."
            className="w-full ios-input"
          />
        </div>

        <div>
          <label className="ios-label">Tipo de cuenta</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            required
            className="w-full ios-select"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="ios-label">Moneda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
            className="w-full ios-select"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="ios-label">Saldo inicial (opcional)</label>
          <input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
            className="w-full ios-input"
          />
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isPrimary"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="w-5 h-5 rounded accent-blue-500"
            style={{
              accentColor: '#0A84FF'
            }}
          />
          <label htmlFor="isPrimary" className="ios-label" style={{ marginBottom: 0 }}>
            Marcar como cuenta principal
          </label>
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
