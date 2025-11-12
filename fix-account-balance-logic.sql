-- ============================================
-- FIX: LÓGICA DE BALANCE DE CUENTAS
-- ============================================
-- Este script corrige el manejo automático del balance de las cuentas
-- cuando se registran movimientos de cualquier tipo.

-- ============================================
-- PASO 1: ELIMINAR TRIGGER Y FUNCIÓN ANTERIORES
-- ============================================

DROP TRIGGER IF EXISTS trg_movements_update_account_balance ON movements;
DROP FUNCTION IF EXISTS update_account_balance_on_income();

-- ============================================
-- PASO 2: NUEVA FUNCIÓN COMPLETA
-- ============================================

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_delta NUMERIC(12,2);
  v_old_delta NUMERIC(12,2);
BEGIN
  -- ============================================
  -- INSERT: Aplicar cambio al balance
  -- ============================================
  IF TG_OP = 'INSERT' THEN
    -- Solo procesar si hay account_id
    IF NEW.account_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Calcular delta según el tipo de movimiento
    CASE NEW.type
      -- INGRESOS: Suman al balance
      WHEN 'income' THEN
        v_delta := NEW.amount;
        
      -- GASTOS: Restan del balance
      WHEN 'fixed_expense' THEN
        v_delta := -NEW.amount;
        
      -- AHORRO: Resta del balance (se aparta dinero)
      WHEN 'saving_deposit' THEN
        v_delta := -NEW.amount;
        
      -- ASIGNACIÓN A BOLSA: Resta del balance (se aparta dinero)
      WHEN 'pocket_allocation' THEN
        v_delta := -NEW.amount;
        
      -- DEVOLUCIÓN DE BOLSA: Suma al balance (dinero regresa)
      WHEN 'pocket_return' THEN
        v_delta := NEW.amount;
        
      -- GASTO DESDE BOLSA: NO afecta balance de cuenta
      -- (ya se restó cuando se hizo pocket_allocation)
      WHEN 'pocket_expense' THEN
        v_delta := 0;
        
      ELSE
        v_delta := 0;
    END CASE;
    
    -- Aplicar cambio al balance de la cuenta
    IF v_delta <> 0 THEN
      UPDATE accounts
      SET balance = balance + v_delta
      WHERE id = NEW.account_id;
    END IF;
    
    RETURN NEW;
  
  -- ============================================
  -- DELETE: Revertir cambio al balance
  -- ============================================
  ELSIF TG_OP = 'DELETE' THEN
    -- Solo procesar si hay account_id
    IF OLD.account_id IS NULL THEN
      RETURN OLD;
    END IF;
    
    -- Calcular delta inverso (para revertir)
    CASE OLD.type
      WHEN 'income' THEN
        v_delta := -OLD.amount;  -- Restar lo que se había sumado
      WHEN 'fixed_expense' THEN
        v_delta := OLD.amount;   -- Sumar lo que se había restado
      WHEN 'saving_deposit' THEN
        v_delta := OLD.amount;
      WHEN 'pocket_allocation' THEN
        v_delta := OLD.amount;
      WHEN 'pocket_return' THEN
        v_delta := -OLD.amount;
      WHEN 'pocket_expense' THEN
        v_delta := 0;
      ELSE
        v_delta := 0;
    END CASE;
    
    -- Aplicar cambio al balance de la cuenta
    IF v_delta <> 0 THEN
      UPDATE accounts
      SET balance = balance + v_delta
      WHERE id = OLD.account_id;
    END IF;
    
    RETURN OLD;
  
  -- ============================================
  -- UPDATE: Revertir viejo y aplicar nuevo
  -- ============================================
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revertir el movimiento anterior (si tenía account_id)
    IF OLD.account_id IS NOT NULL THEN
      CASE OLD.type
        WHEN 'income' THEN
          v_old_delta := -OLD.amount;
        WHEN 'fixed_expense' THEN
          v_old_delta := OLD.amount;
        WHEN 'saving_deposit' THEN
          v_old_delta := OLD.amount;
        WHEN 'pocket_allocation' THEN
          v_old_delta := OLD.amount;
        WHEN 'pocket_return' THEN
          v_old_delta := -OLD.amount;
        WHEN 'pocket_expense' THEN
          v_old_delta := 0;
        ELSE
          v_old_delta := 0;
      END CASE;
      
      IF v_old_delta <> 0 THEN
        UPDATE accounts
        SET balance = balance + v_old_delta
        WHERE id = OLD.account_id;
      END IF;
    END IF;
    
    -- Aplicar el nuevo movimiento (si tiene account_id)
    IF NEW.account_id IS NOT NULL THEN
      CASE NEW.type
        WHEN 'income' THEN
          v_delta := NEW.amount;
        WHEN 'fixed_expense' THEN
          v_delta := -NEW.amount;
        WHEN 'saving_deposit' THEN
          v_delta := -NEW.amount;
        WHEN 'pocket_allocation' THEN
          v_delta := -NEW.amount;
        WHEN 'pocket_return' THEN
          v_delta := NEW.amount;
        WHEN 'pocket_expense' THEN
          v_delta := 0;
        ELSE
          v_delta := 0;
      END CASE;
      
      IF v_delta <> 0 THEN
        UPDATE accounts
        SET balance = balance + v_delta
        WHERE id = NEW.account_id;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 3: CREAR NUEVO TRIGGER
