-- ============================================
-- DATOS DE PRUEBA SIMPLIFICADO
-- ============================================
-- Reemplazar 'YOUR_USER_ID' con tu UUID

-- TU USER ID AQUÍ
\set user_id 'YOUR_USER_ID'

-- 1. ACTUALIZAR PERFIL
UPDATE profiles
SET monthly_income = 50000, currency = 'UYU'
WHERE id = :'user_id';

-- 2. CREAR CUENTA (si no existe)
INSERT INTO accounts (user_id, name, type, currency, balance, is_primary)
VALUES (:'user_id', 'Efectivo Test', 'cash', 'UYU', 15000, true)
ON CONFLICT DO NOTHING;

-- 3. OBTENER IDs DE CATEGORÍAS EXISTENTES
-- (Asumiendo que ya tienes categorías creadas)

-- 4. CREAR BOLSAS DE GASTO
INSERT INTO pockets (user_id, name, type, emoji, allocated_amount, current_balance, starts_at, ends_at)
VALUES 
  (:'user_id', 'Comida Quincenal', 'expense', '🍔', 8000, 5500, CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days'),
  (:'user_id', 'Transporte', 'expense', '🚗', 3000, 2100, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days'),
  (:'user_id', 'Salidas', 'expense', '🎬', 4000, 3200, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- 5. CREAR BOLSAS DE AHORRO
INSERT INTO pockets (user_id, name, type, emoji, allocated_amount, current_balance, target_amount, starts_at, ends_at, auto_return_remaining)
VALUES 
  (:'user_id', 'Viaje a la Playa', 'saving', '🏖️', 5000, 5000, 15000, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '150 days', false),
  (:'user_id', 'Nueva Laptop', 'saving', '💻', 8000, 8000, 25000, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '120 days', false);

-- 6. CREAR MOVIMIENTOS
-- Obtener account_id
WITH account AS (
  SELECT id FROM accounts WHERE user_id = :'user_id' LIMIT 1
),
cat_comida AS (
  SELECT id FROM categories WHERE user_id = :'user_id' AND name = 'Comida' LIMIT 1
),
cat_fijo AS (
  SELECT id FROM categories WHERE user_id = :'user_id' AND name = 'Alquiler' LIMIT 1
),
cat_ahorro AS (
  SELECT id FROM categories WHERE user_id = :'user_id' AND type = 'saving' LIMIT 1
),
pocket_comida AS (
  SELECT id FROM pockets WHERE user_id = :'user_id' AND name = 'Comida Quincenal' LIMIT 1
)
-- Ingreso mensual
INSERT INTO movements (user_id, type, amount, date, description, account_id)
SELECT :'user_id', 'income', 50000, DATE_TRUNC('month', CURRENT_DATE), 'Salario del mes', account.id
FROM account;

-- Gastos fijos
WITH account AS (SELECT id FROM accounts WHERE user_id = :'user_id' LIMIT 1),
     cat_fijo AS (SELECT id FROM categories WHERE user_id = :'user_id' AND name = 'Alquiler' LIMIT 1)
INSERT INTO movements (user_id, type, amount, date, description, account_id, category_id)
SELECT :'user_id', 'fixed_expense', 15000, CURRENT_DATE - INTERVAL '5 days', 'Alquiler', account.id, cat_fijo.id
FROM account, cat_fijo;

WITH account AS (SELECT id FROM accounts WHERE user_id = :'user_id' LIMIT 1),
     cat_fijo AS (SELECT id FROM categories WHERE user_id = :'user_id' AND name = 'Servicios' LIMIT 1)
INSERT INTO movements (user_id, type, amount, date, description, account_id, category_id)
SELECT :'user_id', 'fixed_expense', 3000, CURRENT_DATE - INTERVAL '3 days', 'Servicios', account.id, cat_fijo.id
FROM account, cat_fijo
WHERE cat_fijo.id IS NOT NULL;

-- Verificar datos creados
SELECT 'Bolsas creadas:' as info;
SELECT name, type, current_balance, allocated_amount FROM pockets WHERE user_id = :'user_id';

SELECT 'Movimientos creados:' as info;
SELECT type, amount, date FROM movements WHERE user_id = :'user_id' ORDER BY date DESC LIMIT 5;
