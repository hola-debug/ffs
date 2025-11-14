import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import IOSModal from '../IOSModal';
import {
  Pocket,
  PocketType,
  PocketSubtype,
  Account,
  CreatePocketInput,
  UpdatePocketInput,
  isSavingPocket,
  isExpenseVariablePocket,
  isExpenseFixedPocket,
  isExpensePeriodPocket,
  isExpenseSharedPocket,
  isDebtPocket,
} from '../../lib/types-new';

interface PocketEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: 'create' | 'edit';
  pocket?: Pocket;
}

const POCKET_TYPES: Array<{ value: PocketType; label: string; description: string }> = [
  { value: 'saving', label: 'Ahorro', description: 'Juntar dinero para una meta' },
  { value: 'expense', label: 'Gasto', description: 'Controlar gastos con límite' },
  { value: 'debt', label: 'Deuda', description: 'Gestionar préstamos y cuotas' },
];

const EXPENSE_SUBTYPES: Array<{ value: PocketSubtype; label: string; description: string; icon: string }> = [
  { value: 'period', label: 'Período', description: 'Gasto en período personalizado', icon: '📅' },
  { value: 'recurrent', label: 'Recurrente', description: 'Gasto mensual variable', icon: '🔄' },
  { value: 'fixed', label: 'Gasto Fijo', description: 'Gasto mensual fijo', icon: '📌' },
  { value: 'shared', label: 'Compartida', description: 'Compartir con otros usuarios', icon: '👥' },
];

const EMOJIS = ['💰', '🎯', '🛒', '🏖️', '🏠', '🚗', '🎮', '📚', '✈️', '🎉', '🍔', '⚡', '📱', '🎬', '🏋️'];

