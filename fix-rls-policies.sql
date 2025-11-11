-- ============================================
-- VERIFICAR Y REPARAR POLÍTICAS RLS
-- ============================================

-- Este script asegura que todas las tablas tengan RLS habilitado
-- y que las políticas estén correctamente aplicadas

-- 1. VERIFICAR ESTADO ACTUAL DE RLS
-- Ejecuta esto primero para ver qué tablas tienen RLS habilitado:
/*
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'accounts', 'categories', 'transactions', 'periods', 'savings_vaults', 'savings_moves', 'monthly_plan', 'recurring_rules');
*/

-- 2. VERIFICAR POLÍTICAS EXISTENTES
-- Ejecuta esto para ver qué políticas existen:
/*
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- ============================================
-- ELIMINAR POLÍTICAS ANTIGUAS Y RECREARLAS
-- ============================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ACCOUNTS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;
DROP POLICY IF EXISTS "accounts_select" ON accounts;
DROP POLICY IF EXISTS "accounts_insert" ON accounts;
DROP POLICY IF EXISTS "accounts_update" ON accounts;
DROP POLICY IF EXISTS "accounts_delete" ON accounts;

CREATE POLICY "accounts_select" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "accounts_insert" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_update" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "accounts_delete" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "categories_delete" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- TRANSACTIONS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;
DROP POLICY IF EXISTS "transactions_delete" ON transactions;

CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "transactions_delete" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- PERIODS
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "periods_select" ON periods;
DROP POLICY IF EXISTS "periods_insert" ON periods;
DROP POLICY IF EXISTS "periods_update" ON periods;
DROP POLICY IF EXISTS "periods_delete" ON periods;

CREATE POLICY "periods_select" ON periods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "periods_insert" ON periods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "periods_update" ON periods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "periods_delete" ON periods
  FOR DELETE USING (auth.uid() = user_id);

-- SAVINGS_VAULTS
ALTER TABLE savings_vaults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own vaults" ON savings_vaults;
DROP POLICY IF EXISTS "Users can insert own vaults" ON savings_vaults;
DROP POLICY IF EXISTS "Users can update own vaults" ON savings_vaults;
DROP POLICY IF EXISTS "Users can delete own vaults" ON savings_vaults;
DROP POLICY IF EXISTS "savings_vaults_select" ON savings_vaults;
DROP POLICY IF EXISTS "savings_vaults_insert" ON savings_vaults;
DROP POLICY IF EXISTS "savings_vaults_update" ON savings_vaults;
DROP POLICY IF EXISTS "savings_vaults_delete" ON savings_vaults;

CREATE POLICY "savings_vaults_select" ON savings_vaults
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "savings_vaults_insert" ON savings_vaults
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_vaults_update" ON savings_vaults
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "savings_vaults_delete" ON savings_vaults
  FOR DELETE USING (auth.uid() = user_id);

-- SAVINGS_MOVES
ALTER TABLE savings_moves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own savings_moves" ON savings_moves;
DROP POLICY IF EXISTS "Users can insert own savings_moves" ON savings_moves;
DROP POLICY IF EXISTS "Users can update own savings_moves" ON savings_moves;
DROP POLICY IF EXISTS "Users can delete own savings_moves" ON savings_moves;
DROP POLICY IF EXISTS "savings_moves_select" ON savings_moves;
DROP POLICY IF EXISTS "savings_moves_insert" ON savings_moves;
DROP POLICY IF EXISTS "savings_moves_update" ON savings_moves;
DROP POLICY IF EXISTS "savings_moves_delete" ON savings_moves;

CREATE POLICY "savings_moves_select" ON savings_moves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "savings_moves_insert" ON savings_moves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_moves_update" ON savings_moves
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "savings_moves_delete" ON savings_moves
  FOR DELETE USING (auth.uid() = user_id);

-- MONTHLY_PLAN
ALTER TABLE monthly_plan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own monthly_plan" ON monthly_plan;
DROP POLICY IF EXISTS "Users can insert own monthly_plan" ON monthly_plan;
DROP POLICY IF EXISTS "Users can update own monthly_plan" ON monthly_plan;
DROP POLICY IF EXISTS "Users can delete own monthly_plan" ON monthly_plan;
DROP POLICY IF EXISTS "monthly_plan_select" ON monthly_plan;
DROP POLICY IF EXISTS "monthly_plan_insert" ON monthly_plan;
DROP POLICY IF EXISTS "monthly_plan_update" ON monthly_plan;
DROP POLICY IF EXISTS "monthly_plan_delete" ON monthly_plan;

CREATE POLICY "monthly_plan_select" ON monthly_plan
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "monthly_plan_insert" ON monthly_plan
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "monthly_plan_update" ON monthly_plan
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "monthly_plan_delete" ON monthly_plan
  FOR DELETE USING (auth.uid() = user_id);

-- RECURRING_RULES
ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recurring_rules" ON recurring_rules;
DROP POLICY IF EXISTS "Users can insert own recurring_rules" ON recurring_rules;
DROP POLICY IF EXISTS "Users can update own recurring_rules" ON recurring_rules;
DROP POLICY IF EXISTS "Users can delete own recurring_rules" ON recurring_rules;
DROP POLICY IF EXISTS "recurring_rules_select" ON recurring_rules;
DROP POLICY IF EXISTS "recurring_rules_insert" ON recurring_rules;
DROP POLICY IF EXISTS "recurring_rules_update" ON recurring_rules;
DROP POLICY IF EXISTS "recurring_rules_delete" ON recurring_rules;

CREATE POLICY "recurring_rules_select" ON recurring_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "recurring_rules_insert" ON recurring_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring_rules_update" ON recurring_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "recurring_rules_delete" ON recurring_rules
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Ejecuta esto después de aplicar las políticas para verificar:
/*
SELECT 
  tablename,
  COUNT(*) as num_policies,
  string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
*/
