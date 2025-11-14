-- ============================================
-- MIGRACIÓN: MOVER BALANCE A ACCOUNT_CURRENCIES
-- ============================================
-- Problema: El balance en accounts se mezcla sin saber qué divisa es
-- Solución: Cada divisa tiene su propio balance

-- PASO 1: Agregar balance a account_currencies
ALTER TABLE account_currencies 
ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0;

-- PASO 2: Migrar saldos existentes (si hay datos)
-- Si una cuenta tiene balance > 0, asignarlo a la divisa primaria
UPDATE account_currencies ac
SET balance = a.balance
FROM accounts a
WHERE ac.account_id = a.id
  AND ac.is_primary = TRUE
  AND a.balance > 0;

-- PASO 3: Limpiar balance de accounts (ya no se usa)
-- No lo eliminamos para backward compatibility, pero lo dejamos en 0
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS balance_deprecated NUMERIC(12,2);

-- Guardar valor antiguo antes de limpiar
UPDATE accounts 
SET balance_deprecated = balance
WHERE balance > 0;

-- Limpiar balance en accounts
UPDATE accounts SET balance = 0;

-- PASO 4: Actualizar vista account_with_currencies para incluir balances
-- NOTA: Esta vista será recreada, por ahora la dejamos para referencia
-- La mejor práctica es usar account_currencies directamente desde el cliente
DROP VIEW IF EXISTS account_with_currencies CASCADE;

-- PASO 5: Crear función para obtener balance de una cuenta por divisa
CREATE OR REPLACE FUNCTION get_account_balance_by_currency(
  p_account_id UUID,
  p_currency TEXT DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC(12,2);
BEGIN
  IF p_currency IS NULL THEN
    -- Si no especifica divisa, traer la primaria
    SELECT balance INTO v_balance
    FROM account_currencies
    WHERE account_id = p_account_id
      AND is_primary = TRUE
    LIMIT 1;
  ELSE
    -- Si especifica divisa, traer esa
    SELECT balance INTO v_balance
    FROM account_currencies
    WHERE account_id = p_account_id
      AND currency = p_currency
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- PASO 6: Crear función para actualizar balance de cuenta por divisa
CREATE OR REPLACE FUNCTION update_account_balance(
  p_account_id UUID,
  p_currency TEXT,
  p_amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE account_currencies
  SET balance = GREATEST(0, balance + p_amount)
  WHERE account_id = p_account_id
    AND currency = p_currency;
END;
$$ LANGUAGE plpgsql;

-- PASO 7: Comentarios
COMMENT ON COLUMN account_currencies.balance IS 'Saldo en esa divisa específica para la cuenta';
COMMENT ON FUNCTION get_account_balance_by_currency IS 'Obtiene el balance de una cuenta para una divisa específica (o la primaria si no se especifica)';
COMMENT ON FUNCTION update_account_balance IS 'Actualiza el balance de una cuenta para una divisa específica';

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRACIÓN 004: BALANCE POR DIVISA COMPLETADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '  ✓ Agregado: account_currencies.balance';
  RAISE NOTICE '  ✓ Actualizada: vista account_with_currencies';
  RAISE NOTICE '  ✓ Nueva función: get_account_balance_by_currency()';
  RAISE NOTICE '  ✓ Nueva función: update_account_balance()';
  RAISE NOTICE '';
  RAISE NOTICE 'Cada divisa ahora tiene su propio saldo independiente';
  RAISE NOTICE '============================================';
END $$;

SELECT 'Migración 004 completada' AS status;
