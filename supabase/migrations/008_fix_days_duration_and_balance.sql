-- ============================================
-- MIGRACIÓN 008: CALCULAR FECHAS Y ACTUALIZAR BALANCE
-- ============================================
-- Problema 1: Si solo envías days_duration, no se calculan starts_at y ends_at
-- Problema 2: Cuando creas una bolsa, no se descuenta el saldo de account_currencies
-- Solución: Actualizar triggers para manejar ambos casos

-- ============================================
-- PASO 1: Actualizar función de cálculo de campos
-- ============================================

CREATE OR REPLACE FUNCTION calculate_pocket_period_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- CASO 1: Si tenemos starts_at y ends_at, calcular days_duration
  IF NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL THEN
    NEW.days_duration := (NEW.ends_at - NEW.starts_at)::INT + 1;
  
  -- CASO 2: Si solo tenemos days_duration (sin fechas), calcularlas
  ELSIF NEW.days_duration IS NOT NULL AND NEW.days_duration > 0 
        AND NEW.starts_at IS NULL AND NEW.ends_at IS NULL THEN
    -- Iniciar hoy
    NEW.starts_at := CURRENT_DATE;
    -- Calcular fecha de fin: starts_at + days_duration - 1
    NEW.ends_at := CURRENT_DATE + (NEW.days_duration - 1)::INT;
  
  -- CASO 3: Si tenemos days_duration y starts_at (pero no ends_at), calcular ends_at
  ELSIF NEW.days_duration IS NOT NULL AND NEW.days_duration > 0 
        AND NEW.starts_at IS NOT NULL AND NEW.ends_at IS NULL THEN
    NEW.ends_at := NEW.starts_at + (NEW.days_duration - 1)::INT;
  
  -- CASO 4: Si tenemos days_duration y ends_at (pero no starts_at), calcular starts_at
  ELSIF NEW.days_duration IS NOT NULL AND NEW.days_duration > 0 
        AND NEW.ends_at IS NOT NULL AND NEW.starts_at IS NULL THEN
    NEW.starts_at := NEW.ends_at - (NEW.days_duration - 1)::INT;
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

-- ============================================
-- PASO 2: Trigger para actualizar balance al crear/modificar pocket
-- ============================================

CREATE OR REPLACE FUNCTION update_account_balance_on_pocket_change()
RETURNS TRIGGER AS $$
DECLARE
  v_amount_to_deduct NUMERIC(12,2) := 0;
  v_amount_to_return NUMERIC(12,2) := 0;
BEGIN
  -- CASO INSERT: Al crear una nueva bolsa
  IF TG_OP = 'INSERT' THEN
    -- Determinar cuánto descontar según el tipo de pocket
    IF NEW.type = 'expense' AND NEW.subtype = 'period' AND NEW.allocated_amount IS NOT NULL THEN
      v_amount_to_deduct := NEW.allocated_amount;
    ELSIF NEW.type = 'saving' AND NEW.target_amount IS NOT NULL THEN
      -- Para ahorro, podrías querer descontar un monto inicial si lo especificas
      -- Por ahora no descontamos nada automáticamente
      v_amount_to_deduct := 0;
    END IF;
    
    -- Descontar del balance de account_currencies
    IF v_amount_to_deduct > 0 AND NEW.account_id IS NOT NULL AND NEW.currency IS NOT NULL THEN
      UPDATE account_currencies
      SET balance = GREATEST(0, balance - v_amount_to_deduct)
      WHERE account_id = NEW.account_id
        AND currency = NEW.currency;
    END IF;
  
  -- CASO UPDATE: Al modificar una bolsa existente
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambió el allocated_amount, ajustar la diferencia
    IF NEW.type = 'expense' AND NEW.subtype = 'period' THEN
      IF OLD.allocated_amount IS NOT NULL AND NEW.allocated_amount IS NOT NULL 
         AND OLD.allocated_amount != NEW.allocated_amount THEN
        
        -- Si aumentó el monto, descontar la diferencia
        IF NEW.allocated_amount > OLD.allocated_amount THEN
          v_amount_to_deduct := NEW.allocated_amount - OLD.allocated_amount;
          
          UPDATE account_currencies
          SET balance = GREATEST(0, balance - v_amount_to_deduct)
          WHERE account_id = NEW.account_id
            AND currency = NEW.currency;
        
        -- Si disminuyó el monto, devolver la diferencia
        ELSIF NEW.allocated_amount < OLD.allocated_amount THEN
          v_amount_to_return := OLD.allocated_amount - NEW.allocated_amount;
          
          UPDATE account_currencies
          SET balance = balance + v_amount_to_return
          WHERE account_id = NEW.account_id
            AND currency = NEW.currency;
        END IF;
      END IF;
    END IF;
  
  -- CASO DELETE: Al eliminar una bolsa
  ELSIF TG_OP = 'DELETE' THEN
    -- Devolver el saldo no gastado
    IF OLD.type = 'expense' AND OLD.subtype = 'period' THEN
      -- Devolver: allocated_amount - spent_amount
      v_amount_to_return := COALESCE(OLD.allocated_amount, 0) - COALESCE(OLD.spent_amount, 0);
      
      IF v_amount_to_return > 0 THEN
        UPDATE account_currencies
        SET balance = balance + v_amount_to_return
        WHERE account_id = OLD.account_id
          AND currency = OLD.currency;
      END IF;
    ELSIF OLD.type = 'saving' THEN
      -- Devolver el monto ahorrado
      v_amount_to_return := COALESCE(OLD.amount_saved, 0);
      
      IF v_amount_to_return > 0 THEN
        UPDATE account_currencies
        SET balance = balance + v_amount_to_return
        WHERE account_id = OLD.account_id
          AND currency = OLD.currency;
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar balance
DROP TRIGGER IF EXISTS trg_update_account_balance_on_pocket_change ON pockets;
CREATE TRIGGER trg_update_account_balance_on_pocket_change
AFTER INSERT OR UPDATE OR DELETE ON pockets
FOR EACH ROW
EXECUTE FUNCTION update_account_balance_on_pocket_change();

-- ============================================
-- PASO 3: Comentarios
-- ============================================

COMMENT ON FUNCTION calculate_pocket_period_fields IS 'Calcula automáticamente days_duration, starts_at, ends_at, daily_allowance, currency y next_payment según los datos disponibles';
COMMENT ON FUNCTION update_account_balance_on_pocket_change IS 'Actualiza el balance en account_currencies cuando se crea, modifica o elimina un pocket';
COMMENT ON TRIGGER trg_update_account_balance_on_pocket_change ON pockets IS 'Descuenta/devuelve dinero de account_currencies al crear/modificar/eliminar pockets';

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRACIÓN 008: FECHAS Y BALANCE COMPLETADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '  ✓ Función actualizada: calculate_pocket_period_fields()';
  RAISE NOTICE '  ✓ Nueva función: update_account_balance_on_pocket_change()';
  RAISE NOTICE '  ✓ Nuevo trigger: trg_update_account_balance_on_pocket_change';
  RAISE NOTICE '';
  RAISE NOTICE 'Funcionalidades:';
  RAISE NOTICE '  1. Calcular fechas automáticamente desde days_duration';
  RAISE NOTICE '  2. Al crear pocket expense.period: descuenta allocated_amount';
  RAISE NOTICE '  3. Al modificar allocated_amount: ajusta la diferencia';
  RAISE NOTICE '  4. Al eliminar pocket: devuelve saldo no gastado';
  RAISE NOTICE '============================================';
END $$;

SELECT 'Migración 008 completada' AS status;
