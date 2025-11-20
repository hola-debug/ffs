import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import IOSModal, { GlassField, GlassSelect } from '../IOSModal';
import { ActivePocketSummary, isExpensePocket } from '../../lib/types';
import { getPocketIconLabel } from '@/components/PocketIcon';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  expensePockets: ActivePocketSummary[];
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess, expensePockets }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [pocketId, setPocketId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && expensePockets.length > 0 && !pocketId) {
      setPocketId(expensePockets[0].id);
    }
  }, [isOpen, expensePockets, pocketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const pocket = expensePockets.find(p => p.id === pocketId);
      if (!pocket) throw new Error('Bolsa no encontrada');
      if (!isExpensePocket(pocket)) throw new Error('Debe ser una bolsa de gasto');

      const expenseAmount = parseFloat(amount);

      const availableBalance = (pocket.allocated_amount || 0) - (pocket.spent_amount || 0);

      if (expenseAmount > availableBalance) {
        throw new Error(`El gasto supera el saldo disponible ($${availableBalance.toFixed(2)})`);
      }

      const { error: insertError } = await supabase
        .from('movements')
        .insert({
          user_id: user.id,
          type: 'pocket_expense',
          pocket_id: pocketId,
          amount: expenseAmount,
          currency: pocket.currency,
          date,
          description: description || 'Gasto',
        });

      if (insertError) throw insertError;

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
    <IOSModal isOpen={isOpen} onClose={onClose} title="Nuevo Gasto">
      {error && (
        <div className="mb-4 ios-error">
          {error}
        </div>
      )}

      {expensePockets.length === 0 && !loading && (
        <div className="mb-4" style={{
          background: 'rgba(255, 159, 10, 0.15)',
          border: '1px solid rgba(255, 159, 10, 0.3)',
          color: 'rgba(255, 179, 64, 1)',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '14px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          No tienes bolsas de gasto activas. Crea una bolsa primero.
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

        <GlassSelect
          label="Bolsa de gasto"
          value={pocketId}
          onChange={(e) => setPocketId(e.target.value)}
          required
          disabled={expensePockets.length === 0}
        >
          {expensePockets.map((pocket) => {
            const available = (pocket.allocated_amount || 0) - (pocket.spent_amount || 0);
            return (
              <option key={pocket.id} value={pocket.id}>
                {getPocketIconLabel(pocket.emoji)} {pocket.name} - Disponible: ${available.toFixed(2)} {pocket.currency}
              </option>
            );
          })}
        </GlassSelect>

        <GlassField
          label="Fecha"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <GlassField
          label="Descripción"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="Ej: Supermercado, Almuerzo..."
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
            disabled={loading || expensePockets.length === 0}
            className="flex-1 ios-button"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </IOSModal>
  );
}
