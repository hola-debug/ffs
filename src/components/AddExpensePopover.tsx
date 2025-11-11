import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Account, Category, Period } from '../lib/types';
import { dispatchDashboardRefresh } from '../lib/dashboardEvents';
import { 
  Popover, 
  PopoverInput, 
  PopoverActions, 
  PopoverButton 
} from './ui/Popover';

interface Props {
  accounts: Account[];
  categories: Category[];
  periods?: Period[];
  isRandom: boolean;
  trigger: React.ReactNode;
  onSuccess: () => void;
}

export default function AddExpensePopover({ 
  accounts, 
  categories, 
  periods = [],
  isRandom, 
  trigger,
  onSuccess 
}: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [isRandomToggle, setIsRandomToggle] = useState(isRandom);
  const [belongsToActivePeriod, setBelongsToActivePeriod] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find active period
  const activePeriod = useMemo(
    () => periods.find(p => p.status === 'active'),
    [periods]
  );

  // Filter categories based on toggle
  const expenseCategories = useMemo(() => {
    const baseCategories = categories.filter(
      (c) => c.kind === 'variable' || c.kind === 'fixed' || c.kind === 'random'
    );

    if (belongsToActivePeriod) {
      // Only show categories with scope 'period' or 'both'
      return baseCategories.filter(c => c.scope === 'period' || c.scope === 'both');
    }

    return baseCategories;
  }, [categories, belongsToActivePeriod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validations
    if (belongsToActivePeriod && !activePeriod) {
      setError('No hay un período activo disponible. Por favor, desactiva la opción o crea un período activo.');
      setLoading(false);
      return;
    }

    if (belongsToActivePeriod && categoryId) {
      const selectedCategory = categories.find(c => c.id === categoryId);
      if (selectedCategory && selectedCategory.kind === 'fixed') {
        setError('No puedes usar una categoría fija dentro de un período.');
        setLoading(false);
        return;
      }
    }

    try {
      const { error: insertError } = await supabase.from('transactions').insert({
        account_id: accountId,
        category_id: categoryId || null,
        type: 'expense',
        amount: parseFloat(amount),
        currency: accounts.find((a) => a.id === accountId)?.currency || 'UYU',
        date: new Date().toISOString().split('T')[0],
        notes: notes || null,
        is_random: isRandomToggle,
        is_fixed: false,
        is_recurring: false,
        scope: belongsToActivePeriod ? 'period' : 'outside_period',
        period_id: belongsToActivePeriod ? activePeriod?.id : null,
      });

      if (insertError) throw insertError;
      
      // Reset form
      setAmount('');
      setNotes('');
      setCategoryId('');
      setIsRandomToggle(isRandom);
      setBelongsToActivePeriod(false);
      
      onSuccess();
      dispatchDashboardRefresh();
      setOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover 
      trigger={trigger} 
      open={open} 
      onOpenChange={setOpen}
      side="bottom"
      align="center"
    >
      <div className="w-full">
        <h3 className="text-sm font-semibold text-white mb-3">Agregar gasto</h3>

        {error && (
          <div className="mb-3 p-2 bg-red-500/20 border border-red-500 rounded text-red-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <PopoverInput
            label="Monto"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0.00"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white">Cuenta</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-black/10 border-none text-white rounded-lg focus:outline-none focus:ring-none transition-all"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-gray-800">
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-black/10 border-none text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-none transition-all"
            >
              <option value="" className="bg-gray-800">Sin categoría</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-gray-800">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <PopoverInput
            label="Notas"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Descripción opcional"
          />

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="belongsToActivePeriod"
              checked={belongsToActivePeriod}
              onChange={(e) => setBelongsToActivePeriod(e.target.checked)}
              className="w-4 h-4 rounded accent-green-500"
            />
            <label htmlFor="belongsToActivePeriod" className="text-xs text-white">
              ¿Pertenece al periodo activo?
            </label>
          </div>

          {belongsToActivePeriod && !activePeriod && (
            <div className="p-2 bg-yellow-500/20 border border-yellow-500 rounded text-yellow-200 text-xs">
              ⚠️ No hay un período activo
            </div>
          )}

          {belongsToActivePeriod && activePeriod && (
            <div className="p-2 bg-blue-500/20 border border-blue-500 rounded text-blue-200 text-xs">
              📅 Período: {activePeriod.name}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isRandom"
              checked={isRandomToggle}
              onChange={(e) => setIsRandomToggle(e.target.checked)}
              className="w-4 h-4 rounded accent-green-500"
            />
            <label htmlFor="isRandom" className="text-xs text-white">
              Gasto random (no planificado)
            </label>
          </div>

          <PopoverActions>
            <PopoverButton
              variant="secondary"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </PopoverButton>
            <PopoverButton
              variant="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </PopoverButton>
          </PopoverActions>
        </form>
      </div>
    </Popover>
  );
}
