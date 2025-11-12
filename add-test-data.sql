-- ============================================
-- AGREGAR DATOS DE PRUEBA
-- ============================================
-- Instrucciones:
-- 1. Reemplaza 'f9dfd367-8afd-4bcf-859b-0981bc8d298c' con tu user_id en TODAS las líneas
-- 2. Ejecuta TODO el script en Supabase SQL Editor

-- REEMPLAZAR ESTE UUID CON EL TUYO:
-- SELECT id FROM auth.users WHERE email = 'tu_email';

-- 1. ACTUALIZAR PERFIL CON INGRESO
UPDATE profiles
SET monthly_income = 50000, currency = 'UYU'
WHERE id = 'f9dfd367-8afd-4bcf-859b-0981bc8d298c';

-- 2. CREAR BOLSAS DE GASTO
INSERT INTO pockets (user_id, name, type, emoji, allocated_amount, current_balance, starts_at, ends_at)
VALUES 
  ('f9dfd367-8afd-4bcf-859b-0981bc8d298c', 'Comida Quincenal', 'expense', '🍔', 8000, 5500, CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days'),
  ('f9dfd367-8afd-4bcf-859b-0981bc8d298c', 'Transporte', 'expense', '🚗', 3000, 2100, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days'),
  ('f9dfd367-8afd-4bcf-859b-0981bc8d298c', 'Salidas', 'expense', '🎬', 4000, 3200, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- 3. CREAR BOLSAS DE AHORRO
INSERT INTO pockets (user_id, name, type, emoji, allocated_amount, current_balance, target_amount, starts_at, ends_at, auto_return_remaining)
VALUES 
  ('f9dfd367-8afd-4bcf-859b-0981bc8d298c', 'Viaje a la Playa', 'saving', '🏖️', 5000, 5000, 15000, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '150 days', false),
  ('f9dfd367-8afd-4bcf-859b-0981bc8d298c', 'Nueva Laptop', 'saving', '💻', 8000, 8000, 25000, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '120 days', false);

-- 4. CREAR MOVIMIENTOS
-- Ingreso mensual
INSERT INTO movements (user_id, type, amount, date, description)
VALUES ('f9dfd367-8afd-4bcf-859b-0981bc8d298c', 'income', 50000, DATE_TRUNC('month', CURRENT_DATE), 'Salario del mes');

-- Gastos fijos (si tienes categoría de Alquiler)
INSERT INTO movements (user_id, type, amount, date, description, category_id)
SELECT 'f9dfd367-8afd-4bcf-859b-0981bc8d298c', 'fixed_expense', 15000, CURRENT_DATE - INTERVAL '5 days', 'Alquiler', id
FROM categories 
WHERE user_id = 'f9dfd367-8afd-4bcf-859b-0981bc8d298c' AND name = 'Alquiler' 
LIMIT 1;

INSERT INTO movements (user_id, type, amount, date, description, category_id)
SELECT 'f9dfd367-8afd-4bcf-859b-0981bc8d298c', 'fixed_expense', 3000, CURRENT_DATE - INTERVAL '3 days', 'Servicios', id
FROM categories 
WHERE user_id = 'f9dfd367-8afd-4bcf-859b-0981bc8d298c' AND name = 'Servicios' 
LIMIT 1;

-- Asignaciones a bolsas
INSERT INTO movements (user_id, type, amount, date, description, pocket_id)
SELECT 'f9dfd367-8afd-4bcf-859b-0981bc8d298c', 'pocket_allocation', 8000, CURRENT_DATE, 'Asignación inicial', id
FROM pockets 
WHERE user_id = 'f9dfd367-8afd-4bcf-859b-0981bc8d298c' AND name = 'Comida Quincenal' 
LIMIT 1;

-- Gastos de hoy
INSERT INTO movements (user_id, type, amount, date, description, pocket_id, category_id)
SELECT 
  'f9dfd367-8afd-4bcf-859b-0981bc8d298c', 
  'pocket_expense', 
  500, 
  CURRENT_DATE, 
  'Supermercado', 
  p.id,
  c.id
FROM pockets p, categories c
WHERE p.user_id = 'f9dfd367-8afd-4bcf-859b-0981bc8d298c' 
  AND p.name = 'Comida Quincenal'
  AND c.user_id = 'f9dfd367-8afd-4bcf-859b-0981bc8d298c'
  AND c.name = 'Comida'
LIMIT 1;

-- ============================================
-- VERIFICAR DATOS CREADOS
-- ============================================

SELECT 'Bolsas creadas:' as resultado;
SELECT name, type, current_balance, allocated_amount 
FROM pockets 
WHERE user_id = 'f9dfd367-8afd-4bcf-859b-0981bc8d298c';

SELECT 'Movimientos creados:' as resultado;
SELECT type, amount, TO_CHAR(date, 'YYYY-MM-DD') as fecha, description
FROM movements 
WHERE user_id = 'f9dfd367-8afd-4bcf-859b-0981bc8d298c' 
ORDER BY date DESC;

SELECT 'Resumen mensual:' as resultado;
SELECT * FROM user_monthly_summary 
WHERE user_id = 'f9dfd367-8afd-4bcf-859b-0981bc8d298c';
