import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import IOSModal from '../IOSModal';
import { Account } from '../../lib/types';
import GlassField from '../ui/GlassField';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddIncomeModal({ isOpen, onClose, onSuccess }: AddIncomeModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
      .select('*')
      .order('is_primary', { ascending: false });
    
    if (data) {
      setAccounts(data);
      if (data.length > 0) {
        setAccountId(data[0].id);
      }
    }
    if (error) console.error(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const account = accounts.find(a => a.id === accountId);
      if (!account) throw new Error('Cuenta no encontrada');

      const { error: insertError } = await supabase
        .from('movements')
        .insert({
          user_id: user.id,
          type: 'income',
          account_id: accountId,
          amount: parseFloat(amount),
          currency: account.currency,
          date,
          description: description || 'Ingreso',
        });

      if (insertError) throw insertError;

      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      
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
        <div>
          <label className="ios-label">Monto</label>
          <GlassField>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="glass-control"
            />
          </GlassField>
        </div>

        <div>
          <label className="ios-label">Cuenta</label>
          <GlassField>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="glass-control glass-control--select"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </GlassField>
        </div>

        <div>
          <label className="ios-label">Fecha</label>
          <GlassField>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="glass-control"
            />
          </GlassField>
        </div>

        <div>
          <label className="ios-label">Descripción (opcional)</label>
          <GlassField>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Salario, Freelance..."
              className="glass-control"
            />
          </GlassField>
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