export default function PocketEditor({
  isOpen,
  onClose,
  onSuccess,
  mode,
  pocket,
}: PocketEditorProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'type' | 'config' | 'review'>(mode === 'create' ? 'type' : 'config');

  // Campos comunes
  const [name, setName] = useState(pocket?.name || '');
  const [pocketType, setPocketType] = useState<PocketType>(pocket?.type || 'saving');
  const [pocketSubtype, setPocketSubtype] = useState<PocketSubtype>(pocket?.subtype || null);
  const [emoji, setEmoji] = useState(pocket?.emoji || '💰');
  const [accountId, setAccountId] = useState(pocket?.account_id || '');
  const [linkedAccountId, setLinkedAccountId] = useState(pocket?.linked_account_id || '');

  // SAVING
  const [targetAmount, setTargetAmount] = useState(pocket && isSavingPocket(pocket) ? pocket.target_amount : '');
  const [frequency, setFrequency] = useState(pocket && isSavingPocket(pocket) ? pocket.frequency : 'monthly');
  const [allowWithdrawals, setAllowWithdrawals] = useState(
    pocket && isSavingPocket(pocket) ? pocket.allow_withdrawals !== false : true
  );
  const [startsAt, setStartsAt] = useState(pocket?.starts_at?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [endsAt, setEndsAt] = useState(pocket?.ends_at?.split('T')[0] || '');

  // EXPENSE - campos compartidos
  const [allocatedAmount, setAllocatedAmount] = useState(
    pocket && (isExpenseVariablePocket(pocket) || isExpensePeriodPocket(pocket) || isExpenseSharedPocket(pocket)) ? pocket.allocated_amount : ''
  );
  
  // EXPENSE.RECURRENT
  const [expectedAmount, setExpectedAmount] = useState(
    pocket && isExpenseVariablePocket(pocket) ? pocket.expected_amount : ''
  );
  const [recurrentDueDay, setRecurrentDueDay] = useState(
    pocket && isExpenseVariablePocket(pocket) ? pocket.due_day : 15
  );

  // EXPENSE.FIXED
  const [monthlyAmount, setMonthlyAmount] = useState(
    pocket && isExpenseFixedPocket(pocket) ? pocket.monthly_amount : ''
  );
  const [dueDay, setDueDay] = useState(
    pocket && isExpenseFixedPocket(pocket) ? pocket.due_day : 15
  );
  const [autoRegister, setAutoRegister] = useState(
    pocket && isExpenseFixedPocket(pocket) ? pocket.auto_register : false
  );

  // DEBT
  const [originalAmount, setOriginalAmount] = useState(
    pocket && isDebtPocket(pocket) ? pocket.original_amount : ''
  );
  const [installmentsTotal, setInstallmentsTotal] = useState(
    pocket && isDebtPocket(pocket) ? pocket.installments_total : ''
  );
  const [installmentAmount, setInstallmentAmount] = useState(
    pocket && isDebtPocket(pocket) ? pocket.installment_amount : ''
  );
  const [interestRate, setInterestRate] = useState(
    pocket && isDebtPocket(pocket) ? pocket.interest_rate : ''
  );
  const [automaticPayment, setAutomaticPayment] = useState(
    pocket && isDebtPocket(pocket) ? pocket.automatic_payment : false
  );
  const [debtDueDay, setDebtDueDay] = useState(
    pocket && isDebtPocket(pocket) ? pocket.due_day : 15
  );

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('account_with_currencies')
      .select('*');

    if (data) {
      setAccounts(data);
      if (!accountId && data.length > 0) {
        setAccountId(data[0].id);
      }
    }
    if (error) console.error('Error fetching accounts:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const selectedAccount = accounts.find(a => a.id === accountId);
      if (!selectedAccount) throw new Error('Selecciona una cuenta válida');

      // Obtener la divisa primaria de la cuenta
      const primaryCurrency = selectedAccount.currencies?.find((c: any) => c.is_primary)?.currency 
        || selectedAccount.currencies?.[0]?.currency 
        || 'UYU';

      // Construir payload según tipo
      const pocketData: any = {
        user_id: user.id,
        name,
        type: pocketType,
        emoji,
        account_id: accountId,
        // La currency se autoasignará por el trigger si no la enviamos
        // pero la enviamos explícitamente por seguridad
        currency: primaryCurrency,
        status: 'active',
      };

      // Agregar subtype si es expense
      if (pocketType === 'expense') {
        pocketData.subtype = pocketSubtype;
      }

      if (linkedAccountId) {
        pocketData.linked_account_id = linkedAccountId;
      }

      // Campos según tipo
      if (pocketType === 'saving') {
        if (!targetAmount) throw new Error('Ingresa el monto objetivo');
        pocketData.target_amount = parseFloat(targetAmount as string);
        pocketData.amount_saved = 0;
        pocketData.frequency = frequency;
        pocketData.allow_withdrawals = allowWithdrawals;
        if (endsAt) pocketData.ends_at = endsAt;
        pocketData.starts_at = startsAt;
      }

      if (pocketType === 'expense' && pocketSubtype === 'recurrent') {
        if (!recurrentDueDay) throw new Error('Completa día de vencimiento');
        pocketData.due_day = recurrentDueDay;
        if (expectedAmount) pocketData.expected_amount = parseFloat(expectedAmount as string);
        pocketData.spent_amount = 0;
      }

      if (pocketType === 'expense' && pocketSubtype === 'fixed') {
        if (!monthlyAmount || !dueDay) throw new Error('Completa monto y día de vencimiento');
        pocketData.monthly_amount = parseFloat(monthlyAmount as string);
        pocketData.due_day = dueDay;
        pocketData.auto_register = autoRegister;
      }

      if (pocketType === 'expense' && pocketSubtype === 'period') {
        if (!allocatedAmount || !endsAt) throw new Error('Completa monto y período');
        pocketData.allocated_amount = parseFloat(allocatedAmount as string);
        pocketData.spent_amount = 0;
        pocketData.starts_at = startsAt;
        pocketData.ends_at = endsAt;
        // days_duration y daily_allowance se calculan automáticamente por el trigger
      }
      
      if (pocketType === 'expense' && pocketSubtype === 'shared') {
        if (!allocatedAmount) throw new Error('Completa monto asignado');
        pocketData.allocated_amount = parseFloat(allocatedAmount as string);
        pocketData.spent_amount = 0;
        // TODO: agregar participants cuando se implemente
      }

      if (pocketType === 'debt') {
        if (!originalAmount || !installmentsTotal) throw new Error('Completa monto e instalaciones');
        pocketData.original_amount = parseFloat(originalAmount as string);
        pocketData.remaining_amount = parseFloat(originalAmount as string);
        pocketData.installments_total = parseInt(installmentsTotal as string);
        pocketData.installment_current = 0;
        pocketData.installment_amount = installmentAmount ? parseFloat(installmentAmount as string) : undefined;
        if (interestRate) pocketData.interest_rate = parseFloat(interestRate as string);
        pocketData.due_day = debtDueDay;
        pocketData.automatic_payment = automaticPayment;
      }

      if (mode === 'create') {
        const { error: insertError } = await supabase
          .from('pockets')
          .insert(pocketData);

        if (insertError) throw insertError;
      } else if (mode === 'edit' && pocket) {
        const { error: updateError } = await supabase
          .from('pockets')
          .update(pocketData)
          .eq('id', pocket.id);

        if (updateError) throw updateError;
      }

      setName('');
      setTargetAmount('');
      setPocketType('saving');
      setPocketSubtype(null);
      setEmoji('💰');
      setCurrentStep('type');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Seleccionar tipo
  const renderTypeSelection = () => (
    <div className="space-y-3">
      <h3 className="font-semibold text-white mb-4">Tipo de bolsa</h3>
      {POCKET_TYPES.map((type) => (
        <label
          key={type.value}
          className="block p-4 rounded-2xl cursor-pointer transition-all"
          style={{
            background: pocketType === type.value ? 'rgba(10, 132, 255, 0.15)' : 'rgba(120, 120, 128, 0.16)',
            border: pocketType === type.value ? '2px solid rgba(10, 132, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-start">
            <input
              type="radio"
              name="type"
              value={type.value}
              checked={pocketType === type.value}
              onChange={(e) => {
                setPocketType(e.target.value as PocketType);
                if (e.target.value === 'expense') {
                  setPocketSubtype('period');
                }
              }}
              className="mt-1 mr-3"
              style={{ accentColor: '#0A84FF' }}
            />
            <div>
              <div className="font-medium text-white">{type.label}</div>
              <div className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {type.description}
              </div>
            </div>
          </div>
        </label>
      ))}
    </div>
  );

  // Step 1b: Seleccionar subtype para gastos
  const renderSubtypeSelection = () => (
    <div className="space-y-3">
      <h3 className="font-semibold text-white mb-4">Tipo de gasto</h3>
      {EXPENSE_SUBTYPES.map((subtype) => (
        <label
          key={subtype.value}
          className="block p-4 rounded-2xl cursor-pointer transition-all"
          style={{
            background: pocketSubtype === subtype.value ? 'rgba(10, 132, 255, 0.15)' : 'rgba(120, 120, 128, 0.16)',
            border: pocketSubtype === subtype.value ? '2px solid rgba(10, 132, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-start">
            <div className="text-2xl mr-3">{subtype.icon}</div>
            <div className="flex-1">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="subtype"
                  value={subtype.value || ''}
                  checked={pocketSubtype === subtype.value}
                  onChange={(e) => setPocketSubtype((e.target.value as PocketSubtype) || null)}
                  className="mr-2"
                  style={{ accentColor: '#0A84FF' }}
                />
                <div className="font-medium text-white">{subtype.label}</div>
              </div>
              <div className="text-sm mt-1 ml-6" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {subtype.description}
              </div>
            </div>
          </div>
        </label>
      ))}
    </div>
  );

  // Step 2: Campos comunes
  const renderCommonFields = () => (
    <div className="space-y-5">
      <div>
        <label className="ios-label">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ej: Supermercado, Ahorro, Netflix..."
          className="w-full ios-input"
        />
      </div>

      <div>
        <label className="ios-label">Emoji</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className="text-2xl p-2 rounded transition-all"
              style={{
                background: emoji === e ? 'rgba(10, 132, 255, 0.9)' : 'rgba(120, 120, 128, 0.16)',
                border: emoji === e ? '2px solid rgba(10, 132, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.12)',
                transform: emoji === e ? 'scale(1.1)' : 'scale(1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="ios-label">Cuenta</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          className="w-full ios-select"
        >
          <option value="">Selecciona una cuenta</option>
          {accounts.map((acc) => {
            const primaryCurrency = acc.currencies?.find((c: any) => c.is_primary)?.currency 
              || acc.currencies?.[0]?.currency;
            return (
              <option key={acc.id} value={acc.id}>
                {acc.name} {primaryCurrency ? `(${primaryCurrency})` : ''}
              </option>
            );
          })}
        </select>
        {accountId && (() => {
          const selectedAcc = accounts.find(a => a.id === accountId);
          const currency = selectedAcc?.currencies?.find((c: any) => c.is_primary)?.currency 
            || selectedAcc?.currencies?.[0]?.currency;
          return currency && (
            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Divisa: {currency}
            </p>
          );
        })()}
      </div>

      {(pocketType === 'expense' || pocketType === 'debt') && (
        <div>
          <label className="ios-label">Cuenta de pago (opcional)</label>
          <select
            value={linkedAccountId}
            onChange={(e) => setLinkedAccountId(e.target.value)}
            className="w-full ios-select"
          >
            <option value="">No especificar</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  // Campos específicos por tipo
  const renderTypeSpecificFields = () => {
    if (pocketType === 'saving') {
      return (
        <div className="space-y-5">
          <div>
            <label className="ios-label">Monto objetivo</label>
            <input
              type="number"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full ios-input"
            />
          </div>

          <div>
            <label className="ios-label">Frecuencia de aporte</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="w-full ios-select">
              <option value="monthly">Mensual</option>
              <option value="weekly">Semanal</option>
              <option value="none">Sin frecuencia</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ios-label">Fecha inicio</label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full ios-input"
              />
            </div>
            <div>
              <label className="ios-label">Fecha fin (opcional)</label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full ios-input"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="allowWithdrawals"
              checked={allowWithdrawals}
              onChange={(e) => setAllowWithdrawals(e.target.checked)}
              className="w-5 h-5 rounded"
              style={{ accentColor: '#0A84FF' }}
            />
            <label htmlFor="allowWithdrawals" className="ios-label" style={{ marginBottom: 0 }}>
              Permitir retiros antes de completar
            </label>
          </div>
        </div>
      );
    }

    if (pocketType === 'expense' && pocketSubtype === 'recurrent') {
      return (
        <div className="space-y-5">
          <div>
            <label className="ios-label">Día de vencimiento</label>
            <select 
              value={recurrentDueDay} 
              onChange={(e) => setRecurrentDueDay(parseInt(e.target.value))} 
              className="w-full ios-select"
              required
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="ios-label">Monto esperado (opcional)</label>
            <input
              type="number"
              step="0.01"
              value={expectedAmount}
              onChange={(e) => setExpectedAmount(e.target.value)}
              placeholder="0.00"
              className="w-full ios-input"
            />
            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Estimación mensual. El sistema calculará el promedio automáticamente.
            </p>
          </div>
        </div>
      );
    }

    if (pocketType === 'expense' && pocketSubtype === 'fixed') {
      return (
        <div className="space-y-5">
          <div>
            <label className="ios-label">Monto mensual</label>
            <input
              type="number"
              step="0.01"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full ios-input"
            />
          </div>

          <div>
            <label className="ios-label">Día de vencimiento</label>
            <select value={dueDay} onChange={(e) => setDueDay(parseInt(e.target.value))} className="w-full ios-select">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="autoRegister"
              checked={autoRegister}
              onChange={(e) => setAutoRegister(e.target.checked)}
              className="w-5 h-5 rounded"
              style={{ accentColor: '#0A84FF' }}
            />
            <label htmlFor="autoRegister" className="ios-label" style={{ marginBottom: 0 }}>
              Registrar automáticamente cada mes
            </label>
          </div>
        </div>
      );
    }

    if (pocketType === 'expense' && pocketSubtype === 'period') {
      return (
        <div className="space-y-5">
          <div>
            <label className="ios-label">Monto asignado</label>
            <input
              type="number"
              step="0.01"
              value={allocatedAmount}
              onChange={(e) => setAllocatedAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full ios-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ios-label">Desde</label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="w-full ios-input"
              />
            </div>
            <div>
              <label className="ios-label">Hasta</label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
                className="w-full ios-input"
              />
            </div>
          </div>
          
          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            ℹ️ La duración en días y el promedio diario se calcularán automáticamente.
          </p>
        </div>
      );
    }
    
    if (pocketType === 'expense' && pocketSubtype === 'shared') {
      return (
        <div className="space-y-5">
          <div>
            <label className="ios-label">Monto asignado</label>
            <input
              type="number"
              step="0.01"
              value={allocatedAmount}
              onChange={(e) => setAllocatedAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full ios-input"
            />
          </div>
          
          <div className="p-4 rounded-xl" style={{ background: 'rgba(255, 204, 0, 0.1)', border: '1px solid rgba(255, 204, 0, 0.3)' }}>
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              🚧 Funcionalidad de participantes próximamente
            </p>
          </div>
        </div>
      );
    }

    if (pocketType === 'debt') {
      return (
        <div className="space-y-5">
          <div>
            <label className="ios-label">Monto total de la deuda</label>
            <input
              type="number"
              step="0.01"
              value={originalAmount}
              onChange={(e) => setOriginalAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full ios-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ios-label">Total de cuotas</label>
              <input
                type="number"
                value={installmentsTotal}
                onChange={(e) => setInstallmentsTotal(e.target.value)}
                required
                placeholder="12"
                className="w-full ios-input"
              />
            </div>
            <div>
              <label className="ios-label">Monto por cuota</label>
              <input
                type="number"
                step="0.01"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                placeholder="Calculado"
                className="w-full ios-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ios-label">Día de vencimiento</label>
              <select value={debtDueDay} onChange={(e) => setDebtDueDay(parseInt(e.target.value))} className="w-full ios-select">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ios-label">Tasa de interés (%)</label>
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0.00"
                className="w-full ios-input"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="automaticPayment"
              checked={automaticPayment}
              onChange={(e) => setAutomaticPayment(e.target.checked)}
              className="w-5 h-5 rounded"
              style={{ accentColor: '#0A84FF' }}
            />
            <label htmlFor="automaticPayment" className="ios-label" style={{ marginBottom: 0 }}>
              Pago automático
            </label>
          </div>
        </div>
      );
    }

    return null;
  };

  const title = mode === 'create' ? 'Nueva Bolsa' : `Editar ${pocket?.name || 'Bolsa'}`;

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} title={title}>
      {error && <div className="mb-4 ios-error">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* PASO 1: Tipo de bolsa */}
        {currentStep === 'type' && mode === 'create' && (
          <>
            {renderTypeSelection()}
            {pocketType === 'expense' && renderSubtypeSelection()}
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 ios-button-secondary">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('config')}
                className="flex-1 ios-button"
              >
                Siguiente
              </button>
            </div>
          </>
        )}

        {/* PASO 2: Configuración */}
        {currentStep === 'config' && (
          <>
            {renderCommonFields()}
            {renderTypeSpecificFields()}
            <div className="flex space-x-3 pt-4">
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('type')}
                  className="flex-1 ios-button-secondary"
                >
                  Atrás
                </button>
              )}
              <button type="button" onClick={onClose} className="flex-1 ios-button-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="flex-1 ios-button">
                {loading ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </>
        )}
      </form>
    </IOSModal>
  );
}
