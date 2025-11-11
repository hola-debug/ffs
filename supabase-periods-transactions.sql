-- ============================================
-- Periods + Transactions scoped integration
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Categorías con scope
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'both'
  CHECK (scope IN ('period', 'outside_period', 'both'));

-- 2) Periodos
CREATE TABLE IF NOT EXISTS periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage > 0),
  days INT NOT NULL CHECK (days BETWEEN 1 AND 120),
  allocated_amount NUMERIC(12,2) NOT NULL CHECK (allocated_amount >= 0),
  spent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(12,2)
    GENERATED ALWAYS AS (GREATEST(allocated_amount - spent_amount, 0)) STORED,
  daily_amount NUMERIC(12,2)
    GENERATED ALWAYS AS (ROUND(CASE WHEN days > 0 THEN allocated_amount / days ELSE 0 END, 2)) STORED,
  currency TEXT NOT NULL DEFAULT 'UYU',
  starts_at DATE DEFAULT CURRENT_DATE,
  ends_at DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'finished', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_periods_user_id ON periods(user_id);
CREATE INDEX IF NOT EXISTS idx_periods_account_id ON periods(account_id);
CREATE INDEX IF NOT EXISTS idx_periods_status ON periods(status);

-- 3) Transacciones completas con scope + period_id
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  period_id UUID REFERENCES periods(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  scope TEXT NOT NULL DEFAULT 'outside_period' CHECK (scope IN ('period', 'outside_period')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'UYU',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  is_random BOOLEAN NOT NULL DEFAULT FALSE,
  is_fixed BOOLEAN NOT NULL DEFAULT FALSE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_scope_period_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_scope_period_check
CHECK (
  (scope = 'period' AND period_id IS NOT NULL)
  OR (scope = 'outside_period')
);

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_transactions_user_id    ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_period_id  ON transactions(period_id);
CREATE INDEX IF NOT EXISTS idx_transactions_scope      ON transactions(scope);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON transactions(date);

-- 4) Funciones / Triggers para mantener periodos
CREATE OR REPLACE FUNCTION public.set_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_periods_updated_at ON periods;
CREATE TRIGGER trg_periods_updated_at
BEFORE UPDATE ON periods
FOR EACH ROW EXECUTE FUNCTION public.set_periods_updated_at();

CREATE OR REPLACE FUNCTION public.period_amount_delta(p_scope TEXT, p_type TEXT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  IF p_scope IS DISTINCT FROM 'period' THEN
    RETURN 0;
  END IF;
  IF p_type = 'expense' THEN
    RETURN p_amount;
  ELSIF p_type = 'income' THEN
    RETURN -p_amount;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.apply_period_delta(p_period_id UUID, p_delta NUMERIC)
RETURNS VOID AS $$
BEGIN
  IF p_period_id IS NULL OR p_delta = 0 THEN
    RETURN;
  END IF;

  UPDATE periods
  SET spent_amount = GREATEST(0, spent_amount + p_delta),
      updated_at = NOW()
  WHERE id = p_period_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_transactions_period()
RETURNS TRIGGER AS $$
DECLARE
  delta NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    delta := public.period_amount_delta(NEW.scope, NEW.type, NEW.amount);
    PERFORM public.apply_period_delta(NEW.period_id, delta);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    delta := public.period_amount_delta(OLD.scope, OLD.type, OLD.amount);
    PERFORM public.apply_period_delta(OLD.period_id, -delta);

    delta := public.period_amount_delta(NEW.scope, NEW.type, NEW.amount);
    PERFORM public.apply_period_delta(NEW.period_id, delta);
    RETURN NEW;
  ELSE -- DELETE
    delta := public.period_amount_delta(OLD.scope, OLD.type, OLD.amount);
    PERFORM public.apply_period_delta(OLD.period_id, -delta);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_period ON transactions;
CREATE TRIGGER trg_transactions_period
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transactions_period();

-- Mantener updated_at en transactions
CREATE OR REPLACE FUNCTION public.set_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION public.set_transactions_updated_at();

-- 5) RLS para periodos
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS periods_select ON periods;
DROP POLICY IF EXISTS periods_insert ON periods;
DROP POLICY IF EXISTS periods_update ON periods;
DROP POLICY IF EXISTS periods_delete ON periods;

CREATE POLICY periods_select
ON periods
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY periods_insert
ON periods
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY periods_update
ON periods
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY periods_delete
ON periods
FOR DELETE
USING (auth.uid() = user_id);

-- 6) RLS para transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transactions_select ON transactions;
DROP POLICY IF EXISTS transactions_insert ON transactions;
DROP POLICY IF EXISTS transactions_update ON transactions;
DROP POLICY IF EXISTS transactions_delete ON transactions;

CREATE POLICY transactions_select
ON transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY transactions_insert
ON transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY transactions_update
ON transactions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY transactions_delete
ON transactions
FOR DELETE
USING (auth.uid() = user_id);
