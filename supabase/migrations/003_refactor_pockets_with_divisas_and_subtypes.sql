-- ============================================
-- MIGRACIÓN: CREAR BASE DE DATOS DESDE CERO
-- ============================================
-- Esta migración:
-- 1. Borra TODAS las tablas existentes (empezar limpio)
-- 2. Crea estructura completa con arquitectura final
-- 3. Subtipos: period, recurrent, fixed, shared
-- 4. Sin redundancias (no currency/is_primary en accounts)
-- 5. Triggers, vistas y funciones

-- ============================================
-- PASO 0: LIMPIAR TODO (EMPEZAR DE CERO)
-- ============================================

-- ⚠️ ADVERTENCIA: Esto BORRA TODAS LAS TABLAS
-- Solo ejecutar si quieres empezar desde cero

DROP TABLE IF EXISTS account_currencies CASCADE;
DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS pockets CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Eliminar vistas antiguas
DROP VIEW IF EXISTS account_balances CASCADE;
DROP VIEW IF EXISTS active_pockets_summary CASCADE;
DROP VIEW IF EXISTS user_monthly_summary CASCADE;
DROP VIEW IF EXISTS pocket_summary CASCADE;
DROP VIEW IF EXISTS account_with_currencies CASCADE;

-- Eliminar funciones antiguas
DROP FUNCTION IF EXISTS calculate_recommended_contribution CASCADE;
DROP FUNCTION IF EXISTS calculate_next_payment CASCADE;
DROP FUNCTION IF EXISTS update_saving_pocket_balance CASCADE;
DROP FUNCTION IF EXISTS update_expense_pocket_spent CASCADE;
DROP FUNCTION IF EXISTS update_debt_pocket_remaining CASCADE;

-- ============================================
-- PASO 1: CREAR TABLA PROFILES
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  default_currency TEXT DEFAULT 'UYU',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================
-- PASO 2: CREAR TABLA ACCOUNTS (SIN REDUNDANCIAS)
-- ============================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (type IN ('bank', 'fintech', 'cash', 'crypto', 'investment', 'other'))
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- ============================================
-- PASO 3: CREAR TABLA ACCOUNT_CURRENCIES
-- ============================================

CREATE TABLE IF NOT EXISTS account_currencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, currency),
  CHECK (currency IN ('ARS', 'USD', 'EUR', 'UYU', 'BRL', 'CLP', 'PEN', 'COP', 'MXN', 'BTC', 'ETH'))
);

CREATE INDEX idx_account_currencies_account ON account_currencies(account_id);

-- ============================================
-- PASO 4: CREAR TABLA CATEGORIES
-- ============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- ============================================
-- PASO 5: CREAR TABLA EXCHANGE_RATES
-- ============================================

CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(from_currency, to_currency, date)
);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);

-- ============================================
-- PASO 6: CREAR TABLA POCKETS (COMPLETA)
-- ============================================

CREATE TABLE pockets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  linked_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  emoji TEXT,
  type TEXT NOT NULL,
  subtype TEXT,
  status TEXT DEFAULT 'active',
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Campos comunes
  starts_at DATE,
  ends_at DATE,
  days_duration INT,
  daily_allowance NUMERIC(12,2),

  
  -- SAVING
  target_amount NUMERIC(12,2),
  amount_saved NUMERIC(12,2) DEFAULT 0,
  allow_withdrawals BOOLEAN DEFAULT TRUE,
  frequency TEXT,
  
  -- EXPENSE (period, recurrent)
  allocated_amount NUMERIC(12,2),
  spent_amount NUMERIC(12,2) DEFAULT 0,
  
  -- EXPENSE.FIXED y EXPENSE.RECURRENT
  monthly_amount NUMERIC(12,2),
  due_day INT,
  auto_register BOOLEAN DEFAULT FALSE,
  last_payment DATE,
  next_payment DATE,
  
  -- EXPENSE.RECURRENT (específicos)
  average_amount NUMERIC(12,2),
  last_payment_amount NUMERIC(12,2),
  notification_days_before INT DEFAULT 3,
  
  -- DEBT
  original_amount NUMERIC(12,2),
  remaining_amount NUMERIC(12,2),
  installments_total INT,
  installment_current INT DEFAULT 0,
  installment_amount NUMERIC(12,2),
  interest_rate NUMERIC(5,2),
  automatic_payment BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CHECK (type IN ('expense', 'saving', 'debt')),
  CHECK (status IN ('active', 'finished', 'cancelled')),
  CHECK (frequency IN ('monthly', 'weekly', 'none', NULL)),
  CHECK (due_day BETWEEN 1 AND 31 OR due_day IS NULL),
  CHECK (
    (type = 'expense' AND subtype IN ('period', 'recurrent', 'fixed', 'shared')) OR
    (type IN ('saving', 'debt') AND subtype IS NULL)
  ),
  CHECK (
    (type = 'saving' AND target_amount IS NOT NULL AND target_amount > 0) OR
    (type != 'saving')
  ),
  CHECK (
    (type = 'debt' AND original_amount IS NOT NULL AND original_amount > 0) OR
    (type != 'debt')
  )
);

