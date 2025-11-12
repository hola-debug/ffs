// ============================================
// NUEVOS TIPOS PARA ARQUITECTURA DE BOLSAS
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

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'wallet' | 'crypto' | 'other';
  currency: string;
  balance: number;
  is_primary: boolean;
  created_at: string;
}

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
// BOLSAS (POCKETS)
// ============================================

export type PocketType = 'expense' | 'saving';
export type PocketStatus = 'active' | 'finished' | 'cancelled';

export interface Pocket {
  id: string;
  user_id: string;
  name: string;
  type: PocketType;
  emoji?: string;
  
  // Montos
  allocated_amount: number;
  current_balance: number;
  currency: string;
  
  // Configuración temporal
  starts_at: string;
  ends_at: string;
  days_duration?: number; // Campo calculado
  
  // Específico para BOLSAS DE GASTO
  daily_allowance?: number; // Campo calculado
  
  // Específico para BOLSAS DE AHORRO
  target_amount?: number;
  
  // Control
  status: PocketStatus;
  auto_return_remaining: boolean;
  
  created_at: string;
  updated_at: string;
}

// Bolsa de gastos - útil para type-safety
export interface ExpensePocket extends Pocket {
  type: 'expense';
  daily_allowance: number;
  target_amount: undefined;
}

// Bolsa de ahorro - útil para type-safety
export interface SavingPocket extends Pocket {
  type: 'saving';
  target_amount: number;
  daily_allowance: undefined;
}

// ============================================
// MOVIMIENTOS (MOVEMENTS)
// ============================================

export type MovementType = 
  | 'income'              // Ingreso mensual
  | 'fixed_expense'       // Gasto fijo (nivel ingreso)
  | 'saving_deposit'      // Depósito a ahorro (nivel ingreso)
  | 'pocket_allocation'   // Asignación a bolsa
  | 'pocket_expense'      // Gasto desde bolsa
  | 'pocket_return';      // Devolución de bolsa al ingreso

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
  currency: string;
  
  // Información
  date: string;
  description: string | null;
  metadata: Record<string, any> | null;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// VISTAS Y TIPOS CALCULADOS
// ============================================

export interface ActivePocketSummary extends Pocket {
  days_elapsed: number;
  days_remaining: number;
  progress_percentage?: number; // Para saving pockets
  remaining_daily_allowance?: number; // Para expense pockets
}

export interface UserMonthlySummary {
  user_id: string;
  monthly_income: number;
  currency: string;
  fixed_expenses_month: number;
  saving_deposits_month: number;
  pockets_allocated_month: number;
  available_balance: number;
}

// ============================================
// TIPOS PARA FORMULARIOS
// ============================================

export interface CreatePocketInput {
  name: string;
  type: PocketType;
  emoji?: string;
  allocated_amount: number;
  starts_at: string;
  ends_at: string;
  target_amount?: number; // Requerido si type === 'saving'
  auto_return_remaining?: boolean;
}

export interface CreateMovementInput {
  type: MovementType;
  amount: number;
  date?: string;
  description?: string;
  account_id?: string;
  category_id?: string;
  pocket_id?: string;
  metadata?: Record<string, any>;
}

// ============================================
// TIPOS PARA DASHBOARD
// ============================================

export interface DashboardData {
  profile: Profile;
  accounts: Account[];
  categories: Category[];
  pockets: ActivePocketSummary[];
  expensePockets: ActivePocketSummary[];
  savingPockets: ActivePocketSummary[];
  monthlySummary: UserMonthlySummary;
  recentMovements: Movement[];
}

// Gastos de hoy desde todas las bolsas
export interface TodayExpenses {
  total: number;
  by_pocket: {
    pocket_id: string;
    pocket_name: string;
    amount: number;
  }[];
}

// Progreso de ahorro
export interface SavingsProgress {
  total_saved: number;
  total_target: number;
  progress_percentage: number;
  pockets: {
    id: string;
    name: string;
    current: number;
    target: number;
    percentage: number;
  }[];
}
