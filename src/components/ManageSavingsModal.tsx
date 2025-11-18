import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SavingsVault } from '../lib/types';
import { useAccountsStore } from '../hooks/useAccountsStore';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManageSavingsModal({ onClose, onSuccess }: Props) {
  const { accounts, loading: accountsLoading, refreshing: accountsRefreshing } = useAccountsStore();
  const [vaults, setVaults] = useState<SavingsVault[]>([]);
  const [selectedVault, setSelectedVault] = useState('');
  const [amount, setAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVaults = async () => {
      const { data, error } = await supabase.from('savings_vaults').select('*');
      if (error) {
        console.error('Error cargando vaults', error);
        return;
      }
      if (data) {
        setVaults(data);
        if (data.length > 0) {
          setSelectedVault(data[0].id);
        }
      }
    };
    fetchVaults();
  }, []);

  useEffect(() => {
    if (accounts.length === 0) {
      setFromAccountId('');
      return;
    }
    setFromAccountId((prev) => (prev && accounts.some((acc) => acc.id === prev) ? prev : accounts[0].id));
  }, [accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const vault = vaults.find((v) => v.id === selectedVault);
      if (!vault) throw new Error('Vault no encontrado');

      const { error: insertError } = await supabase.from('savings_moves').insert({
        vault_id: selectedVault,
        from_account_id: fromAccountId,
        amount: parseFloat(amount),
        currency: vault.currency,
        date: new Date().toISOString().split('T')[0],
        notes: 'Ahorro manual',
      });

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Mover a ahorro</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Monto</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Desde cuenta</label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              required
              disabled={accounts.length === 0 || accountsLoading || accountsRefreshing}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">A vault</label>
            <select
              value={selectedVault}
              onChange={(e) => setSelectedVault(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {vaults.map((vault) => (
                <option key={vault.id} value={vault.id}>
                  {vault.name} ({vault.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
