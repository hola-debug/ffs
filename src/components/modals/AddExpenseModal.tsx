import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import IOSModal from '../IOSModal';
import { Pocket } from '../../lib/types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [amount, setAmount] = useState('');
  const [pocketId, setPocketId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPockets();
    }
  }, [isOpen]);

  const fetchPockets = async () => {
    const { data, error } = await supabase
      .from('pockets')
      .select('*')
      .eq('status', 'active')
      .eq('type', 'expense')
      .order('created_at', { ascending: false });
    
    if (data) {
      setPockets(data);
      if (data.length > 0) {
        setPocketId(data[0].id);
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

      const pocket = pockets.find(p => p.id === pocketId);
      if (!pocket) throw new Error('Bolsa no encontrada');

      const expenseAmount = parseFloat(amount);
      if (expenseAmount > pocket.current_balance) {
        throw new Error('El gasto supera el saldo disponible en la bolsa');
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
    <IOSModal isOpen={isOpen} onClose={onClose} title="Nuevo Gasto">
      {error && (
        <div className="mb-4 ios-error">
          {error}
        </div>
      )}

      {pockets.length === 0 && !loading && (
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
        <div>
          <label className="ios-label">Monto</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0.00"
            className="w-full ios-input"
          />
        </div>

        <div>
          <label className="ios-label">Bolsa de gasto</label>
          <select
            value={pocketId}
            onChange={(e) => setPocketId(e.target.value)}
            required
            disabled={pockets.length === 0}
            className="w-full ios-select"
          >
            {pockets.map((pocket) => (
              <option key={pocket.id} value={pocket.id}>
                {pocket.emoji} {pocket.name} - Disponible: ${pocket.current_balance.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="ios-label">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full ios-input"
          />
        </div>

        <div>
          <label className="ios-label">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Ej: Supermercado, Almuerzo..."
            className="w-full ios-input"
          />
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
            disabled={loading || pockets.length === 0}
            className="flex-1 ios-button"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </IOSModal>
  );
}
