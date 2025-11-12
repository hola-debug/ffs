-- ============================================
-- VISTA COMPLETA: user_monthly_summary
-- ============================================
-- Incluye ingresos acumulados, saldo en cuentas y excedentes

DROP VIEW IF EXISTS user_monthly_summary;

CREATE OR REPLACE VIEW user_monthly_summary AS
SELECT
  pr.id AS user_id,
  pr.currency AS default_currency,
  
  -- ============================================
  -- SALDO REAL EN CUENTAS (LO QUE TENÉS HOY)
  -- ============================================
  
  -- Total en cuentas (saldo real actual = ingresos del mes + excedente anterior)
  (SELECT COALESCE(SUM(a.balance), 0)
   FROM accounts a
   WHERE a.user_id = pr.id) AS total_in_accounts,
  
  -- ============================================
  -- INGRESOS DEL MES ACTUAL
  -- ============================================
  
  -- Ingresos acumulados del mes actual (suma de todos los ingresos registrados)
  (SELECT COALESCE(SUM(m.amount), 0)
   FROM movements m
   WHERE m.user_id = pr.id
     AND m.type = 'income'
     AND EXTRACT(MONTH FROM m.date) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(YEAR FROM m.date) = EXTRACT(YEAR FROM CURRENT_DATE)) AS income_month,
  
  -- ============================================
  -- GASTOS Y ASIGNACIONES DEL MES
  -- ============================================
  
  -- Gastos fijos del mes
  (SELECT COALESCE(SUM(m.amount), 0)
   FROM movements m
   WHERE m.user_id = pr.id
     AND m.type = 'fixed_expense'
     AND EXTRACT(MONTH FROM m.date) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(YEAR FROM m.date) = EXTRACT(YEAR FROM CURRENT_DATE)) AS fixed_expenses_month,
  
  -- Ahorro depositado del mes
  (SELECT COALESCE(SUM(m.amount), 0)
   FROM movements m
   WHERE m.user_id = pr.id
     AND m.type = 'saving_deposit'
     AND EXTRACT(MONTH FROM m.date) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(YEAR FROM m.date) = EXTRACT(YEAR FROM CURRENT_DATE)) AS saving_deposits_month,
  
  -- Total asignado a bolsas del mes
  (SELECT COALESCE(SUM(m.amount), 0)
   FROM movements m
   WHERE m.user_id = pr.id
     AND m.type = 'pocket_allocation'
     AND EXTRACT(MONTH FROM m.date) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(YEAR FROM m.date) = EXTRACT(YEAR FROM CURRENT_DATE)) AS pockets_allocated_month,
  
  -- ============================================
  -- BOLSAS ACTIVAS (DINERO SEPARADO)
  -- ============================================
  
  -- Total en bolsas activas (dinero separado actualmente)
  (SELECT COALESCE(SUM(p.current_balance), 0)
   FROM pockets p
   WHERE p.user_id = pr.id
     AND p.status = 'active') AS pockets_current_balance,
  
  -- ============================================
  -- DISPONIBLE Y EXCEDENTE
  -- ============================================
  
  -- DISPONIBLE = Saldo en cuentas - dinero en bolsas activas
  -- Este es el dinero que NO está asignado a ninguna bolsa
  (SELECT COALESCE(SUM(a.balance), 0)
   FROM accounts a
   WHERE a.user_id = pr.id) 
  - 
  (SELECT COALESCE(SUM(p.current_balance), 0)
   FROM pockets p
   WHERE p.user_id = pr.id
     AND p.status = 'active') AS available_balance,
  
  -- EXCEDENTE DEL MES ANTERIOR = Saldo en cuentas - Ingresos del mes
  -- Este es el dinero que arrastrás del mes anterior
  (SELECT COALESCE(SUM(a.balance), 0)
   FROM accounts a
   WHERE a.user_id = pr.id)
  -
  (SELECT COALESCE(SUM(m.amount), 0)
   FROM movements m
   WHERE m.user_id = pr.id
     AND m.type = 'income'
     AND EXTRACT(MONTH FROM m.date) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(YEAR FROM m.date) = EXTRACT(YEAR FROM CURRENT_DATE)) AS surplus_from_previous_month,
  
  -- ============================================
  -- TOTALES HISTÓRICOS (TODOS LOS TIEMPOS)
  -- ============================================
  
  -- Total de ingresos históricos (todos los tiempos)
  (SELECT COALESCE(SUM(m.amount), 0)
   FROM movements m
   WHERE m.user_id = pr.id
     AND m.type = 'income') AS total_income_all_time,
  
  -- Total de gastos fijos históricos
  (SELECT COALESCE(SUM(m.amount), 0)
   FROM movements m
   WHERE m.user_id = pr.id
     AND m.type = 'fixed_expense') AS total_fixed_expenses_all_time,
  
  -- Total asignado a bolsas histórico
  (SELECT COALESCE(SUM(m.amount), 0)
   FROM movements m
   WHERE m.user_id = pr.id
     AND m.type = 'pocket_allocation') AS total_pockets_allocated_all_time,
  
  -- Total de gastos desde bolsas histórico
  (SELECT COALESCE(SUM(m.amount), 0)
   FROM movements m
   WHERE m.user_id = pr.id
     AND m.type = 'pocket_expense') AS total_pocket_expenses_all_time

