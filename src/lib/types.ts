// ============================================
// TIPOS REFACTORIZADOS - NUEVA ESTRUCTURA
// ============================================

// ============================================
// PROFILES
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  monthly_income: number;
  currency: string;
  created_at: string;
  onboarding_completed: boolean;
}

// ============================================
// ACCOUNTS Y DIVISAS
// ============================================

export type AccountType = 'bank' | 'fintech' | 'cash' | 'crypto' | 'investment' | 'other';
export type CurrencyCode = 'ARS' | 'USD' | 'EUR' | 'UYU' | 'BRL' | 'CLP' | 'PEN' | 'COP' | 'MXN' | 'BTC' | 'ETH';

export interface AccountCurrency {
  currency: CurrencyCode;
  is_primary: boolean;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  is_primary: boolean;
  created_at: string;
  // Relación con divisas (viene desde vista account_with_currencies)
  currencies?: AccountCurrency[];
}

// ============================================
// CATEGORIES
// ============================================

export type CategoryType = 'income' | 'fixed_expense' | 'saving' | 'pocket_expense';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  created_at: string;
}

// ============================================
// POCKETS - NUEVA ARQUITECTURA
// ============================================

export type PocketType = 'expense' | 'saving' | 'debt';
export type PocketStatus = 'active' | 'finished' | 'cancelled' | 'archived';
export type PocketSubtype = 'variable' | 'fixed' | 'period' | 'shared' | null;
export type ExpenseFrequency = 'monthly' | 'weekly' | 'none';

// ============================================
// POCKET BASE
// ============================================

export interface Pocket {
  // Campos base
  id: string;
  user_id: string;
  name: string;
  type: PocketType;
  subtype?: PocketSubtype;
  emoji?: string;
  
  // Relaciones
  account_id?: string;
  linked_account_id?: string;
  
  // Montos
  currency: CurrencyCode;
  
  // Control
  status: PocketStatus;
  created_at: string;
  updated_at: string;
  
  // Campos opcionales según tipo (read-only, calculados)
  starts_at?: string;
  ends_at?: string;
  days_duration?: number;
}

// ============================================
// BOLSAS DE AHORRO (SAVING)
// ============================================

export interface SavingPocket extends Pocket {
  type: 'saving';
  subtype: null;
  
  // Meta
  target_amount: number;
  amount_saved: number;
  remaining_amount?: number; // Calculado: target_amount - amount_saved
  progress_percentage?: number; // Calculado
  
  // Configuración
  starts_at?: string;
  ends_at?: string;
  frequency?: ExpenseFrequency;
  recommended_contribution?: number; // Calculado
  allow_withdrawals?: boolean;
}

// ============================================
// BOLSAS DE GASTO (EXPENSE)
// ============================================

export interface ExpensePocket extends Pocket {
  type: 'expense';
  subtype: 'variable' | 'fixed' | 'period' | 'shared';
}

// EXPENSE.VARIABLE (gasto día a día)
export interface ExpenseVariablePocket extends ExpensePocket {
  subtype: 'variable';
  
  // Asignación
  allocated_amount: number;
  spent_amount: number;
  remaining_amount?: number; // Calculado
  
  // Tiempo
  starts_at: string;
  ends_at: string;
  days_duration: number;
  days_elapsed?: number; // Calculado
  days_remaining?: number; // Calculado
  
  // Gasto diario
  daily_allowance: number;
  daily_allowance_remaining?: number; // Calculado
  reset_mode?: 'monthly' | 'once';
}

// EXPENSE.FIXED (gasto mensual fijo)
export interface ExpenseFixedPocket extends ExpensePocket {
  subtype: 'fixed';
  
  // Monto mensual
  monthly_amount: number;
  due_day: number; // 1-31
  auto_register: boolean;
  
  // Historial
  last_payment?: string;
  next_payment?: string; // Calculado
}

// EXPENSE.PERIOD (período personalizado: viaje, evento)
export interface ExpensePeriodPocket extends ExpensePocket {
  subtype: 'period';
  
  // Asignación
  allocated_amount: number;
  spent_amount: number;
  remaining_amount?: number; // Calculado
  
  // Período
  starts_at: string;
  ends_at: string;
  total_days?: number; // Calculado
  daily_allowance: number;
}

// EXPENSE.SHARED (futuro - bolsa compartida)
export interface ExpenseSharedPocket extends ExpensePocket {
  subtype: 'shared';
  
  // Participantes
  participants?: Array<{ user_id: string; share: number }>;
  
  // Config
  allocated_amount: number;
  spent_amount: number;
  permissions?: {
    can_add_expenses: boolean;
    can_modify: boolean;
  };
}

