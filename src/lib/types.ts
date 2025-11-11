export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
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

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: 'income' | 'fixed' | 'variable' | 'random' | 'saving';
  scope: 'period' | 'outside_period' | 'both';
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  period_id: string | null;
  type: 'income' | 'expense' | 'transfer';
  scope: 'period' | 'outside_period';
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  notes?: string | null; // Deprecated, use description
  is_random: boolean;
  is_fixed: boolean;
  is_recurring: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Period {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  percentage: number;
  days: number;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  daily_amount: number;
  currency: string;
  starts_at: string;
  ends_at: string | null;
  status: 'draft' | 'active' | 'finished' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface SavingsVault {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  target_amount: number | null;
  created_at: string;
}

export interface SavingsMove {
  id: string;
  user_id: string;
  vault_id: string;
  from_account_id: string | null;
  to_account_id: string | null;
  amount: number;
  currency: string;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface MonthSummary {
  user_id: string;
  month: number;
  year: number;
  total_income: number;
  total_expenses_fixed: number;
  total_expenses_variable: number;
  total_expenses_random: number;
}

export interface TodayExpenses {
  user_id: string;
  total_today: number;
}

export interface RandomExpensesMonth {
  user_id: string;
  total_random: number;
}

export interface SavingsTotal {
  user_id: string;
  currency: string;
  total_saved: number;
}

export interface DailySpendable {
  user_id: string;
  ingresos_mes: number;
  gastos_fijos_mes: number;
  ahorro_mes: number;
  disponible_mes: number;
  dias_restantes: number;
  saldo_diario_hoy: number;
  gastos_hoy: number;
  saldo_diario_restante_hoy: number;
  // Campos para saldo acumulado
  saldo_diario_base: number; // Lo que se suma cada día
  saldo_acumulado_hoy: number; // Total acumulado disponible hoy
  total_mensual_teorico: number; // saldo_diario_base * días del mes
}

export interface DailyProjection {
  date: string;
  day_name: string; // Ej: "LUN", "MAR"
  day_number: number;
  month_number: number;
  accumulated_balance: number; // Saldo acumulado proyectado para ese día
}

export interface DailyExpensesAccumulated {
  user_id: string;
  dia_actual: number;
  mes_actual: number;
  ano_actual: number;
  total_dias_mes: number;
  gastos_acumulados_mes: number; // Gastos variables acumulados del mes hasta hoy
  gastos_hoy: number; // Gastos variables solo de hoy
  promedio_diario_gasto: number; // Promedio de gasto diario
}

export interface DailyExpensesProjection {
  date: string;
  day_name: string;
  day_number: number;
  month_number: number;
  accumulated_expenses: number; // Gastos acumulados proyectados para ese día
  projected_daily_avg: number; // Promedio diario usado para la proyección
}

export interface PeriodRandomDaily {
  user_id: string;
  period_id: string;
  date: string;
  daily_random_total: number;
  accumulated_random_total: number;
}
