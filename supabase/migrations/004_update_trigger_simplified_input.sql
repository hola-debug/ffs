-- ============================================
-- ACTUALIZACIÓN: Trigger para soportar entrada simplificada
-- ============================================
-- Esta migración actualiza el trigger calculate_pocket_period_fields()
-- para soportar la nueva lógica de entrada simplificada:
-- - EXPENSE.PERIOD: Opción de ingresar días O fechas
-- - SAVING: Opción de ingresar días O fecha límite
-- - DEBT: Opción de ingresar cuotas O monto por cuota

-- ============================================
-- REEMPLAZAR FUNCIÓN DE CÁLCULO
-- ============================================

CREATE OR REPLACE FUNCTION calculate_pocket_period_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- ========================================
  -- LÓGICA PARA FECHAS Y DURACIÓN
  -- ========================================
  
  -- CASO 1: Si ingresó days_duration pero no fechas
  -- Aplica a: EXPENSE.PERIOD y SAVING
  IF NEW.days_duration IS NOT NULL AND (NEW.starts_at IS NULL OR NEW.ends_at IS NULL) THEN
    -- Si no tiene starts_at, comenzar hoy
    IF NEW.starts_at IS NULL THEN
      NEW.starts_at := CURRENT_DATE;
    END IF;
    -- Calcular ends_at basado en days_duration
    NEW.ends_at := NEW.starts_at + (NEW.days_duration || ' days')::INTERVAL;
  
  -- CASO 2: Si ingresó fechas pero no duración
  ELSIF NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL AND NEW.days_duration IS NULL THEN
    NEW.days_duration := (NEW.ends_at - NEW.starts_at)::INT + 1;
  
  -- CASO 3: Si no ingresó nada (saving sin fecha límite)
  ELSIF NEW.starts_at IS NULL AND NEW.type = 'saving' THEN
    NEW.starts_at := CURRENT_DATE;
  END IF;
  
  -- ========================================
  -- CALCULAR DAILY_ALLOWANCE (expense.period)
  -- ========================================
  IF NEW.type = 'expense' AND NEW.subtype = 'period' 
     AND NEW.allocated_amount IS NOT NULL 
     AND NEW.days_duration IS NOT NULL 
     AND NEW.days_duration > 0 THEN
    NEW.daily_allowance := ROUND((NEW.allocated_amount / NEW.days_duration)::NUMERIC, 2);
  END IF;
  
  -- ========================================
  -- AUTO-ASIGNAR CURRENCY SI NO EXISTE
  -- ========================================
  IF NEW.currency IS NULL AND NEW.account_id IS NOT NULL THEN
    NEW.currency := get_account_primary_currency(NEW.account_id);
    IF NEW.currency IS NULL THEN
      NEW.currency := 'UYU';
    END IF;
  END IF;
  
  -- ========================================
  -- CALCULAR NEXT_PAYMENT (fixed/recurrent/debt)
  -- ========================================
  IF NEW.due_day IS NOT NULL THEN
    IF NEW.type = 'expense' AND NEW.subtype IN ('fixed', 'recurrent') THEN
      NEW.next_payment := calculate_next_payment(NEW.due_day, NEW.last_payment);
    ELSIF NEW.type = 'debt' THEN
      NEW.next_payment := calculate_next_payment(NEW.due_day, NEW.last_payment);
    END IF;
  END IF;
  
  -- ========================================
  -- CALCULAR CUOTA/INSTALMENTS (debt)
  -- ========================================
  IF NEW.type = 'debt' THEN
    -- Si tiene installments_total pero no installment_amount
    IF NEW.installments_total IS NOT NULL AND NEW.installment_amount IS NULL THEN
      NEW.installment_amount := ROUND((NEW.original_amount / NEW.installments_total)::NUMERIC, 2);
    
    -- Si tiene installment_amount pero no installments_total
    ELSIF NEW.installment_amount IS NOT NULL AND NEW.installments_total IS NULL THEN
      NEW.installments_total := CEIL((NEW.original_amount / NEW.installment_amount)::NUMERIC);
    END IF;
    
    -- Inicializar remaining_amount si es nueva deuda
    IF NEW.remaining_amount IS NULL THEN
      NEW.remaining_amount := NEW.original_amount;
    END IF;
  END IF;
  
  -- ========================================
  -- DEFAULTS AUTOMÁTICOS
  -- ========================================
  IF NEW.notification_days_before IS NULL AND NEW.subtype = 'recurrent' THEN
    NEW.notification_days_before := 3;
  END IF;
  
  IF NEW.allow_withdrawals IS NULL AND NEW.type = 'saving' THEN
    NEW.allow_withdrawals := TRUE;
  END IF;
  
  IF NEW.auto_register IS NULL AND NEW.subtype = 'fixed' THEN
    NEW.auto_register := FALSE;
  END IF;
  
  IF NEW.automatic_payment IS NULL AND NEW.type = 'debt' THEN
    NEW.automatic_payment := FALSE;
  END IF;
  
  IF NEW.frequency IS NULL AND NEW.type = 'saving' THEN
    NEW.frequency := 'none';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RECREAR TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS trg_calculate_pocket_fields ON pockets;
CREATE TRIGGER trg_calculate_pocket_fields
BEFORE INSERT OR UPDATE ON pockets
FOR EACH ROW
EXECUTE FUNCTION calculate_pocket_period_fields();

-- ============================================
-- COMENTARIOS ACTUALIZADOS
-- ============================================

COMMENT ON FUNCTION calculate_pocket_period_fields IS 'Calcula automáticamente days_duration, daily_allowance, currency, next_payment, installments según modo de entrada del usuario';

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TRIGGER ACTUALIZADO EXITOSAMENTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Nuevas capacidades:';
  RAISE NOTICE '  ✓ EXPENSE.PERIOD: Acepta days_duration O (starts_at + ends_at)';
  RAISE NOTICE '  ✓ SAVING: Acepta days_duration O ends_at (opcional)';
  RAISE NOTICE '  ✓ DEBT: Acepta installments_total O installment_amount';
  RAISE NOTICE '  ✓ Cálculos automáticos: fechas, cuotas, daily_allowance';
  RAISE NOTICE '============================================';
END $$;

SELECT 'Actualización completada' AS status;