CREATE INDEX idx_pockets_user_id ON pockets(user_id);
CREATE INDEX idx_pockets_account_id ON pockets(account_id);
CREATE INDEX idx_pockets_subtype ON pockets(subtype);
CREATE INDEX idx_pockets_type_subtype ON pockets(type, subtype);
CREATE INDEX idx_pockets_status ON pockets(status);

-- ============================================
-- PASO 7: CREAR TABLA MOVEMENTS (COMPLETA)
-- ============================================

CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  pocket_id UUID REFERENCES pockets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (type IN (
    'income',
    'fixed_expense',
    'saving_deposit',
    'pocket_allocation',
    'pocket_expense',
    'pocket_return',
    'debt_payment',
    'debt_interest',
    'fixed_expense_auto'
  ))
);

CREATE INDEX idx_movements_user_id ON movements(user_id);
CREATE INDEX idx_movements_account_id ON movements(account_id);
CREATE INDEX idx_movements_pocket_id ON movements(pocket_id);
CREATE INDEX idx_movements_type ON movements(type);
CREATE INDEX idx_movements_date ON movements(date);

-- ============================================
-- PASO 8: FUNCIONES CALCULADAS
-- ============================================

-- Función para calcular recommended_contribution en saving pockets
CREATE OR REPLACE FUNCTION calculate_recommended_contribution(
  p_target_amount NUMERIC,
  p_amount_saved NUMERIC,
  p_frequency TEXT,
  p_end_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_days_remaining INT;
  v_weeks_remaining INT;
  v_months_remaining INT;
BEGIN
  IF p_end_date IS NULL OR p_frequency = 'none' OR p_frequency IS NULL THEN
    RETURN NULL;
  END IF;
  
  v_days_remaining := (p_end_date - CURRENT_DATE);
  v_weeks_remaining := CEIL(v_days_remaining::NUMERIC / 7);
  v_months_remaining := CEIL(v_days_remaining::NUMERIC / 30);
  
  IF p_frequency = 'weekly' AND v_weeks_remaining > 0 THEN
    RETURN ROUND(((p_target_amount - p_amount_saved) / v_weeks_remaining)::NUMERIC, 2);
  ELSIF p_frequency = 'monthly' AND v_months_remaining > 0 THEN
    RETURN ROUND(((p_target_amount - p_amount_saved) / v_months_remaining)::NUMERIC, 2);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para calcular next_payment en fixed/recurrent expenses
CREATE OR REPLACE FUNCTION calculate_next_payment(
  p_due_day INT,
  p_last_payment DATE
)
RETURNS DATE AS $$
DECLARE
  v_current_month_payment DATE;
BEGIN
  IF p_due_day IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Crear fecha con el due_day del mes actual
  v_current_month_payment := DATE_TRUNC('month', CURRENT_DATE)::DATE + (p_due_day - 1)::INT;
  
  -- Si ya pasó en este mes, devolver del mes que viene
  IF v_current_month_payment <= CURRENT_DATE THEN
    RETURN (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE + (p_due_day - 1)::INT;
  END IF;
  
  RETURN v_current_month_payment;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PASO 9: VISTAS
-- ============================================

CREATE OR REPLACE VIEW pocket_summary AS
SELECT
  p.id,
  p.user_id,
  p.account_id,
  p.name,
  p.emoji,
  p.type,
  p.subtype,
  p.status,
  p.currency,
  p.created_at,
  
  -- SAVING fields
  p.target_amount,
  p.amount_saved,
  CASE 
    WHEN p.type = 'saving' AND p.target_amount > 0 THEN
      ROUND((p.amount_saved / p.target_amount * 100)::NUMERIC, 2)
    ELSE NULL
  END AS progress_percentage,
  (p.target_amount - p.amount_saved) AS remaining_for_goal,
  calculate_recommended_contribution(p.target_amount, p.amount_saved, p.frequency, p.ends_at) AS recommended_contribution,
  p.allow_withdrawals,
  p.frequency,
  
  -- EXPENSE.PERIOD fields
  p.allocated_amount,
  p.spent_amount,
  (p.allocated_amount - p.spent_amount) AS remaining_amount_expense,
  p.days_duration,
  p.daily_allowance,
  (CURRENT_DATE - p.starts_at)::INT AS days_elapsed,
  (p.ends_at - CURRENT_DATE)::INT AS days_remaining,
  CASE
    WHEN p.type = 'expense' AND p.subtype = 'period' AND p.ends_at IS NOT NULL AND (p.ends_at - CURRENT_DATE) > 0 THEN
      ROUND((p.allocated_amount - p.spent_amount) / (p.ends_at - CURRENT_DATE + 1)::NUMERIC, 2)
    ELSE NULL
  END AS daily_allowance_remaining,
  
  -- EXPENSE.RECURRENT fields
  p.average_amount,
  p.last_payment_amount,
  p.notification_days_before,
  
  -- EXPENSE.FIXED fields
  p.monthly_amount,
  p.due_day,
  p.auto_register,
  p.last_payment,
  p.next_payment,
  
  -- DEBT fields
  p.original_amount,
  p.remaining_amount,
  p.installments_total,
  p.installment_current,
  p.installment_amount,
  p.interest_rate,
  p.automatic_payment
  
FROM pockets p;

-- Vista de resumen de divisas por cuenta
CREATE OR REPLACE VIEW account_with_currencies AS
SELECT
  a.id,
  a.user_id,
  a.name,
  a.type,
  a.created_at,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'currency', ac.currency,
        'is_primary', ac.is_primary
      ) ORDER BY ac.is_primary DESC, ac.currency
    ) FILTER (WHERE ac.currency IS NOT NULL),
    '[]'::JSON
  ) AS currencies
