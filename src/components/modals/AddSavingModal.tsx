import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import IOSModal, { GlassField } from '../IOSModal';
import GlassDropdown from '../GlassDropdown';
import { ActivePocketSummary, isSavingPocket } from '../../lib/types';
import { PocketIcon } from '@/components/PocketIcon';
import { useAccountsStore } from '../../hooks/useAccountsStore';

interface AddSavingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  savingPockets: ActivePocketSummary[];
}

export default function AddSavingModal({ isOpen, onClose, onSuccess, savingPockets }: AddSavingModalProps) {
  const { accounts, refetch: refetchAccounts } = useAccountsStore();
  const [amount, setAmount] = useState('');
  const [pocketId, setPocketId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && savingPockets.length > 0 && !pocketId) {
      setPocketId(savingPockets[0].id);
    }
  }, [isOpen, savingPockets, pocketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const pocket = savingPockets.find(p => p.id === pocketId);
      if (!pocket) throw new Error('Bolsa no encontrada');
      if (!isSavingPocket(pocket)) throw new Error('Debe ser una bolsa de ahorro');

      const savingAmount = parseFloat(amount);

      if (savingAmount <= 0) {
        throw new Error('El monto debe ser mayor que cero.');
      }

      // 1. Insertar el movimiento
      const { error: insertError } = await supabase
        .from('movements' as any)
        .insert({
          user_id: user.id,
          type: 'saving_deposit',
          pocket_id: pocketId,
          amount: savingAmount,
          currency: pocket.currency,
          date,
          description: description || 'Aporte a Ahorro',
        });

      if (insertError) throw insertError;

      // 2. Descontar de la cuenta asociada
      if (pocket.account_id) {
        const account = accounts.find(a => a.id === pocket.account_id);
        if (account) {
          const accountCurrency = account.currencies?.find(c => c.currency === pocket.currency);

          if (accountCurrency) {
            const newBalance = (accountCurrency.balance || 0) - savingAmount;

            const { error: updateError } = await supabase
              .from('account_currencies' as any)
              .update({ balance: newBalance })
              .eq('id', accountCurrency.id);

            if (updateError) {
              console.error('Error updating account balance:', updateError);
              // No lanzamos error fatal para no revertir el movimiento, pero avisamos
              // Podríamos implementar rollback aquí si fuera crítico
            } else {
              await refetchAccounts();
            }
          }
        }
      }

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

  const pocketOptions = savingPockets.map(pocket => ({
    value: pocket.id,
    label: `${pocket.name}`,
    icon: pocket.emoji ? <PocketIcon iconId={pocket.emoji} className="w-5 h-5 text-white" /> : undefined,
  }));

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} title="Aporte a Ahorro">
      {error && (
        <div className="mb-4 ios-error">
          {error}
        </div>
      )}

      {savingPockets.length === 0 && !loading && (
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
          No tienes bolsas de ahorro activas. Crea una bolsa primero.
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
          label="Bolsa de ahorro"
          options={pocketOptions}
          value={pocketId}
          onChange={(value) => setPocketId(value)}
        />

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
          placeholder="Ej: Aporte mensual, Extra..."
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
            disabled={loading || savingPockets.length === 0}
            className="flex-1 ios-button"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </IOSModal>
  );
}
