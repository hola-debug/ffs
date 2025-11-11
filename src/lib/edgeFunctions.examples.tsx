/**
 * EJEMPLOS DE USO - Edge Functions
 * 
 * Este archivo contiene ejemplos de cómo usar las Edge Functions
 * desde componentes React en la aplicación.
 */

import { useState } from 'react';
import {
  createTransaction,
  createPeriod,
  createPeriodExpense,
  createOutsidePeriodExpense,
  createIncome,
  createAccountTransfer,
  createFortnightlyPeriod,
  createMonthlyPeriod,
} from './edgeFunctions';

// ============================================
// EJEMPLO 1: Crear gasto en período
// ============================================

export function PeriodExpenseExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddExpense = async () => {
    setLoading(true);
    setError(null);

    const result = await createPeriodExpense(
      'period-uuid-here',
      'account-uuid-here',
      150.50,
      {
        categoryId: 'category-uuid-here',
        description: 'Supermercado del día',
        isRandom: false,
      }
    );

    if (!result.success) {
      setError(result.error || 'Error desconocido');
      setLoading(false);
      return;
    }

    console.log('Transacción creada:', result.data);
    // Aquí puedes actualizar el estado local o refrescar datos
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleAddExpense} disabled={loading}>
        {loading ? 'Creando...' : 'Agregar Gasto al Período'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

// ============================================
// EJEMPLO 2: Crear período con transferencia
// ============================================

export function CreatePeriodWithTransferExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePeriod = async () => {
    setLoading(true);
    setError(null);

    // Opción 1: Usando helper específico para quincenas
    const result = await createFortnightlyPeriod(
      'Quincenal Nov 1-15',
      'account-principal-uuid',
      'account-periodo-uuid',
      5000,
      {
        percentage: 50,
        status: 'active',
        createTransfer: true, // Transferir automáticamente
      }
    );

    if (!result.success) {
      setError(result.error || 'Error desconocido');
      setLoading(false);
      return;
    }

    console.log('Período creado:', result.period);
    if (result.transfer_transaction) {
      console.log('Transferencia creada:', result.transfer_transaction);
    }

    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleCreatePeriod} disabled={loading}>
        {loading ? 'Creando...' : 'Crear Período Quincenal'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

// ============================================
// EJEMPLO 3: Formulario completo de transacción
// ============================================

export function TransactionFormExample() {
  const [formData, setFormData] = useState({
    accountId: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: 0,
    description: '',
    scope: 'outside_period' as 'period' | 'outside_period',
    periodId: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createTransaction({
      account_id: formData.accountId,
      type: formData.type,
      amount: formData.amount,
      scope: formData.scope,
      period_id: formData.scope === 'period' ? formData.periodId : undefined,
      description: formData.description,
    });

    if (!result.success) {
      setError(result.error || 'Error desconocido');
      setLoading(false);
      return;
    }

    console.log('Transacción creada:', result.data);
    // Limpiar formulario
    setFormData({
      accountId: '',
      type: 'expense',
      amount: 0,
      description: '',
      scope: 'outside_period',
      periodId: '',
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Account ID"
        value={formData.accountId}
        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
      />
      
      <select
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
      >
        <option value="expense">Gasto</option>
        <option value="income">Ingreso</option>
        <option value="transfer">Transfer</option>
      </select>

      <input
        type="number"
        placeholder="Monto"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
      />

      <select
        value={formData.scope}
        onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
      >
        <option value="outside_period">Fuera de período</option>
        <option value="period">En período</option>
      </select>

      {formData.scope === 'period' && (
        <input
          type="text"
          placeholder="Period ID"
          value={formData.periodId}
          onChange={(e) => setFormData({ ...formData, periodId: e.target.value })}
        />
      )}

      <input
        type="text"
        placeholder="Descripción"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Transacción'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

// ============================================
// EJEMPLO 4: Transferencia entre cuentas
// ============================================

export function AccountTransferExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async () => {
    setLoading(true);
    setError(null);

    const result = await createAccountTransfer(
      'from-account-uuid',
      'to-account-uuid',
      500,
      {
        description: 'Transfer to savings account',
      }
    );

    if (!result.success) {
      setError(result.error || 'Error desconocido');
      setLoading(false);
      return;
    }

    console.log('Transferencia creada:', result.data);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleTransfer} disabled={loading}>
        {loading ? 'Transfiriendo...' : 'Transferir $500'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

// ============================================
// EJEMPLO 5: Crear ingreso
// ============================================

export function IncomeExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddIncome = async () => {
    setLoading(true);
    setError(null);

    const result = await createIncome(
      'account-uuid-here',
      50000,
      {
        categoryId: 'salary-category-uuid',
        description: 'Salario Noviembre',
        isFixed: true,
      }
    );

    if (!result.success) {
      setError(result.error || 'Error desconocido');
      setLoading(false);
      return;
    }

    console.log('Ingreso creado:', result.data);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleAddIncome} disabled={loading}>
        {loading ? 'Creando...' : 'Registrar Salario'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

// ============================================
// EJEMPLO 6: Manejo de errores avanzado
// ============================================

export function ErrorHandlingExample() {
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    error: string;
    details?: string;
  } | null>(null);

  const handleCreateExpense = async () => {
    setLoading(true);
    setErrorDetails(null);

    const result = await createPeriodExpense(
      'period-uuid',
      'account-uuid',
      999999, // Monto muy alto - probablemente falle
    );

    if (!result.success) {
      setErrorDetails({
        error: result.error || 'Error desconocido',
        details: result.details,
      });
      setLoading(false);
      return;
    }

    console.log('Gasto creado:', result.data);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleCreateExpense} disabled={loading}>
        {loading ? 'Creando...' : 'Crear Gasto (con error esperado)'}
      </button>
      
      {errorDetails && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <p><strong>Error:</strong> {errorDetails.error}</p>
          {errorDetails.details && (
            <p><strong>Detalles:</strong> {errorDetails.details}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 7: Hook personalizado (recomendado)
// ============================================

export function useCreateTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (
    payload: Parameters<typeof createTransaction>[0]
  ) => {
    setLoading(true);
    setError(null);

    const result = await createTransaction(payload);

    if (!result.success) {
      setError(result.error || 'Error desconocido');
      setLoading(false);
      return null;
    }

    setLoading(false);
    return result.data;
  };

  return { create, loading, error };
}

// Uso del hook:
export function HookExample() {
  const { create, loading, error } = useCreateTransaction();

  const handleAddExpense = async () => {
    const transaction = await create({
      account_id: 'uuid',
      type: 'expense',
      amount: 100,
      scope: 'period',
      period_id: 'period-uuid',
    });

    if (transaction) {
      console.log('Transacción creada:', transaction);
      // Actualizar UI, etc.
    }
  };

  return (
    <div>
      <button onClick={handleAddExpense} disabled={loading}>
        {loading ? 'Creando...' : 'Agregar Gasto'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

// ============================================
// EJEMPLO 8: Uso con React Query (recomendado)
// ============================================

import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: (result) => {
      if (result.success) {
        // Invalidar queries relacionadas para refrescar datos
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['periods'] });
      }
    },
  });
}

// Uso con React Query:
export function ReactQueryExample() {
  const mutation = useCreateTransactionMutation();

  const handleAddExpense = () => {
    mutation.mutate({
      account_id: 'uuid',
      type: 'expense',
      amount: 150,
      scope: 'period',
      period_id: 'period-uuid',
      description: 'Compra',
    });
  };

  return (
    <div>
      <button onClick={handleAddExpense} disabled={mutation.isPending}>
        {mutation.isPending ? 'Creando...' : 'Agregar Gasto'}
      </button>
      
      {mutation.isError && (
        <p style={{ color: 'red' }}>
          {mutation.error?.message || 'Error desconocido'}
        </p>
      )}
      
      {mutation.isSuccess && !mutation.data?.success && (
        <p style={{ color: 'red' }}>
          {mutation.data?.error || 'Error desconocido'}
        </p>
      )}
    </div>
  );
}
