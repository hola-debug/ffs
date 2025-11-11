import { supabase } from './supabaseClient';
import type { Transaction, Period } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

// ============================================
// TYPES
// ============================================

export interface CreateTransactionPayload {
  account_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  scope?: 'period' | 'outside_period';
  period_id?: string;
  category_id?: string;
  currency?: string;
  date?: string;
  description?: string;
  is_random?: boolean;
  is_fixed?: boolean;
  is_recurring?: boolean;
  metadata?: Record<string, unknown>;
  
  // Para transfers
  to_account_id?: string;
}

export interface CreatePeriodPayload {
  account_id: string;
  name: string;
  percentage: number;
  days: number;
  allocated_amount: number;
  currency?: string;
  starts_at?: string;
  status?: 'draft' | 'active' | 'finished' | 'cancelled';
  
  // Opciones para transferencia de reserva
  transfer_from_account_id?: string;
  create_transfer_transaction?: boolean;
}

export interface EdgeFunctionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  message?: string;
}

export interface CreatePeriodResponse {
  success: boolean;
  period: Period;
  transfer_transaction?: Transaction;
  message: string;
}

// ============================================
// HELPER: getAuthHeaders
// ============================================

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new Error('No active session. Please login first.');
  }
  
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

// ============================================
// EDGE FUNCTION: create-transaction
// ============================================

/**
 * Crea una transacción usando la Edge Function create-transaction.
 * Centraliza validaciones y maneja actualización de balances.
 * 
 * @example
 * // Gasto en período
 * const result = await createTransaction({
 *   account_id: 'uuid',
 *   type: 'expense',
 *   amount: 150.50,
 *   scope: 'period',
 *   period_id: 'uuid',
 *   category_id: 'uuid',
 *   description: 'Supermercado',
 * });
 * 
 * @example
 * // Transfer entre cuentas
 * const result = await createTransaction({
 *   account_id: 'uuid-origen',
 *   to_account_id: 'uuid-destino',
 *   type: 'transfer',
 *   amount: 500,
 *   description: 'Transfer to savings',
 * });
 */
export async function createTransaction(
  payload: CreateTransactionPayload
): Promise<EdgeFunctionResponse<Transaction>> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-transaction`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to create transaction',
        details: result.details,
      };
    }
    
    return result;
  } catch (error) {
    console.error('createTransaction error:', error);
    return {
      success: false,
      error: 'Network error or unexpected failure',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// EDGE FUNCTION: create-period
// ============================================

/**
 * Crea un período usando la Edge Function create-period.
 * Puede opcionalmente crear una transferencia desde otra cuenta.
 * 
 * @example
 * // Crear período simple
 * const result = await createPeriod({
 *   account_id: 'uuid',
 *   name: 'Quincenal Nov 1-15',
 *   percentage: 50,
 *   days: 15,
 *   allocated_amount: 5000,
 *   status: 'active',
 * });
 * 
 * @example
 * // Crear período con transferencia
 * const result = await createPeriod({
 *   account_id: 'uuid-periodo',
 *   name: 'Quincenal Nov 1-15',
 *   percentage: 50,
 *   days: 15,
 *   allocated_amount: 5000,
 *   status: 'active',
 *   transfer_from_account_id: 'uuid-principal',
 *   create_transfer_transaction: true,
 * });
 */
export async function createPeriod(
  payload: CreatePeriodPayload
): Promise<CreatePeriodResponse | EdgeFunctionResponse<never>> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-period`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to create period',
        details: result.details,
      };
    }
    
    return result;
  } catch (error) {
    console.error('createPeriod error:', error);
    return {
      success: false,
      error: 'Network error or unexpected failure',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// CONVENIENCE HELPERS
// ============================================

/**
 * Crea un gasto dentro de un período.
 */
export async function createPeriodExpense(
  periodId: string,
  accountId: string,
  amount: number,
  options?: {
    categoryId?: string;
    description?: string;
    date?: string;
    isRandom?: boolean;
  }
): Promise<EdgeFunctionResponse<Transaction>> {
  return createTransaction({
    account_id: accountId,
    period_id: periodId,
    type: 'expense',
    scope: 'period',
    amount,
    category_id: options?.categoryId,
    description: options?.description,
    date: options?.date,
    is_random: options?.isRandom || false,
  });
}

/**
 * Crea un gasto fuera de período.
 */
export async function createOutsidePeriodExpense(
  accountId: string,
  amount: number,
  options?: {
    categoryId?: string;
    description?: string;
    date?: string;
    isFixed?: boolean;
    isRandom?: boolean;
  }
): Promise<EdgeFunctionResponse<Transaction>> {
  return createTransaction({
    account_id: accountId,
    type: 'expense',
    scope: 'outside_period',
    amount,
    category_id: options?.categoryId,
    description: options?.description,
    date: options?.date,
    is_fixed: options?.isFixed || false,
    is_random: options?.isRandom || false,
  });
}

/**
 * Crea un ingreso.
 */
export async function createIncome(
  accountId: string,
  amount: number,
  options?: {
    categoryId?: string;
    description?: string;
    date?: string;
    isFixed?: boolean;
  }
): Promise<EdgeFunctionResponse<Transaction>> {
  return createTransaction({
    account_id: accountId,
    type: 'income',
    scope: 'outside_period',
    amount,
    category_id: options?.categoryId,
    description: options?.description,
    date: options?.date,
    is_fixed: options?.isFixed || false,
  });
}

/**
 * Crea una transferencia entre cuentas.
 */
export async function createAccountTransfer(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  options?: {
    description?: string;
    date?: string;
  }
): Promise<EdgeFunctionResponse<Transaction>> {
  return createTransaction({
    account_id: fromAccountId,
    to_account_id: toAccountId,
    type: 'transfer',
    scope: 'outside_period',
    amount,
    description: options?.description,
    date: options?.date,
  });
}

/**
 * Crea un período quincenal con transferencia automática.
 */
export async function createFortnightlyPeriod(
  name: string,
  sourceAccountId: string,
  periodAccountId: string,
  allocatedAmount: number,
  options?: {
    percentage?: number;
    status?: 'draft' | 'active';
    createTransfer?: boolean;
  }
): Promise<CreatePeriodResponse | EdgeFunctionResponse<never>> {
  return createPeriod({
    account_id: periodAccountId,
    name,
    percentage: options?.percentage || 50,
    days: 15,
    allocated_amount: allocatedAmount,
    status: options?.status || 'active',
    transfer_from_account_id: sourceAccountId,
    create_transfer_transaction: options?.createTransfer !== false,
  });
}

/**
 * Crea un período mensual con transferencia automática.
 */
export async function createMonthlyPeriod(
  name: string,
  sourceAccountId: string,
  periodAccountId: string,
  allocatedAmount: number,
  options?: {
    percentage?: number;
    days?: number;
    status?: 'draft' | 'active';
    createTransfer?: boolean;
  }
): Promise<CreatePeriodResponse | EdgeFunctionResponse<never>> {
  return createPeriod({
    account_id: periodAccountId,
    name,
    percentage: options?.percentage || 100,
    days: options?.days || 30,
    allocated_amount: allocatedAmount,
    status: options?.status || 'active',
    transfer_from_account_id: sourceAccountId,
    create_transfer_transaction: options?.createTransfer !== false,
  });
}