FROM profiles pr;

COMMENT ON VIEW user_monthly_summary IS 'Resumen financiero completo: ingresos del mes, saldo total en cuentas, excedente del mes anterior, y dinero disponible sin asignar.';

-- ============================================
-- VISTA AUXILIAR: Explicación de conceptos
-- ============================================

CREATE OR REPLACE VIEW user_financial_breakdown AS
SELECT
  user_id,
  default_currency,
  
  -- LO QUE TENÉS HOY
  total_in_accounts AS "💰 Saldo Total en Cuentas",
  
  -- DE DÓNDE VIENE ESE DINERO
  income_month AS "📥 Ingresos Este Mes",
  surplus_from_previous_month AS "💵 Excedente Mes Anterior",
  
  -- CÓMO ESTÁ DISTRIBUIDO
  pockets_current_balance AS "👛 En Bolsas Activas",
  available_balance AS "✨ Disponible (sin asignar)",
  
  -- QUÉ HICISTE CON EL DINERO ESTE MES
  fixed_expenses_month AS "🏠 Gastos Fijos Este Mes",
  pockets_allocated_month AS "📦 Asignado a Bolsas Este Mes",
  saving_deposits_month AS "🐷 Ahorro Este Mes",
  
  -- VERIFICACIÓN: LO QUE TENÉS = INGRESOS + EXCEDENTE
  total_in_accounts = income_month + surplus_from_previous_month AS "✅ Balance Correcto"
  
FROM user_monthly_summary;

COMMENT ON VIEW user_financial_breakdown IS 'Desglose visual de conceptos financieros con emojis para mejor comprensión';

-- ============================================
-- VERIFICACIÓN Y EJEMPLOS
-- ============================================

-- Ver resumen completo
SELECT 
  user_id,
  default_currency AS moneda,
  
  -- SALDO Y ORIGEN
  total_in_accounts AS saldo_total_cuentas,
  income_month AS ingresos_mes_actual,
  surplus_from_previous_month AS excedente_mes_anterior,
  
  -- DISTRIBUCIÓN
  pockets_current_balance AS en_bolsas_activas,
  available_balance AS disponible_sin_asignar,
  
  -- GASTOS DEL MES
  fixed_expenses_month AS gastos_fijos_mes,
  pockets_allocated_month AS asignado_bolsas_mes,
  saving_deposits_month AS ahorro_mes,
  
  -- HISTÓRICOS
  total_income_all_time AS ingresos_totales_historico,
  total_pocket_expenses_all_time AS gastos_bolsas_historico
  
FROM user_monthly_summary;

-- Ver con emojis
SELECT * FROM user_financial_breakdown;

-- ============================================
-- EXPLICACIÓN DE CONCEPTOS
-- ============================================

