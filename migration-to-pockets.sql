-- ============================================
-- MIGRACIÓN: PERIODS → POCKETS
-- ============================================
-- Este script migra de la estructura antigua a la nueva
-- IMPORTANTE: Hacer backup antes de ejecutar

-- ============================================
-- PASO 1: ELIMINAR TABLAS ANTIGUAS
-- ============================================

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS periods CASCADE;
DROP TABLE IF EXISTS savings_vaults CASCADE;
DROP TABLE IF EXISTS savings_moves CASCADE;

-- Eliminar vistas antiguas si existen
DROP VIEW IF EXISTS active_pockets_summary CASCADE;
DROP VIEW IF EXISTS user_monthly_summary CASCADE;

-- ============================================
-- PASO 2: ACTUALIZAR TABLA PROFILES
-- ============================================

-- Agregar campos nuevos a profiles si no existen
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'UYU';

-- ============================================
-- PASO 3: ACTUALIZAR TABLA CATEGORIES
-- ============================================

-- Actualizar el tipo de categorías
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_kind_check;

-- Eliminar columna kind si existe y renombrar a type
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='kind') THEN
    ALTER TABLE categories DROP COLUMN kind;
  END IF;
END $$;

-- Asegurarse de que existe la columna type
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'pocket_expense';

-- Agregar constraint actualizado
ALTER TABLE categories 
  ADD CONSTRAINT categories_type_check 
  CHECK (type IN ('income', 'fixed_expense', 'saving', 'pocket_expense'));

-- Eliminar columna scope si existe (ya no la necesitamos)
ALTER TABLE categories DROP COLUMN IF EXISTS scope CASCADE;

-- Agregar columnas de icon y color si no existen
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT;

-- ============================================
-- PASO 4: CREAR TABLA POCKETS
-- ============================================

CREATE TABLE pockets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'saving')),
  emoji TEXT,
  
  -- Montos
  allocated_amount NUMERIC(12,2) NOT NULL CHECK (allocated_amount >= 0),
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  currency TEXT NOT NULL DEFAULT 'UYU',
  
  -- Configuración temporal
  starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_at DATE NOT NULL,
  days_duration INT GENERATED ALWAYS AS (ends_at - starts_at + 1) STORED,
  
  -- Específico para BOLSAS DE GASTO
  daily_allowance NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE 
      WHEN type = 'expense' AND (ends_at - starts_at + 1) > 0 
      THEN allocated_amount / (ends_at - starts_at + 1)
      ELSE NULL
    END
  ) STORED,
  
  -- Específico para BOLSAS DE AHORRO
  target_amount NUMERIC(12,2) CHECK (
    (type = 'saving' AND target_amount IS NOT NULL) OR 
    (type = 'expense' AND target_amount IS NULL)
  ),
  
  -- Control
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished', 'cancelled')),
  auto_return_remaining BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Una bolsa no puede terminar antes de empezar
  CHECK (ends_at >= starts_at)
);

CREATE INDEX idx_pockets_user_id ON pockets(user_id);
CREATE INDEX idx_pockets_status ON pockets(status);
CREATE INDEX idx_pockets_type ON pockets(type);
CREATE INDEX idx_pockets_dates ON pockets(starts_at, ends_at);

-- ============================================
-- PASO 5: CREAR TABLA MOVEMENTS
-- ============================================

CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Tipo de movimiento
  type TEXT NOT NULL CHECK (type IN (
    'income',           -- Ingreso mensual
    'fixed_expense',    -- Gasto fijo (nivel ingreso)
    'saving_deposit',   -- Depósito a ahorro (nivel ingreso)
    'pocket_allocation', -- Asignación a bolsa
    'pocket_expense',   -- Gasto desde bolsa
    'pocket_return'     -- Devolución de bolsa al ingreso
  )),
  
  -- Relaciones
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  pocket_id UUID REFERENCES pockets(id) ON DELETE CASCADE,
  
  -- Montos
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'UYU',
  
  -- Información
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validaciones de negocio
  CHECK (
    -- pocket_expense y pocket_return requieren pocket_id
    (type IN ('pocket_expense', 'pocket_return', 'pocket_allocation') AND pocket_id IS NOT NULL) OR
    (type NOT IN ('pocket_expense', 'pocket_return', 'pocket_allocation') AND pocket_id IS NULL)
  )
);

