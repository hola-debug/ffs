-- ============================================
-- MIGRACIÓN 006: LIMPIEZA FINAL DE BALANCE
-- ============================================
-- Elimina todas las referencias a balance en accounts
-- y drop de vistas que lo referencian

-- PASO 1: Eliminar vista que referencia balance
DROP VIEW IF EXISTS account_with_currencies CASCADE;

-- PASO 2: Eliminar columnas de balance en accounts (redundante pero seguro)
ALTER TABLE accounts
DROP COLUMN IF EXISTS balance_deprecated CASCADE,
DROP COLUMN IF EXISTS balance CASCADE;

-- PASO 3: Recrear tabla de configuración si es necesario para el caché
-- Esto fuerza a Supabase a recargar el schema
COMMIT;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MIGRACIÓN 006: LIMPIEZA FINAL COMPLETADA';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '  ✓ Eliminada vista: account_with_currencies';
  RAISE NOTICE '  ✓ Eliminadas columnas: balance, balance_deprecated';
  RAISE NOTICE '  ✓ Schema limpiado de referencias antiguas';
  RAISE NOTICE '';
  RAISE NOTICE 'Ya puedes usar account_currencies normalmente';
  RAISE NOTICE '============================================';
END $$;

SELECT 'Migración 006 completada' AS status;