/*
╔════════════════════════════════════════════════════════════════╗
║                    CONCEPTOS EXPLICADOS                        ║
╚════════════════════════════════════════════════════════════════╝

1. 💰 SALDO TOTAL EN CUENTAS (total_in_accounts)
   ────────────────────────────────────────────
   Es la SUMA de balance de todas tus cuentas.
   Es el dinero REAL que tenés hoy.
   
   Fórmula: SUM(accounts.balance)
   Ejemplo: Cuenta 1: $10,000 + Cuenta 2: $5,000 = $15,000

2. 📥 INGRESOS DEL MES (income_month)
   ──────────────────────────────────
   Es la suma de TODOS los ingresos registrados este mes.
   
   Fórmula: SUM(movements WHERE type='income' AND month=current)
   Ejemplo: Salario $40,000 + Freelance $5,000 = $45,000

3. 💵 EXCEDENTE DEL MES ANTERIOR (surplus_from_previous_month)
   ────────────────────────────────────────────────────────────
   Es el dinero que ARRASTRÁS del mes pasado.
   
   Fórmula: total_in_accounts - income_month
   Ejemplo: $15,000 (total) - $45,000 (ingresos) = -$30,000
            (Si es negativo, significa que gastaste más de lo ingresado)
   
   Ejemplo positivo: $60,000 (total) - $45,000 (ingresos) = $15,000
            (Tenías $15,000 del mes anterior)

4. 👛 EN BOLSAS ACTIVAS (pockets_current_balance)
   ───────────────────────────────────────────────
   Es el dinero que tenés SEPARADO en bolsas de gasto o ahorro.
   Este dinero está "apartado" para un propósito específico.
   
   Fórmula: SUM(pockets.current_balance WHERE status='active')
   Ejemplo: Bolsa Comida: $5,000 + Bolsa Transporte: $2,000 = $7,000

5. ✨ DISPONIBLE SIN ASIGNAR (available_balance)
   ─────────────────────────────────────────────
   Es el dinero que NO está en ninguna bolsa.
   Es el dinero "libre" que podés usar o asignar.
   
   Fórmula: total_in_accounts - pockets_current_balance
   Ejemplo: $15,000 (total) - $7,000 (bolsas) = $8,000 disponible

6. 🏠 GASTOS FIJOS DEL MES (fixed_expenses_month)
   ──────────────────────────────────────────────
   Total de gastos fijos pagados este mes (alquiler, servicios, etc.)
   Estos gastos se RESTAN directamente del saldo de la cuenta.

7. 📦 ASIGNADO A BOLSAS DEL MES (pockets_allocated_month)
   ───────────────────────────────────────────────────────
   Total asignado a bolsas este mes.
   Esto también se RESTA del saldo de la cuenta.

8. 🐷 AHORRO DEL MES (saving_deposits_month)
   ─────────────────────────────────────────
   Total depositado en ahorro este mes.
   También se RESTA del saldo de la cuenta.

╔════════════════════════════════════════════════════════════════╗
║                         EJEMPLO PRÁCTICO                        ║
╚════════════════════════════════════════════════════════════════╝

MES ANTERIOR (Enero):
─────────────────────
- Ingresaste: $40,000
- Gastaste en fijo: $15,000
- Asignaste a bolsas: $10,000
- Ahorro: $5,000
- Excedente = $40,000 - $15,000 - $10,000 - $5,000 = $10,000
- Saldo final enero: $10,000 ✅

MES ACTUAL (Febrero):
────────────────────
- Saldo inicial (excedente enero): $10,000 🎯
- Ingreso nuevo (salario febrero): $40,000
- SALDO TOTAL EN CUENTAS: $50,000 💰

- Gastos fijos: $16,000
- Asignado a bolsas: $12,000
- Ahorro: $3,000
- Total separado en bolsas activas: $12,000 👛

RESULTADO:
──────────
✅ Saldo total en cuentas: $50,000
✅ Ingresos este mes: $40,000
✅ Excedente mes anterior: $10,000 ($50k - $40k)
✅ En bolsas activas: $12,000
✅ Disponible sin asignar: $38,000 ($50k - $12k)

VERIFICACIÓN:
────────────
$50,000 (saldo) = $40,000 (ingreso) + $10,000 (excedente) ✅
*/
