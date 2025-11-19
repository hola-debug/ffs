import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import IOSModal, { GlassField, GlassSelect } from '../IOSModal';
import { Pocket, isSavingPocket, getAccountBalance } from '../../lib/types';
import { getPocketIconLabel } from '@/components/PocketIcon';
import { useAccountsStore } from '../../hooks/useAccountsStore';

interface AddSavingDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddSavingDepositModal({ isOpen, onClose, onSuccess }: AddSavingDepositModalProps) {
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const {
    accounts,
    loading: accountsLoading,
    refreshing: accountsRefreshing,
    refetch
  } = useAccountsStore();
  const [amount, setAmount] = useState('');
  const [pocketId, setPocketId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    // Cargar bolsas de ahorro activas
    const { data: pocketsData, error: pocketsError } = await supabase
      .from('pockets')
      .select('*')
      .eq('status', 'active')
      .eq('type', 'saving')
      .order('created_at', { ascending: false });
    
    if (pocketsData) {
      setPockets(pocketsData);
      if (pocketsData.length > 0) {
        setPocketId(pocketsData[0].id);
      }
    }
    if (pocketsError) console.error(pocketsError);

  };

  useEffect(() => {
    if (!isOpen) return;
    if (accounts.length === 0) {
      setAccountId('');
      return;
    }
    setAccountId((prev) => (prev && accounts.some((acc) => acc.id === prev) ? prev : accounts[0].id));
  }, [isOpen, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const pocket = pockets.find(p => p.id === pocketId);
      if (!pocket) throw new Error('Bolsa no encontrada');
      if (!isSavingPocket(pocket)) throw new Error('Debe ser una bolsa de ahorro');

      const account = accounts.find(a => a.id === accountId);
      if (!account) throw new Error('Cuenta no encontrada');

      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      // Verificar que la cuenta tenga saldo suficiente en la divisa del pocket
      const accountBalance = getAccountBalance(account, pocket.currency);
      if (depositAmount > accountBalance) {
        throw new Error(`Saldo insuficiente en la cuenta (disponible: $${accountBalance.toFixed(2)} ${pocket.currency})`);
      }

      // 1. Crear movimiento de depósito
      const { error: insertError } = await supabase
        .from('movements')
        .insert({
          user_id: user.id,
          type: 'saving_deposit',
          pocket_id: pocketId,
          account_id: accountId,
          amount: depositAmount,
          currency: pocket.currency,
          date,
          description: description || 'Depósito a ahorro',
        });

      if (insertError) throw insertError;

      // 2. Descontar del balance de la cuenta
      const accountCurrency = account.currencies?.find(c => c.currency === pocket.currency);
      if (accountCurrency) {
        const { error: updateError } = await supabase
          .from('account_currencies')
          .update({
            balance: accountBalance - depositAmount
          })
          .eq('id', accountCurrency.id);

        if (updateError) {
          console.error('Error actualizando balance de cuenta:', updateError);
        }
      }

      // El trigger update_saving_pocket_balance() actualizará amount_saved automáticamente

      await refetch();

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

  const selectedPocket = pockets.find(p => p.id === pocketId);
  const selectedAccount = accounts.find(a => a.id === accountId);

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} title="Depositar a Ahorro">
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

        <GlassSelect
          label="Bolsa de ahorro"
          value={pocketId}
          onChange={(e) => setPocketId(e.target.value)}
          required
          disabled={pockets.length === 0}
        >
          {pockets.map((pocket) => {
            const saved = pocket.amount_saved || 0;
            const target = pocket.target_amount || 0;
            const remaining = target - saved;
            return (
              <option key={pocket.id} value={pocket.id}>
                {getPocketIconLabel(pocket.emoji)} {pocket.name} - Ahorrado: ${saved.toFixed(2)} / ${target.toFixed(2)} {pocket.currency}
              </option>
            );
          })}
        </GlassSelect>

        <GlassSelect
          label="Cuenta de origen"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          disabled={accounts.length === 0 || accountsLoading || accountsRefreshing}
        >
          {accounts.map((account) => {
            const balance = selectedPocket 
              ? getAccountBalance(account, selectedPocket.currency)
              : getAccountBalance(account);
            return (
              <option key={account.id} value={account.id}>
                {account.name} - Disponible: ${balance.toFixed(2)}
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
          label="Descripción (opcional)"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Ahorro mensual, Extra..."
        />

        {selectedPocket && (
          <div className="text-sm p-3 rounded-xl bg-blue-950/30 border border-blue-800/30 text-blue-400">
            💡 Meta: ${selectedPocket.target_amount?.toFixed(2) || '0.00'} {selectedPocket.currency}
            <br />
            📊 Ahorrado: ${(selectedPocket.amount_saved || 0).toFixed(2)} ({((selectedPocket.amount_saved || 0) / (selectedPocket.target_amount || 1) * 100).toFixed(1)}%)
            <br />
            🎯 Falta: ${((selectedPocket.target_amount || 0) - (selectedPocket.amount_saved || 0)).toFixed(2)}
          </div>
        )}

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
            disabled={loading || pockets.length === 0 || accounts.length === 0}
            className="flex-1 ios-button"
          >
            {loading ? 'Guardando...' : 'Depositar'}
          </button>
        </div>
      </form>
    </IOSModal>
  );
}
