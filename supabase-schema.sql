-- ============================================
-- DAILY ALLOWANCE - SCHEMA COMPLETO SUPABASE
-- ============================================
-- Ejecutá este SQL completo en el SQL Editor de Supabase

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLAS BASE
-- ============================================

-- Perfiles de usuario (espejo de auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cuentas del usuario (efectivo, banco, billetera, cripto)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'wallet', 'crypto', 'other')),
  currency TEXT NOT NULL DEFAULT 'UYU',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- Categorías
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'fixed', 'variable', 'random', 'saving')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Transacciones
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'UYU',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  is_random BOOLEAN DEFAULT FALSE,
  is_fixed BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);

-- Vaults de ahorro
CREATE TABLE savings_vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  target_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_savings_vaults_user_id ON savings_vaults(user_id);

-- Movimientos de ahorro
CREATE TABLE savings_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vault_id UUID NOT NULL REFERENCES savings_vaults(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_savings_moves_user_id ON savings_moves(user_id);
CREATE INDEX idx_savings_moves_date ON savings_moves(date);

-- Plan mensual
CREATE TABLE monthly_plan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year > 2000),
  planned_income NUMERIC(12,2) DEFAULT 0,
  planned_fixed_expenses NUMERIC(12,2) DEFAULT 0,
  planned_savings NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

CREATE INDEX idx_monthly_plan_user_id ON monthly_plan(user_id);

-- Reglas recurrentes (suscripciones, salarios)
CREATE TABLE recurring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UYU',
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurring_rules_user_id ON recurring_rules(user_id);

-- ============================================
-- VISTAS
-- ============================================

-- Vista: Resumen del mes actual
CREATE OR REPLACE VIEW vw_month_summary AS
SELECT
  user_id,
  EXTRACT(MONTH FROM date)::INTEGER AS month,
  EXTRACT(YEAR FROM date)::INTEGER AS year,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' AND is_fixed = TRUE THEN amount ELSE 0 END) AS total_expenses_fixed,
  SUM(CASE WHEN type = 'expense' AND is_fixed = FALSE AND is_random = FALSE THEN amount ELSE 0 END) AS total_expenses_variable,
  SUM(CASE WHEN type = 'expense' AND is_random = TRUE THEN amount ELSE 0 END) AS total_expenses_random
FROM transactions
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY user_id, month, year;

-- Vista: Gastos de hoy
CREATE OR REPLACE VIEW vw_today_expenses AS
SELECT
  user_id,
  SUM(amount) AS total_today
FROM transactions
WHERE date = CURRENT_DATE
  AND type = 'expense'
GROUP BY user_id;

-- Vista: Gastos random del mes
CREATE OR REPLACE VIEW vw_random_expenses_month AS
SELECT
  user_id,
  SUM(amount) AS total_random
FROM transactions
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND type = 'expense'
  AND is_random = TRUE
GROUP BY user_id;

-- Vista: Total ahorrado por moneda
CREATE OR REPLACE VIEW vw_savings_total AS
SELECT
  user_id,
  currency,
  SUM(amount) AS total_saved
FROM savings_moves
GROUP BY user_id, currency;

-- Vista: Saldo diario disponible (LA CLAVE)
CREATE OR REPLACE VIEW vw_daily_spendable AS
WITH month_data AS (
  SELECT
    user_id,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS ingresos_mes,
    COALESCE(SUM(CASE WHEN type = 'expense' AND is_fixed = TRUE THEN amount ELSE 0 END), 0) AS gastos_fijos_mes,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS gastos_totales_mes
  FROM transactions
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY user_id
),
savings_data AS (
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) AS ahorro_mes
  FROM savings_moves
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY user_id
),
today_data AS (
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) AS gastos_hoy
  FROM transactions
  WHERE date = CURRENT_DATE
    AND type = 'expense'
  GROUP BY user_id
),
days_calc AS (
  SELECT
    EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::INTEGER AS total_dias_mes,
    EXTRACT(DAY FROM CURRENT_DATE)::INTEGER AS dia_actual
)
SELECT
  m.user_id,
  m.ingresos_mes,
  m.gastos_fijos_mes,
  COALESCE(s.ahorro_mes, 0) AS ahorro_mes,
  (m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)) AS disponible_mes,
  (d.total_dias_mes - d.dia_actual + 1) AS dias_restantes,
  ROUND((m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)) / NULLIF(d.total_dias_mes - d.dia_actual + 1, 0), 2) AS saldo_diario_hoy,
  COALESCE(t.gastos_hoy, 0) AS gastos_hoy,
  ROUND((m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)) / NULLIF(d.total_dias_mes - d.dia_actual + 1, 0) - COALESCE(t.gastos_hoy, 0), 2) AS saldo_diario_restante_hoy
FROM month_data m
CROSS JOIN days_calc d
LEFT JOIN savings_data s ON s.user_id = m.user_id
LEFT JOIN today_data t ON t.user_id = m.user_id;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para accounts
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- Políticas para categories
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Políticas para transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Políticas para savings_vaults
CREATE POLICY "Users can view own vaults" ON savings_vaults FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vaults" ON savings_vaults FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vaults" ON savings_vaults FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vaults" ON savings_vaults FOR DELETE USING (auth.uid() = user_id);

-- Políticas para savings_moves
CREATE POLICY "Users can view own savings_moves" ON savings_moves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings_moves" ON savings_moves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings_moves" ON savings_moves FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings_moves" ON savings_moves FOR DELETE USING (auth.uid() = user_id);

-- Políticas para monthly_plan
CREATE POLICY "Users can view own monthly_plan" ON monthly_plan FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monthly_plan" ON monthly_plan FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monthly_plan" ON monthly_plan FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monthly_plan" ON monthly_plan FOR DELETE USING (auth.uid() = user_id);

-- Políticas para recurring_rules
CREATE POLICY "Users can view own recurring_rules" ON recurring_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring_rules" ON recurring_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring_rules" ON recurring_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring_rules" ON recurring_rules FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCIÓN: Auto-crear profile al registrarse
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