-- ============================================

CREATE TRIGGER trg_movements_update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON movements
FOR EACH ROW EXECUTE FUNCTION update_account_balance();

COMMENT ON FUNCTION update_account_balance IS 
  'Actualiza automáticamente el balance de la cuenta según el tipo de movimiento:
   - income: suma al balance
   - fixed_expense, saving_deposit, pocket_allocation: restan del balance
   - pocket_return: suma al balance
   - pocket_expense: no afecta (ya se restó en pocket_allocation)';

-- ============================================
-- PASO 4: RECALCULAR BALANCES DESDE CERO (OPCIONAL)
-- ============================================
-- ADVERTENCIA: Esto reconstruye todos los balances desde los movimientos.
-- Solo ejecutar si hay inconsistencias. Comentar si no se necesita.

/*
-- Primero, resetear todos los balances a 0
UPDATE accounts SET balance = 0;

-- Luego, recalcular desde movements
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

SELECT 'Balances recalculados exitosamente' AS status;
*/

-- ============================================
-- PASO 5: VERIFICACIÓN
-- ============================================

-- Ver resumen de cuentas con sus balances
SELECT 
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
ORDER BY ABS(a.balance - COALESCE(SUM(
    CASE m.type
      WHEN 'income' THEN m.amount
      WHEN 'fixed_expense' THEN -m.amount
      WHEN 'saving_deposit' THEN -m.amount
      WHEN 'pocket_allocation' THEN -m.amount
      WHEN 'pocket_return' THEN m.amount
      WHEN 'pocket_expense' THEN 0
      ELSE 0
    END
  ), 0)) DESC;

-- ============================================
-- NOTAS DE USO
-- ============================================

/*
IMPORTANTE: NO INSERTES INGRESOS DOS VECES

❌ MAL (duplicación):
1. INSERT INTO movements (type='income', amount=1000, account_id=X)
2. UPDATE accounts SET balance = balance + 1000 WHERE id = X

✅ BIEN (automático):
1. INSERT INTO movements (type='income', amount=1000, account_id=X)
   -> El trigger actualiza el balance automáticamente

FLUJO CORRECTO:
================

1. INGRESO:
   - INSERT INTO movements (type='income', amount=50000, account_id=X)
   - ✅ Balance de cuenta X aumenta automáticamente en 50000

2. GASTO FIJO:
   - INSERT INTO movements (type='fixed_expense', amount=10000, account_id=X)
   - ✅ Balance de cuenta X disminuye automáticamente en 10000

3. ASIGNAR A BOLSA:
   - INSERT INTO movements (type='pocket_allocation', amount=5000, account_id=X, pocket_id=Y)
   - ✅ Balance de cuenta X disminuye en 5000
   - ✅ Balance de bolsa Y aumenta en 5000 (trigger separado)

4. GASTO DESDE BOLSA:
   - INSERT INTO movements (type='pocket_expense', amount=200, pocket_id=Y)
   - ✅ Balance de bolsa Y disminuye en 200
   - ✅ Balance de cuenta NO cambia (ya se descontó en paso 3)

5. DEVOLVER DE BOLSA:
   - INSERT INTO movements (type='pocket_return', amount=1000, account_id=X, pocket_id=Y)
   - ✅ Balance de bolsa Y disminuye en 1000
   - ✅ Balance de cuenta X aumenta en 1000
*/