// ============================================
// BOLSAS DE DEUDA (DEBT)
// ============================================

export interface DebtPocket extends Pocket {
  type: 'debt';
  subtype: null;
  
  // Monto
  original_amount: number;
  remaining_amount: number;
  
  // Cuotas
  installments_total: number;
  installment_current: number;
  installment_amount: number;
  
  // Interés y pagos
  interest_rate?: number;
  automatic_payment: boolean;
  
  // Fechas
  due_day: number;
  last_payment?: string;
  next_payment?: string; // Calculado
}

// ============================================
// MOVEMENTS
// ============================================

export type MovementType = 
  | 'income'                // Ingreso mensual
  | 'fixed_expense'         // Gasto fijo (nivel ingreso)
  | 'saving_deposit'        // Depósito a ahorro (nivel ingreso)
  | 'pocket_allocation'     // Asignación a bolsa
  | 'pocket_expense'        // Gasto desde bolsa
  | 'pocket_return'         // Devolución de bolsa al ingreso
  | 'debt_payment'          // Pago de deuda
  | 'debt_interest'         // Interés de deuda
  | 'fixed_expense_auto';   // Gasto fijo automático

export interface Movement {
  id: string;
  user_id: string;
  type: MovementType;
  
  // Relaciones
  account_id: string | null;
  category_id: string | null;
  pocket_id: string | null;
  
  // Montos
  amount: number;
  currency: CurrencyCode;
  
  // Información
  date: string;
  description: string | null;
  metadata: Record<string, any> | null;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// INPUTS PARA FORMULARIOS
// ============================================

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance?: number;
  is_primary?: boolean;
  currencies: Array<{ currency: CurrencyCode; is_primary: boolean }>;
}

export interface CreateIncomeInput {
  account_id: string;
  amount: number;
  currency: CurrencyCode;
  date?: string;
  description?: string;
  category_id?: string;
}

export interface CreatePocketInput {
  name: string;
  type: PocketType;
  subtype?: PocketSubtype;
  emoji?: string;
  account_id: string;
  linked_account_id?: string;
  currency: CurrencyCode;
  
  // Para SAVING
  target_amount?: number;
  frequency?: ExpenseFrequency;
  allow_withdrawals?: boolean;
  
  // Para EXPENSE
  allocated_amount?: number;
  monthly_amount?: number;
  due_day?: number;
  auto_register?: boolean;
  reset_mode?: 'monthly' | 'once';
  
  // Para DEBT
  original_amount?: number;
  installments_total?: number;
  installment_amount?: number;
  interest_rate?: number;
  automatic_payment?: boolean;
  
  // Fechas
  starts_at?: string;
  ends_at?: string;
}

export interface UpdatePocketInput extends Partial<CreatePocketInput> {
  id: string;
}

export interface CreateMovementInput {
  type: MovementType;
  amount: number;
  currency: CurrencyCode;
  date?: string;
  description?: string;
  account_id?: string;
  category_id?: string;
  pocket_id?: string;
  metadata?: Record<string, any>;
}

// ============================================
// TYPES HELPERS
// ============================================

// Type guards
export function isSavingPocket(pocket: Pocket): pocket is SavingPocket {
  return pocket.type === 'saving';
}

export function isExpensePocket(pocket: Pocket): pocket is ExpensePocket {
  return pocket.type === 'expense';
}

export function isDebtPocket(pocket: Pocket): pocket is DebtPocket {
  return pocket.type === 'debt';
}

export function isExpenseVariablePocket(pocket: Pocket): pocket is ExpenseVariablePocket {
  return pocket.type === 'expense' && pocket.subtype === 'variable';
}

export function isExpenseFixedPocket(pocket: Pocket): pocket is ExpenseFixedPocket {
  return pocket.type === 'expense' && pocket.subtype === 'fixed';
}

export function isExpensePeriodPocket(pocket: Pocket): pocket is ExpensePeriodPocket {
  return pocket.type === 'expense' && pocket.subtype === 'period';
}

export function isExpenseSharedPocket(pocket: Pocket): pocket is ExpenseSharedPocket {
  return pocket.type === 'expense' && pocket.subtype === 'shared';
}

// ============================================
// VISTAS Y RESÚMENES
// ============================================

export interface ActivePocketSummary extends Pocket {
  days_elapsed?: number;
  days_remaining?: number;
  progress_percentage?: number;
  remaining_daily_allowance?: number;
}

export interface DashboardData {
  profile: Profile;
  accounts: Account[];
  categories: Category[];
  pockets: ActivePocketSummary[];
  expensePockets: ActivePocketSummary[];
  savingPockets: ActivePocketSummary[];
  debtPockets?: ActivePocketSummary[];
  recentMovements: Movement[];
}
