-- ============================================
-- RECALCULAR BALANCES DE CUENTAS
-- ============================================
-- Este script corrige las inconsistencias detectadas
-- reconstruyendo todos los balances desde los movimientos.

-- ANTES DE EJECUTAR: Hacer backup de la tabla accounts
-- pg_dump -t accounts tu_database > backup_accounts.sql

-- ============================================
-- PASO 1: Ver estado actual (antes del fix)
-- ============================================

SELECT 
  '=== ESTADO ANTES DEL FIX ===' AS info,
  a.name,
  a.type,
  a.currency,
  a.balance AS balance_actual,
  COALESCE(SUM(
    CASE m.type
      WHEN 'income' THEN m.amount
      WHEN 'fixed_expense' THEN -m.amount
      WHEN 'saving_deposit' THEN -m.amount
      WHEN 'pocket_allocation' THEN -m.amount
      WHEN 'pocket_return' THEN m.amount
      WHEN 'pocket_expense' THEN 0
      ELSE 0
    END
  ), 0) AS balance_calculado,
  a.balance - COALESCE(SUM(
    CASE m.type
      WHEN 'income' THEN m.amount
      WHEN 'fixed_expense' THEN -m.amount
      WHEN 'saving_deposit' THEN -m.amount
      WHEN 'pocket_allocation' THEN -m.amount
      WHEN 'pocket_return' THEN m.amount
      WHEN 'pocket_expense' THEN 0
      ELSE 0
    END
  ), 0) AS diferencia
FROM accounts a
LEFT JOIN movements m ON m.account_id = a.id
GROUP BY a.id, a.name, a.type, a.currency, a.balance
ORDER BY a.name;

-- ============================================
-- PASO 2: Resetear todos los balances a 0
-- ============================================

UPDATE accounts SET balance = 0;

SELECT 'Todos los balances reseteados a 0' AS status;

-- ============================================
-- PASO 3: Recalcular desde movements
-- ============================================

WITH balance_changes AS (
  SELECT 
    account_id,
    SUM(
      CASE type
        WHEN 'income' THEN amount
        WHEN 'fixed_expense' THEN -amount
        WHEN 'saving_deposit' THEN -amount
        WHEN 'pocket_allocation' THEN -amount
        WHEN 'pocket_return' THEN amount
        WHEN 'pocket_expense' THEN 0
        ELSE 0
      END
    ) AS total_change
  FROM movements
  WHERE account_id IS NOT NULL
  GROUP BY account_id
)
UPDATE accounts a
SET balance = bc.total_change
FROM balance_changes bc
WHERE a.id = bc.account_id;

SELECT 'Balances recalculados desde movements' AS status;

-- ============================================
-- PASO 4: Ver estado después del fix
-- ============================================

SELECT 
  '=== ESTADO DESPUÉS DEL FIX ===' AS info,
  a.name,
  a.type,
  a.currency,
  a.balance AS balance_corregido,
  COALESCE(SUM(
    CASE m.type
      WHEN 'income' THEN m.amount
      WHEN 'fixed_expense' THEN -m.amount
      WHEN 'saving_deposit' THEN -m.amount
      WHEN 'pocket_allocation' THEN -m.amount
      WHEN 'pocket_return' THEN m.amount
      WHEN 'pocket_expense' THEN 0
      ELSE 0
    END
  ), 0) AS balance_calculado,
  a.balance - COALESCE(SUM(
    CASE m.type
      WHEN 'income' THEN m.amount
      WHEN 'fixed_expense' THEN -m.amount
      WHEN 'saving_deposit' THEN -m.amount
      WHEN 'pocket_allocation' THEN -m.amount
      WHEN 'pocket_return' THEN m.amount
      WHEN 'pocket_expense' THEN 0
      ELSE 0
    END
  ), 0) AS diferencia
FROM accounts a
LEFT JOIN movements m ON m.account_id = a.id
GROUP BY a.id, a.name, a.type, a.currency, a.balance
ORDER BY a.name;

-- ============================================
-- PASO 5: Verificar detalle de movimientos
-- ============================================

SELECT 
  '=== DETALLE DE MOVIMIENTOS POR CUENTA ===' AS info,
  a.name AS cuenta,
  m.type AS tipo_movimiento,
  m.amount AS monto,
  m.date AS fecha,
  m.description AS descripcion,
  CASE m.type
    WHEN 'income' THEN '+' || m.amount::TEXT
    WHEN 'fixed_expense' THEN '-' || m.amount::TEXT
    WHEN 'saving_deposit' THEN '-' || m.amount::TEXT
    WHEN 'pocket_allocation' THEN '-' || m.amount::TEXT
    WHEN 'pocket_return' THEN '+' || m.amount::TEXT
    WHEN 'pocket_expense' THEN '0 (no afecta cuenta)'
    ELSE '0'
  END AS efecto_en_balance
FROM accounts a
LEFT JOIN movements m ON m.account_id = a.id
ORDER BY a.name, m.date DESC;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

/*
Si todo está correcto, deberías ver:

1. ANTES DEL FIX:
   - Santander: balance_actual=20000, balance_calculado=15000, diferencia=5000

2. DESPUÉS DEL FIX:
   - Santander: balance_corregido=15000, balance_calculado=15000, diferencia=0
   
La diferencia debe ser 0 para todas las cuentas.
*/
