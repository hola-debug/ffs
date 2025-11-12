import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Account, Category, Period } from '../../lib/types';
import { dispatchDashboardRefresh } from '../../lib/dashboardEvents';

type Theme = 'dark' | 'light';

interface ExpenseFormProps {
  title?: string;
  description?: string;
  accounts: Account[];
  categories: Category[];
  periods?: Period[];
  defaultIsRandom?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  theme?: Theme;
  className?: string;
}

const themeClasses: Record<
  Theme,
  {
    label: string;
    input: string;
    select: string;
    helper: string;
    checkbox: string;
    error: string;
    info: string;
    buttonPrimary: string;
    buttonSecondary: string;
  }
> = {
  dark: {
    label: 'text-white',
    input:
      'bg-white/10 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-white/40',
    select:
      'bg-white/10 border border-white/10 text-white focus:ring-2 focus:ring-white/40',
    helper: 'text-white',
    checkbox: 'accent-green-500',
    error:
      'bg-red-500/20 border border-red-400 text-red-100',
    info: 'bg-blue-500/15 border border-blue-400 text-blue-100',
    buttonPrimary:
      'bg-white text-black hover:bg-gray-100 disabled:bg-gray-300 disabled:text-gray-500',
    buttonSecondary:
      'bg-white/10 text-white hover:bg-white/20 border border-white/30',
  },
  light: {
    label: 'text-gray-900',
    input:
      'bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-black/70',
    select:
      'bg-white border border-gray-200 text-gray-900 focus:ring-2 focus:ring-black/70',
    helper: 'text-gray-800',
    checkbox: 'accent-black',
    error:
      'bg-red-600/10 border border-red-400 text-red-700',
    info: 'bg-blue-600/10 border border-blue-400 text-blue-800',
    buttonPrimary:
      'bg-black text-white hover:bg-gray-900 disabled:bg-gray-700 disabled:text-gray-400',
    buttonSecondary:
      'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300',
  },
};

export function ExpenseForm({
  title = 'Agregar gasto',
  description,
  accounts,
  categories,
  periods = [],
  defaultIsRandom = false,
  onSuccess,
  onCancel,
  submitLabel = 'Guardar',
  theme = 'dark',
  className,
}: ExpenseFormProps) {
  const styles = themeClasses[theme];
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [isRandomToggle, setIsRandomToggle] = useState(defaultIsRandom);
  const [belongsToActivePeriod, setBelongsToActivePeriod] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure account selection updates when accounts list changes
  useEffect(() => {
    if (!accountId && accounts[0]?.id) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Find active period (if any)
  const activePeriod = useMemo(
    () => periods.find((p) => p.status === 'active'),
    [periods]
  );

  // Filter categories based on toggle state
  const expenseCategories = useMemo(() => {
    const baseCategories = categories.filter(
      (c) =>
        c.kind === 'variable' ||
        c.kind === 'fixed' ||
        c.kind === 'random'
    );

    if (belongsToActivePeriod) {
      return baseCategories.filter(
        (c) => c.scope === 'period' || c.scope === 'both'
      );
    }

    return baseCategories;
  }, [categories, belongsToActivePeriod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!amount || Number(amount) <= 0) {
      setError('Ingresá un monto válido.');
      setLoading(false);
      return;
    }

    if (!accountId) {
      setError('Necesitás seleccionar una cuenta.');
      setLoading(false);
      return;
    }

    if (belongsToActivePeriod && !activePeriod) {
      setError(
        'No hay un período activo disponible. Desactiva la opción o crea un período activo.'
      );
      setLoading(false);
      return;
    }

    if (belongsToActivePeriod && categoryId) {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      if (selectedCategory && selectedCategory.kind === 'fixed') {
        setError('No podés usar una categoría fija dentro de un período.');
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
        currency:
          accounts.find((a) => a.id === accountId)?.currency || 'UYU',
        date: new Date().toISOString().split('T')[0],
        notes: notes || null,
        description: notes || null,
        is_random: isRandomToggle,
        is_fixed: false,
        is_recurring: false,
        scope: belongsToActivePeriod ? 'period' : 'outside_period',
        period_id: belongsToActivePeriod ? activePeriod?.id : null,
      });

      if (insertError) throw insertError;

      // Reset form state
      setAmount('');
      setNotes('');
      setCategoryId('');
      setIsRandomToggle(defaultIsRandom);
      setBelongsToActivePeriod(false);

      onSuccess?.();
      dispatchDashboardRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {title && (
        <div className="mb-4">
          <h3
            className={`text-sm font-semibold uppercase tracking-wide ${styles.label}`}
          >
            {title}
          </h3>
          {description && (
            <p className={`text-xs mt-1 opacity-80 ${styles.helper}`}>
              {description}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className={`mb-3 p-2 rounded text-xs ${styles.error}`}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className={`text-xs font-medium ${styles.label}`}>
            Monto
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0.00"
            className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-all ${styles.input}`}
          />
        </div>

        <div className="space-y-1.5">
          <label className={`text-xs font-medium ${styles.label}`}>
            Cuenta
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-all ${styles.select}`}
          >
            {accounts.length === 0 && (
              <option value="">No hay cuentas disponibles</option>
            )}
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={`text-xs font-medium ${styles.label}`}>
            Categoría
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-all ${styles.select}`}
          >
            <option value="">Sin categoría</option>
            {expenseCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={`text-xs font-medium ${styles.label}`}>
            Notas
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Descripción opcional"
            className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none transition-all ${styles.input}`}
          />
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="belongsToActivePeriod"
            checked={belongsToActivePeriod}
            onChange={(e) => setBelongsToActivePeriod(e.target.checked)}
            className={`w-4 h-4 rounded ${styles.checkbox}`}
          />
          <label
            htmlFor="belongsToActivePeriod"
            className={`text-xs ${styles.helper}`}
          >
            ¿Pertenece al período activo?
          </label>
        </div>

        {belongsToActivePeriod && !activePeriod && (
          <div className={`p-2 rounded text-xs ${styles.error}`}>
            ⚠️ No hay un período activo
          </div>
        )}

        {belongsToActivePeriod && activePeriod && (
          <div className={`p-2 rounded text-xs ${styles.info}`}>
            📅 Período: {activePeriod.name}
          </div>
        )}

        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="isRandom"
            checked={isRandomToggle}
            onChange={(e) => setIsRandomToggle(e.target.checked)}
            className={`w-4 h-4 rounded ${styles.checkbox}`}
          />
          <label htmlFor="isRandom" className={`text-xs ${styles.helper}`}>
            Gasto random (no planificado)
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`flex-1 text-xs font-semibold uppercase tracking-wide rounded-lg px-3 py-2 transition-colors ${styles.buttonSecondary}`}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 text-xs font-semibold uppercase tracking-wide rounded-lg px-3 py-2 transition-colors ${styles.buttonPrimary}`}
          >
            {loading ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