CREATE INDEX idx_movements_user_id ON movements(user_id);
CREATE INDEX idx_movements_date ON movements(date);
CREATE INDEX idx_movements_type ON movements(type);
CREATE INDEX idx_movements_pocket_id ON movements(pocket_id);
CREATE INDEX idx_movements_user_date ON movements(user_id, date);
CREATE INDEX idx_movements_account_id ON movements(account_id);

-- ============================================
-- PASO 6: TRIGGERS Y FUNCIONES
-- ============================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pockets_updated_at
BEFORE UPDATE ON pockets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_movements_updated_at
BEFORE UPDATE ON movements
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Función para actualizar balance de bolsa cuando hay movimientos
CREATE OR REPLACE FUNCTION update_pocket_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_delta NUMERIC(12,2);
BEGIN
  -- Calcular delta según el tipo de operación
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'pocket_allocation' THEN
      v_delta := NEW.amount;  -- Añadir dinero a la bolsa
    ELSIF NEW.type IN ('pocket_expense', 'pocket_return') THEN
      v_delta := -NEW.amount;  -- Restar dinero de la bolsa
    ELSE
      RETURN NEW;  -- Otros tipos no afectan bolsas
    END IF;
    
    UPDATE pockets
    SET current_balance = GREATEST(0, current_balance + v_delta)
    WHERE id = NEW.pocket_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'pocket_allocation' THEN
      v_delta := -OLD.amount;
    ELSIF OLD.type IN ('pocket_expense', 'pocket_return') THEN
      v_delta := OLD.amount;
    ELSE
      RETURN OLD;
    END IF;
    
    UPDATE pockets
    SET current_balance = GREATEST(0, current_balance + v_delta)
    WHERE id = OLD.pocket_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revertir movimiento viejo
    IF OLD.pocket_id IS NOT NULL THEN
      IF OLD.type = 'pocket_allocation' THEN
        v_delta := -OLD.amount;
      ELSIF OLD.type IN ('pocket_expense', 'pocket_return') THEN
        v_delta := OLD.amount;
      END IF;
      
      UPDATE pockets
      SET current_balance = GREATEST(0, current_balance + v_delta)
      WHERE id = OLD.pocket_id;
    END IF;
    
    -- Aplicar movimiento nuevo
    IF NEW.pocket_id IS NOT NULL THEN
      IF NEW.type = 'pocket_allocation' THEN
        v_delta := NEW.amount;
      ELSIF NEW.type IN ('pocket_expense', 'pocket_return') THEN
        v_delta := -NEW.amount;
      END IF;
      
      UPDATE pockets
      SET current_balance = GREATEST(0, current_balance + v_delta)
      WHERE id = NEW.pocket_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_movements_update_pocket_balance
AFTER INSERT OR UPDATE OR DELETE ON movements
FOR EACH ROW EXECUTE FUNCTION update_pocket_balance();