FROM accounts a
LEFT JOIN account_currencies ac ON a.id = ac.account_id
GROUP BY a.id, a.user_id, a.name, a.type, a.created_at;

-- ============================================
-- PASO 10: TRIGGERS PARA CÁLCULOS
-- ============================================

-- Función para obtener divisa primaria de una cuenta
CREATE OR REPLACE FUNCTION get_account_primary_currency(p_account_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_currency TEXT;
BEGIN
  -- Buscar la divisa primaria de la cuenta
  SELECT currency INTO v_currency
  FROM account_currencies
  WHERE account_id = p_account_id
    AND is_primary = TRUE
  LIMIT 1;
  
  -- Si no hay primaria, tomar la primera disponible
  IF v_currency IS NULL THEN
    SELECT currency INTO v_currency
    FROM account_currencies
    WHERE account_id = p_account_id
    LIMIT 1;
  END IF;
  
  RETURN v_currency;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger para auto-calcular campos de período y currency
CREATE OR REPLACE FUNCTION calculate_pocket_period_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular days_duration si hay starts_at y ends_at
  IF NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL THEN
    NEW.days_duration := (NEW.ends_at - NEW.starts_at)::INT + 1;
  END IF;
  
  -- Calcular daily_allowance para expense.period
  IF NEW.type = 'expense' AND NEW.subtype = 'period' 
     AND NEW.allocated_amount IS NOT NULL 
     AND NEW.days_duration IS NOT NULL 
     AND NEW.days_duration > 0 THEN
    NEW.daily_allowance := ROUND((NEW.allocated_amount / NEW.days_duration)::NUMERIC, 2);
  END IF;
  
  -- Auto-asignar currency si no está presente pero hay account_id
  IF NEW.currency IS NULL AND NEW.account_id IS NOT NULL THEN
    NEW.currency := get_account_primary_currency(NEW.account_id);
    -- Si aún no hay currency, usar UYU por defecto
    IF NEW.currency IS NULL THEN
      NEW.currency := 'UYU';
    END IF;
  END IF;
  
  -- Calcular next_payment para fixed y recurrent
  IF NEW.type = 'expense' AND NEW.subtype IN ('fixed', 'recurrent') 
     AND NEW.due_day IS NOT NULL THEN
    NEW.next_payment := calculate_next_payment(NEW.due_day, NEW.last_payment);
  END IF;
  
  -- Para debt, también calcular next_payment
  IF NEW.type = 'debt' AND NEW.due_day IS NOT NULL THEN
    NEW.next_payment := calculate_next_payment(NEW.due_day, NEW.last_payment);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_pocket_fields ON pockets;
CREATE TRIGGER trg_calculate_pocket_fields
BEFORE INSERT OR UPDATE ON pockets
FOR EACH ROW
EXECUTE FUNCTION calculate_pocket_period_fields();

-- Trigger para actualizar amount_saved en pockets de ahorro
CREATE OR REPLACE FUNCTION update_saving_pocket_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'saving_deposit' THEN
      UPDATE pockets
      SET amount_saved = GREATEST(0, amount_saved + NEW.amount)
      WHERE id = NEW.pocket_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'saving_deposit' THEN
      UPDATE pockets
      SET amount_saved = GREATEST(0, amount_saved - OLD.amount)
      WHERE id = OLD.pocket_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_saving_pocket_balance ON movements;
CREATE TRIGGER trg_update_saving_pocket_balance
AFTER INSERT OR DELETE ON movements
FOR EACH ROW
EXECUTE FUNCTION update_saving_pocket_balance();

-- Trigger para actualizar spent_amount en pockets de gasto
CREATE OR REPLACE FUNCTION update_expense_pocket_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'pocket_expense' THEN
      UPDATE pockets
      SET spent_amount = GREATEST(0, spent_amount + NEW.amount)
      WHERE id = NEW.pocket_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'pocket_expense' THEN
      UPDATE pockets
      SET spent_amount = GREATEST(0, spent_amount - OLD.amount)
      WHERE id = OLD.pocket_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_expense_pocket_spent ON movements;
CREATE TRIGGER trg_update_expense_pocket_spent
AFTER INSERT OR DELETE ON movements
FOR EACH ROW
EXECUTE FUNCTION update_expense_pocket_spent();

-- Trigger para actualizar remaining_amount en pockets de deuda
CREATE OR REPLACE FUNCTION update_debt_pocket_remaining()
RETURNS TRIGGER AS $$
DECLARE
  v_total_payments NUMERIC(12,2);
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    -- Recalcular remaining_amount basado en pagos
    UPDATE pockets p
    SET remaining_amount = GREATEST(
      0,
      p.original_amount - COALESCE(
        (SELECT SUM(amount) FROM movements WHERE pocket_id = p.id AND type IN ('debt_payment', 'debt_interest')),
        0
      )
    )
    WHERE p.id = (CASE WHEN TG_OP = 'DELETE' THEN OLD.pocket_id ELSE NEW.pocket_id END)
      AND p.type = 'debt';
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_debt_pocket_remaining ON movements;
CREATE TRIGGER trg_update_debt_pocket_remaining
AFTER INSERT OR DELETE ON movements
FOR EACH ROW
EXECUTE FUNCTION update_debt_pocket_remaining();

-- Trigger para actualizar last_payment cuando se registra un pago
CREATE OR REPLACE FUNCTION update_pocket_last_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Actualizar last_payment para fixed_expense o debt_payment
    IF NEW.type IN ('fixed_expense', 'fixed_expense_auto', 'debt_payment') AND NEW.pocket_id IS NOT NULL THEN
      UPDATE pockets
      SET last_payment = NEW.date
      WHERE id = NEW.pocket_id;
      
      -- Recalcular next_payment
      UPDATE pockets
      SET next_payment = calculate_next_payment(due_day, last_payment)
      WHERE id = NEW.pocket_id
        AND due_day IS NOT NULL;
    END IF;
    
    -- Para recurrent, actualizar last_payment_amount y promedio
    IF NEW.type = 'pocket_expense' AND NEW.pocket_id IS NOT NULL THEN
      UPDATE pockets
      SET 
        last_payment = NEW.date,
        last_payment_amount = NEW.amount,
        -- Recalcular promedio (simple: último promedio * 0.7 + nuevo valor * 0.3)
        average_amount = CASE 
          WHEN average_amount IS NULL THEN NEW.amount
          ELSE ROUND((COALESCE(average_amount, 0) * 0.7 + NEW.amount * 0.3)::NUMERIC, 2)
        END
      WHERE id = NEW.pocket_id
        AND type = 'expense'
        AND subtype = 'recurrent';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_pocket_last_payment ON movements;
CREATE TRIGGER trg_update_pocket_last_payment
AFTER INSERT OR DELETE ON movements
FOR EACH ROW
EXECUTE FUNCTION update_pocket_last_payment();

-- ============================================
-- PASO 11: RLS POLICIES
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
USING (id = auth.uid());

-- Policies para accounts
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE
USING (user_id = auth.uid());

-- Policies para pockets
CREATE POLICY "Users can view own pockets" ON pockets FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pockets" ON pockets FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pockets" ON pockets FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own pockets" ON pockets FOR DELETE
USING (user_id = auth.uid());

-- Policies para movements
CREATE POLICY "Users can view own movements" ON movements FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own movements" ON movements FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own movements" ON movements FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own movements" ON movements FOR DELETE
USING (user_id = auth.uid());

-- Policies para categories
CREATE POLICY "Users can view own categories" ON categories FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own categories" ON categories FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories" ON categories FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories" ON categories FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- PASO 12: POLICIES PARA ACCOUNT_CURRENCIES
-- ============================================

ALTER TABLE account_currencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own account currencies" ON account_currencies;
CREATE POLICY "Users can view own account currencies" ON account_currencies FOR SELECT
USING (
  account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own account currencies" ON account_currencies;
CREATE POLICY "Users can insert own account currencies" ON account_currencies FOR INSERT
WITH CHECK (
  account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own account currencies" ON account_currencies;
CREATE POLICY "Users can update own account currencies" ON account_currencies FOR UPDATE
USING (
  account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own account currencies" ON account_currencies;
CREATE POLICY "Users can delete own account currencies" ON account_currencies FOR DELETE
USING (
  account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
);

-- ============================================
-- PASO 13: COMENTARIOS
-- ============================================

COMMENT ON TABLE account_currencies IS 'Divisas soportadas por cada cuenta (ej: Santander UYU, Santander USD, etc)';
COMMENT ON COLUMN pockets.subtype IS 'Subtipo de bolsa: period (período con inicio/fin), recurrent (mensual variable), fixed (mensual fijo), shared (compartida)';
COMMENT ON COLUMN pockets.account_id IS 'Cuenta de donde se asigna el dinero a la bolsa';
COMMENT ON COLUMN pockets.linked_account_id IS 'Cuenta de pago para fixed/recurrent expenses o deudas';
COMMENT ON COLUMN pockets.amount_saved IS 'Dinero ahorrado en la bolsa (solo saving)';
COMMENT ON COLUMN pockets.spent_amount IS 'Dinero gastado desde la bolsa (solo expense.period y expense.recurrent)';
COMMENT ON COLUMN pockets.average_amount IS 'Monto promedio histórico (solo expense.recurrent)';
COMMENT ON COLUMN pockets.last_payment_amount IS 'Último monto pagado (solo expense.recurrent)';
COMMENT ON COLUMN pockets.notification_days_before IS 'Días antes del vencimiento para notificar (solo expense.recurrent)';
COMMENT ON COLUMN pockets.days_duration IS 'Calculado automáticamente: días entre starts_at y ends_at';
COMMENT ON COLUMN pockets.daily_allowance IS 'Calculado automáticamente: allocated_amount / days_duration (solo expense.period)';
COMMENT ON COLUMN pockets.next_payment IS 'Calculado automáticamente: próxima fecha de pago según due_day';
COMMENT ON FUNCTION get_account_primary_currency IS 'Obtiene la divisa primaria de una cuenta desde account_currencies';
COMMENT ON FUNCTION calculate_pocket_period_fields IS 'Calcula automáticamente days_duration, daily_allowance, currency y next_payment';
COMMENT ON FUNCTION update_pocket_last_payment IS 'Actualiza last_payment, last_payment_amount y average_amount cuando se registra un movimiento';

-- ============================================
-- PASO 14: VERIFICACIÓN FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tablas creadas/actualizadas:';
  RAISE NOTICE '  ✓ account_currencies';
  RAISE NOTICE '  ✓ accounts (type)';
  RAISE NOTICE '  ✓ pockets (subtipos: period, recurrent, fixed, shared)';
  RAISE NOTICE '  ✓ movements';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas creadas:';
  RAISE NOTICE '  ✓ pocket_summary';
  RAISE NOTICE '  ✓ account_with_currencies';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✓ calculate_recommended_contribution()';
  RAISE NOTICE '  ✓ calculate_next_payment()';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers creados:';
  RAISE NOTICE '  ✓ trg_calculate_pocket_fields (auto-calcular days_duration, daily_allowance, currency, next_payment)';
  RAISE NOTICE '  ✓ trg_update_saving_pocket_balance';
  RAISE NOTICE '  ✓ trg_update_expense_pocket_spent';
  RAISE NOTICE '  ✓ trg_update_debt_pocket_remaining';
  RAISE NOTICE '  ✓ trg_update_pocket_last_payment (auto-actualizar last_payment y promedios)';
  RAISE NOTICE '============================================';
END $$;

SELECT 'Migración completada' AS status;
