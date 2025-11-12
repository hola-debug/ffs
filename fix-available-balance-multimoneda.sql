-- ============================================
-- FIX: DISPONIBLE CALCULADO DESDE ACCOUNTS
-- ============================================

-- 1. Eliminar la vista anterior
DROP VIEW IF EXISTS user_monthly_summary;

-- 2. Recrear con lógica correcta
CREATE OR REPLACE VIEW user_monthly_summary AS
SELECT
  pr.id AS user_id,
  pr.currency AS default_currency,
  
  -- Total en cuentas (saldo real actual)
  COALESCE(SUM(a.balance), 0) AS total_accounts_balance,
  
  -- Ingresos del mes (para estadísticas)
  COALESCE(SUM(m.amount) FILTER (WHERE m.type = 'income' 
    AND EXTRACT(MONTH FROM m.date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM m.date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) AS income_month,
  
  -- Gastos fijos del mes
  COALESCE(SUM(m.amount) FILTER (WHERE m.type = 'fixed_expense' 
    AND EXTRACT(MONTH FROM m.date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM m.date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) AS fixed_expenses_month,
  
  -- Ahorro del mes
  COALESCE(SUM(m.amount) FILTER (WHERE m.type = 'saving_deposit'
    AND EXTRACT(MONTH FROM m.date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM m.date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) AS saving_deposits_month,
  
  -- Total asignado a bolsas del mes
  COALESCE(SUM(m.amount) FILTER (WHERE m.type = 'pocket_allocation'
    AND EXTRACT(MONTH FROM m.date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM m.date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) AS pockets_allocated_month,
  
  -- Total en bolsas activas (dinero separado)
  COALESCE(SUM(p.current_balance) FILTER (WHERE p.status = 'active'), 0) AS pockets_current_balance,
  
  -- DISPONIBLE = Saldo en cuentas - dinero en bolsas activas
  COALESCE(SUM(a.balance), 0) - COALESCE(SUM(p.current_balance) FILTER (WHERE p.status = 'active'), 0) AS available_balance

FROM profiles pr
LEFT JOIN accounts a ON a.user_id = pr.id
LEFT JOIN movements m ON m.user_id = pr.id
LEFT JOIN pockets p ON p.user_id = pr.id
GROUP BY pr.id, pr.currency;

COMMENT ON VIEW user_monthly_summary IS 'Resumen financiero: disponible calculado desde balance de cuentas menos bolsas activas';

-- ============================================
-- SOPORTE MULTI-MONEDA
-- ============================================

-- 3. Vista de balance por moneda
CREATE OR REPLACE VIEW user_balance_by_currency AS
SELECT
  pr.id AS user_id,
  a.currency,
  
  -- Total en cuentas por moneda
  COALESCE(SUM(a.balance), 0) AS total_accounts,
  
  -- Total en bolsas activas por moneda
  COALESCE(SUM(p.current_balance) FILTER (WHERE p.status = 'active'), 0) AS total_in_pockets,
  
  -- Disponible por moneda
  COALESCE(SUM(a.balance), 0) - COALESCE(SUM(p.current_balance) FILTER (WHERE p.status = 'active'), 0) AS available

FROM profiles pr
LEFT JOIN accounts a ON a.user_id = pr.id
LEFT JOIN pockets p ON p.user_id = pr.id AND p.currency = a.currency
GROUP BY pr.id, a.currency;

COMMENT ON VIEW user_balance_by_currency IS 'Balance separado por moneda para soporte multi-moneda';

-- ============================================
-- TABLA DE TASAS DE CAMBIO (OPCIONAL)
-- ============================================

-- 4. Crear tabla para tasas de cambio
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(18,8) NOT NULL CHECK (rate > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT, -- 'manual', 'api', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(from_currency, to_currency, date)
);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency, date DESC);

-- Trigger para updated_at
CREATE TRIGGER trg_exchange_rates_updated_at
BEFORE UPDATE ON exchange_rates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE exchange_rates IS 'Tasas de cambio para conversión entre monedas';

-- ============================================
-- FUNCIÓN: CONVERTIR MONTO ENTRE MONEDAS
-- ============================================

-- 5. Función para convertir montos
CREATE OR REPLACE FUNCTION convert_currency(
  p_amount NUMERIC,
  p_from_currency TEXT,
  p_to_currency TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  -- Si es la misma moneda, devolver el mismo monto
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;
  
  -- Buscar tasa de cambio más reciente
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency
    AND date <= p_date
  ORDER BY date DESC
  LIMIT 1;
  
  -- Si no hay tasa, retornar NULL (o lanzar error según prefieras)
  IF v_rate IS NULL THEN
    RAISE NOTICE 'No exchange rate found for % to % on %', p_from_currency, p_to_currency, p_date;
    RETURN NULL;
  END IF;
  
  RETURN ROUND((p_amount * v_rate)::numeric, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION convert_currency IS 'Convierte un monto de una moneda a otra usando tasas de cambio';

-- ============================================
-- VISTA: BALANCE UNIFICADO EN MONEDA BASE
-- ============================================

-- 6. Vista de balance total convertido a moneda base del usuario
CREATE OR REPLACE VIEW user_unified_balance AS
WITH currency_balances AS (
  SELECT
    pr.id AS user_id,
    a.currency,
    SUM(a.balance) AS total_balance,
    COALESCE(SUM(p.current_balance) FILTER (WHERE p.status = 'active'), 0) AS total_in_pockets
  FROM profiles pr
  LEFT JOIN accounts a ON a.user_id = pr.id
  LEFT JOIN pockets p ON p.user_id = pr.id AND p.currency = a.currency
  WHERE a.currency IS NOT NULL
  GROUP BY pr.id, a.currency
)
SELECT
  pr.id AS user_id,
  pr.currency AS base_currency,
  
  -- Balance total en moneda base
  COALESCE(
    (SELECT total_balance FROM currency_balances cb 
     WHERE cb.user_id = pr.id AND cb.currency = pr.currency), 0
  ) AS balance_in_base_currency,
  
  -- Balance en todas las monedas
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'currency', cb.currency,
        'balance', cb.total_balance,
        'in_pockets', cb.total_in_pockets,
        'available', cb.total_balance - cb.total_in_pockets
      )
    )
    FROM currency_balances cb
    WHERE cb.user_id = pr.id),
    '[]'::json
  ) AS balances_by_currency
  
FROM profiles pr;

COMMENT ON VIEW user_unified_balance IS 'Balance unificado del usuario mostrando todas las monedas';

-- ============================================
-- MODIFICACIÓN: ACTUALIZAR BALANCE DE ACCOUNTS
-- ============================================

-- 7. Función para actualizar balance de cuenta cuando hay movimientos de ingreso
CREATE OR REPLACE FUNCTION update_account_balance_on_income()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo para movimientos de tipo 'income'
  IF NEW.type = 'income' AND NEW.account_id IS NOT NULL THEN
    UPDATE accounts
    SET balance = balance + NEW.amount
    WHERE id = NEW.account_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_movements_update_account_balance
AFTER INSERT ON movements
FOR EACH ROW EXECUTE FUNCTION update_account_balance_on_income();

COMMENT ON FUNCTION update_account_balance_on_income IS 'Actualiza el balance de la cuenta cuando se registra un ingreso';

-- ============================================
-- VISTA: RESUMEN DE INGRESOS POR CUENTA
-- ============================================

-- 8. Vista para ver ingresos por cuenta
CREATE OR REPLACE VIEW income_by_account AS
SELECT
  a.id AS account_id,
  a.user_id,
  a.name AS account_name,
  a.currency,
  a.balance AS current_balance,
  
  -- Ingresos del mes actual
  COALESCE(SUM(m.amount) FILTER (
    WHERE m.type = 'income'
    AND EXTRACT(MONTH FROM m.date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM m.date) = EXTRACT(YEAR FROM CURRENT_DATE)
  ), 0) AS income_this_month,
  
  -- Total de ingresos históricos
  COALESCE(SUM(m.amount) FILTER (WHERE m.type = 'income'), 0) AS total_income_all_time

FROM accounts a
LEFT JOIN movements m ON m.account_id = a.id
GROUP BY a.id, a.user_id, a.name, a.currency, a.balance;

COMMENT ON VIEW income_by_account IS 'Resumen de ingresos por cuenta';

-- ============================================
-- DATOS DE EJEMPLO PARA TASAS DE CAMBIO
-- ============================================

-- Insertar tasas comunes (ejemplo)
INSERT INTO exchange_rates (from_currency, to_currency, rate, source) VALUES
  ('USD', 'UYU', 41.50, 'manual'),
  ('UYU', 'USD', 0.024, 'manual'),
  ('EUR', 'UYU', 45.20, 'manual'),
  ('UYU', 'EUR', 0.022, 'manual'),
  ('USD', 'EUR', 0.92, 'manual'),
  ('EUR', 'USD', 1.09, 'manual')
ON CONFLICT (from_currency, to_currency, date) DO UPDATE
SET rate = EXCLUDED.rate, updated_at = NOW();

-- ============================================
-- POLÍTICAS RLS PARA EXCHANGE_RATES
-- ============================================

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer las tasas de cambio
CREATE POLICY "Anyone can view exchange rates" ON exchange_rates FOR SELECT USING (true);

-- Solo admins pueden modificar (ajustar según tu lógica)
-- CREATE POLICY "Only admins can modify rates" ON exchange_rates FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE exchange_rates IS 'Las tasas son públicas para lectura, modificables solo por admins';