-- Función para cerrar bolsas automáticamente
CREATE OR REPLACE FUNCTION auto_finish_pockets()
RETURNS void AS $$
BEGIN
  -- Marcar bolsas como finalizadas si pasó su fecha de fin
  UPDATE pockets
  SET status = 'finished'
  WHERE status = 'active'
    AND ends_at < CURRENT_DATE;
  
  -- Si auto_return_remaining está activo, devolver el saldo restante
  INSERT INTO movements (user_id, type, pocket_id, amount, currency, date, description)
  SELECT 
    p.user_id,
    'pocket_return',
    p.id,
    p.current_balance,
    p.currency,
    CURRENT_DATE,
    'Devolución automática de bolsa: ' || p.name
  FROM pockets p
  WHERE p.status = 'finished'
    AND p.current_balance > 0
    AND p.auto_return_remaining = true
    AND NOT EXISTS (
      SELECT 1 FROM movements m
      WHERE m.pocket_id = p.id
        AND m.type = 'pocket_return'
        AND m.date >= p.ends_at
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 7: VISTAS
-- ============================================

-- Vista de bolsas activas con información calculada
CREATE OR REPLACE VIEW active_pockets_summary AS
SELECT 
  p.*,
  CURRENT_DATE - p.starts_at AS days_elapsed,
  p.ends_at - CURRENT_DATE AS days_remaining,
  CASE 
    WHEN p.type = 'saving' AND p.target_amount > 0 THEN
      ROUND((p.current_balance / p.target_amount * 100)::numeric, 2)
    ELSE NULL
  END AS progress_percentage,
  CASE
    WHEN p.type = 'expense' AND (p.ends_at - CURRENT_DATE) > 0 THEN
      ROUND((p.current_balance / (p.ends_at - CURRENT_DATE + 1))::numeric, 2)
    ELSE NULL
  END AS remaining_daily_allowance
FROM pockets p
WHERE p.status = 'active';

CREATE OR REPLACE VIEW user_monthly_summary AS
WITH current_period AS (
  SELECT 
    date_trunc('month', CURRENT_DATE)::date AS start_date,
    (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date AS end_date
),
previous_period AS (
  SELECT 
    (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date AS start_date,
    date_trunc('month', CURRENT_DATE)::date AS end_date
),
monthly_movements AS (
  SELECT
    m.user_id,
    SUM(m.amount) FILTER (WHERE m.type = 'income')::numeric AS income_month,
    SUM(m.amount) FILTER (WHERE m.type = 'fixed_expense')::numeric AS fixed_expenses_month,
    SUM(m.amount) FILTER (WHERE m.type = 'saving_deposit')::numeric AS saving_deposits_month,
    SUM(m.amount) FILTER (WHERE m.type = 'pocket_allocation')::numeric AS pockets_allocated_month
  FROM movements m
  CROSS JOIN current_period cp
  WHERE m.date >= cp.start_date
    AND m.date < cp.end_date
  GROUP BY m.user_id
),
previous_month_flows AS (
  SELECT
    m.user_id,
    SUM(m.amount) FILTER (WHERE m.type = 'income')::numeric AS income_prev_month,
    SUM(m.amount) FILTER (WHERE m.type = 'fixed_expense')::numeric AS fixed_expenses_prev_month,
    SUM(m.amount) FILTER (WHERE m.type = 'saving_deposit')::numeric AS saving_prev_month,
    SUM(m.amount) FILTER (WHERE m.type = 'pocket_allocation')::numeric AS allocations_prev_month,
    SUM(m.amount) FILTER (WHERE m.type = 'pocket_return')::numeric AS pocket_returns_prev_month
  FROM movements m
  CROSS JOIN previous_period pp
  WHERE m.date >= pp.start_date
    AND m.date < pp.end_date
  GROUP BY m.user_id
),
all_time_movements AS (
  SELECT
    m.user_id,
    SUM(m.amount) FILTER (WHERE m.type = 'income')::numeric AS total_income_all_time,
    SUM(m.amount) FILTER (WHERE m.type = 'fixed_expense')::numeric AS total_fixed_expenses_all_time,
    SUM(m.amount) FILTER (WHERE m.type = 'pocket_allocation')::numeric AS total_pockets_allocated_all_time,
    SUM(m.amount) FILTER (WHERE m.type = 'pocket_expense')::numeric AS total_pocket_expenses_all_time
  FROM movements m
  GROUP BY m.user_id
),
pocket_balances AS (
  SELECT
    p.user_id,
    SUM(p.current_balance) FILTER (WHERE p.type = 'expense' AND p.status = 'active')::numeric AS expense_pockets_balance,
    SUM(p.current_balance) FILTER (WHERE p.type = 'saving' AND p.status = 'active')::numeric AS saving_pockets_balance,
    SUM(p.current_balance) FILTER (WHERE p.status = 'active')::numeric AS pockets_current_balance
  FROM pockets p
  WHERE p.status = 'active'
  GROUP BY p.user_id
),
account_balances AS (
  SELECT
    a.user_id,
    SUM(a.balance)::numeric AS total_in_accounts
  FROM accounts a
  GROUP BY a.user_id
)
SELECT
  pr.id AS user_id,
  pr.currency AS default_currency,
  COALESCE(ab.total_in_accounts, 0::numeric) AS total_in_accounts,
  COALESCE(mm.income_month, pr.monthly_income, 0::numeric) AS income_month,
  COALESCE(
    COALESCE(pm.income_prev_month, 0::numeric)
    - COALESCE(pm.fixed_expenses_prev_month, 0::numeric)
    - COALESCE(pm.saving_prev_month, 0::numeric)
    - COALESCE(pm.allocations_prev_month, 0::numeric)
    + COALESCE(pm.pocket_returns_prev_month, 0::numeric),
    0::numeric
  ) AS surplus_from_previous_month,
  COALESCE(mm.fixed_expenses_month, 0::numeric) AS fixed_expenses_month,
  COALESCE(mm.saving_deposits_month, 0::numeric) AS saving_deposits_month,
  COALESCE(mm.pockets_allocated_month, 0::numeric) AS pockets_allocated_month,
  COALESCE(pb.expense_pockets_balance, 0::numeric) AS expense_pockets_balance,
  COALESCE(pb.saving_pockets_balance, 0::numeric) AS saving_pockets_balance,
  COALESCE(pb.pockets_current_balance, 0::numeric) AS pockets_current_balance,
  (COALESCE(ab.total_in_accounts, 0::numeric) - COALESCE(pb.expense_pockets_balance, 0::numeric)) AS available_balance,
  COALESCE(am.total_income_all_time, 0::numeric) AS total_income_all_time,
  COALESCE(am.total_fixed_expenses_all_time, 0::numeric) AS total_fixed_expenses_all_time,
  COALESCE(am.total_pockets_allocated_all_time, 0::numeric) AS total_pockets_allocated_all_time,
  COALESCE(am.total_pocket_expenses_all_time, 0::numeric) AS total_pocket_expenses_all_time
FROM profiles pr
LEFT JOIN account_balances ab ON ab.user_id = pr.id
LEFT JOIN monthly_movements mm ON mm.user_id = pr.id
LEFT JOIN pocket_balances pb ON pb.user_id = pr.id
LEFT JOIN all_time_movements am ON am.user_id = pr.id
LEFT JOIN previous_month_flows pm ON pm.user_id = pr.id;

-- ============================================
-- PASO 8: RLS POLICIES
-- ============================================

ALTER TABLE pockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Policies para pockets
CREATE POLICY "Users can view own pockets" ON pockets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pockets" ON pockets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pockets" ON pockets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pockets" ON pockets FOR DELETE USING (auth.uid() = user_id);

-- Policies para movements
CREATE POLICY "Users can view own movements" ON movements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own movements" ON movements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own movements" ON movements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own movements" ON movements FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PASO 9: FUNCIÓN DE INICIALIZACIÓN
-- ============================================

CREATE OR REPLACE FUNCTION initialize_default_categories(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO categories (user_id, name, type, icon, color) VALUES
    -- Ingresos
    (p_user_id, 'Salario', 'income', '💰', '#10b981'),
    (p_user_id, 'Freelance', 'income', '💼', '#10b981'),
    
    -- Gastos fijos
    (p_user_id, 'Alquiler', 'fixed_expense', '🏠', '#ef4444'),
    (p_user_id, 'Servicios', 'fixed_expense', '⚡', '#ef4444'),
    (p_user_id, 'Internet', 'fixed_expense', '📡', '#ef4444'),
    
    -- Ahorro
    (p_user_id, 'Ahorro General', 'saving', '🐷', '#3b82f6'),
    (p_user_id, 'Emergencias', 'saving', '🚨', '#3b82f6'),
    
    -- Gastos de bolsas
    (p_user_id, 'Comida', 'pocket_expense', '🍔', '#f59e0b'),
    (p_user_id, 'Transporte', 'pocket_expense', '🚗', '#f59e0b'),
    (p_user_id, 'Entretenimiento', 'pocket_expense', '🎬', '#f59e0b'),
    (p_user_id, 'Otros', 'pocket_expense', '📦', '#f59e0b')
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE pockets IS 'Bolsas de dinero separadas del ingreso para gastos o ahorro';
COMMENT ON TABLE movements IS 'Movimientos de dinero: ingresos, gastos fijos, bolsas, etc.';
COMMENT ON COLUMN pockets.type IS 'expense: bolsa para gastar en X días | saving: bolsa con objetivo de ahorro';
COMMENT ON COLUMN pockets.auto_return_remaining IS 'Si true, devuelve el saldo restante al finalizar';
COMMENT ON COLUMN movements.type IS 'income, fixed_expense, saving_deposit, pocket_allocation, pocket_expense, pocket_return';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================

-- Verificar que todo se creó correctamente
SELECT 'Migración completada. Tablas creadas:' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('pockets', 'movements')
ORDER BY table_name;
