-- ============================================
-- DATOS DE PRUEBA - Sistema de Bolsas
-- ============================================
-- Este script crea datos de ejemplo para probar la aplicación
-- IMPORTANTE: Reemplazar 'YOUR_USER_ID' con tu ID de usuario real

-- Variable para el user_id (reemplazar con tu ID real)
-- Puedes obtenerlo con: SELECT id FROM auth.users WHERE email = 'tu_email@ejemplo.com';
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID'; -- REEMPLAZAR AQUÍ
  v_account_id UUID;
  v_comida_category UUID;
  v_transporte_category UUID;
  v_fijo_category UUID;
  v_ahorro_category UUID;
  v_pocket_comida UUID;
  v_pocket_viaje UUID;
BEGIN
  
  -- ============================================
  -- 1. ACTUALIZAR PERFIL CON INGRESO MENSUAL
  -- ============================================
  
  UPDATE profiles
  SET monthly_income = 50000,
      currency = 'UYU'
  WHERE id = v_user_id;
  
  -- ============================================
  -- 2. CREAR CUENTA PRINCIPAL
  -- ============================================
  
  INSERT INTO accounts (id, user_id, name, type, currency, balance, is_primary)
  VALUES (gen_random_uuid(), v_user_id, 'Efectivo', 'cash', 'UYU', 15000, true)
  RETURNING id INTO v_account_id;
  
  -- ============================================
  -- 3. CREAR CATEGORÍAS
  -- ============================================
  
  -- Categorías de gastos de bolsas (ignorar si ya existen)
  INSERT INTO categories (id, user_id, name, type, icon, color)
  VALUES 
    (gen_random_uuid(), v_user_id, 'Comida', 'pocket_expense', '🍔', '#f59e0b'),
    (gen_random_uuid(), v_user_id, 'Transporte', 'pocket_expense', '🚗', '#f59e0b'),
    (gen_random_uuid(), v_user_id, 'Entretenimiento', 'pocket_expense', '🎬', '#f59e0b')
  ON CONFLICT (user_id, name) DO NOTHING;
  
  -- Obtener ID de categoría Comida
  SELECT id INTO v_comida_category FROM categories 
  WHERE user_id = v_user_id AND name = 'Comida' LIMIT 1;
  
  -- Categorías de gastos fijos (ignorar si ya existen)
  INSERT INTO categories (id, user_id, name, type, icon, color)
  VALUES 
    (gen_random_uuid(), v_user_id, 'Alquiler', 'fixed_expense', '🏠', '#ef4444'),
    (gen_random_uuid(), v_user_id, 'Servicios', 'fixed_expense', '⚡', '#ef4444')
  ON CONFLICT (user_id, name) DO NOTHING;
  
  -- Obtener ID de categoría fija
  SELECT id INTO v_fijo_category FROM categories 
  WHERE user_id = v_user_id AND name = 'Alquiler' LIMIT 1;
  
  -- Categorías de ahorro (ignorar si ya existen)
  INSERT INTO categories (id, user_id, name, type, icon, color)
  VALUES (gen_random_uuid(), v_user_id, 'Ahorro General', 'saving', '🐷', '#3b82f6')
  ON CONFLICT (user_id, name) DO NOTHING;
  
  -- Obtener ID de categoría ahorro
  SELECT id INTO v_ahorro_category FROM categories 
  WHERE user_id = v_user_id AND name = 'Ahorro General' LIMIT 1;
  
  -- ============================================
  -- 4. CREAR BOLSAS DE GASTO
  -- ============================================
  
  -- Bolsa de Comida Quincenal (activa)
  INSERT INTO pockets (id, user_id, name, type, emoji, allocated_amount, current_balance, starts_at, ends_at)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    'Comida Quincenal',
    'expense',
    '🍔',
    8000,
    5500,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '15 days'
  )
  RETURNING id INTO v_pocket_comida;
  
  -- Bolsa de Transporte Mensual (activa)
  INSERT INTO pockets (id, user_id, name, type, emoji, allocated_amount, current_balance, starts_at, ends_at)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    'Transporte',
    'expense',
    '🚗',
    3000,
    2100,
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days'
  );
  
  -- Bolsa de Entretenimiento (activa)
  INSERT INTO pockets (id, user_id, name, type, emoji, allocated_amount, current_balance, starts_at, ends_at)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    'Salidas',
    'expense',
    '🎬',
    4000,
    3200,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days'
  );
  
  -- ============================================
  -- 5. CREAR BOLSAS DE AHORRO
  -- ============================================
  
  -- Bolsa de ahorro para viaje
  INSERT INTO pockets (id, user_id, name, type, emoji, allocated_amount, current_balance, target_amount, starts_at, ends_at, auto_return_remaining)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    'Viaje a la Playa',
    'saving',
    '🏖️',
    5000,
    5000,
    15000,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '150 days',
    false
  )
  RETURNING id INTO v_pocket_viaje;
  
  -- Bolsa de ahorro para laptop
  INSERT INTO pockets (id, user_id, name, type, emoji, allocated_amount, current_balance, target_amount, starts_at, ends_at, auto_return_remaining)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    'Nueva Laptop',
    'saving',
    '💻',
    8000,
    8000,
    25000,
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '120 days',
    false
  );
  
  -- ============================================
  -- 6. CREAR MOVIMIENTOS
  -- ============================================
  
  -- Ingreso mensual
  INSERT INTO movements (user_id, type, amount, date, description, account_id)
  VALUES (
    v_user_id,
    'income',
    50000,
    DATE_TRUNC('month', CURRENT_DATE),
    'Salario del mes',
    v_account_id
  );
  
  -- Gastos fijos del mes
  INSERT INTO movements (user_id, type, amount, date, description, account_id, category_id)
  VALUES 
    (v_user_id, 'fixed_expense', 15000, CURRENT_DATE - INTERVAL '5 days', 'Alquiler', v_account_id, v_fijo_category),
    (v_user_id, 'fixed_expense', 3000, CURRENT_DATE - INTERVAL '3 days', 'Servicios', v_account_id, v_fijo_category);
  
  -- Ahorro directo
  INSERT INTO movements (user_id, type, amount, date, description, account_id, category_id)
  VALUES (
    v_user_id,
    'saving_deposit',
    5000,
    CURRENT_DATE - INTERVAL '2 days',
    'Fondo de emergencia',
    v_account_id,
    v_ahorro_category
  );
  
  -- Asignación inicial a bolsas (pocket_allocation)
  INSERT INTO movements (user_id, type, amount, date, description, pocket_id)
  VALUES 
    (v_user_id, 'pocket_allocation', 8000, CURRENT_DATE, 'Asignación inicial', v_pocket_comida),
    (v_user_id, 'pocket_allocation', 5000, CURRENT_DATE - INTERVAL '30 days', 'Asignación inicial', v_pocket_viaje);
  
  -- Gastos desde bolsas (pocket_expense)
  INSERT INTO movements (user_id, type, amount, date, description, pocket_id, category_id, account_id)
  VALUES 
    (v_user_id, 'pocket_expense', 500, CURRENT_DATE - INTERVAL '2 days', 'Supermercado', v_pocket_comida, v_comida_category, v_account_id),
    (v_user_id, 'pocket_expense', 800, CURRENT_DATE - INTERVAL '1 day', 'Compras varias', v_pocket_comida, v_comida_category, v_account_id),
    (v_user_id, 'pocket_expense', 1200, CURRENT_DATE, 'Mercado', v_pocket_comida, v_comida_category, v_account_id);
  
  -- ============================================
  -- FINALIZADO
  -- ============================================
  
  RAISE NOTICE 'Datos de prueba creados exitosamente!';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Account ID: %', v_account_id;
  RAISE NOTICE 'Pocket Comida ID: %', v_pocket_comida;
  
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver bolsas activas
SELECT 
  name,
  type,
  allocated_amount,
  current_balance,
  CASE 
    WHEN type = 'expense' THEN daily_allowance 
    WHEN type = 'saving' THEN target_amount 
  END as info,
  days_duration
FROM pockets
WHERE status = 'active'
ORDER BY created_at DESC;

-- Ver resumen mensual
SELECT * FROM user_monthly_summary;

-- Ver movimientos recientes
SELECT 
  type,
  amount,
  date,
  description
FROM movements
ORDER BY date DESC
LIMIT 10;
