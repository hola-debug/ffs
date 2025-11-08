-- ============================================
-- FIX: Corregir gastos_hoy para que solo cuente gastos variables
-- ============================================
-- El problema es que gastos_hoy incluye todos los gastos (fijos + variables)
-- pero debería solo contar gastos variables para comparar con saldo_diario_base

DROP VIEW IF EXISTS vw_daily_spendable;

CREATE VIEW vw_daily_spendable AS
WITH month_data AS (
  SELECT
    user_id,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS ingresos_mes,
    COALESCE(SUM(CASE WHEN type = 'expense' AND is_fixed = TRUE THEN amount ELSE 0 END), 0) AS gastos_fijos_mes,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS gastos_totales_mes
  FROM transactions
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY user_id
),
monthly_plan_data AS (
  SELECT
    user_id,
    daily_spendable_limit
  FROM monthly_plan
  WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
    AND year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
),
savings_data AS (
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) AS ahorro_mes
  FROM savings_moves
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  GROUP BY user_id
),
-- CORREGIDO: Solo gastos variables de hoy
today_data AS (
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) AS gastos_hoy
  FROM transactions
  WHERE date = CURRENT_DATE
    AND type = 'expense'
    AND is_fixed = FALSE  -- ⭐ AGREGADO: Solo gastos variables
  GROUP BY user_id
),
days_calc AS (
  SELECT
    EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::INTEGER AS total_dias_mes,
    EXTRACT(DAY FROM CURRENT_DATE)::INTEGER AS dia_actual
),
-- Calcular gastos variables desde inicio del mes hasta hoy (sin incluir fijos)
gastos_variables_acumulados AS (
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) AS gastos_variables_acum
  FROM transactions
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date <= CURRENT_DATE
    AND type = 'expense'
    AND is_fixed = FALSE
  GROUP BY user_id
)
SELECT
  m.user_id,
  m.ingresos_mes,
  m.gastos_fijos_mes,
  COALESCE(s.ahorro_mes, 0) AS ahorro_mes,
  
  -- Disponible para gastos variables del mes
  (m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)) AS disponible_mes,
  
  -- Días restantes (incluyendo hoy)
  (d.total_dias_mes - d.dia_actual + 1) AS dias_restantes,
  
  -- Saldo diario base: usa el límite manual si existe, sino calcula automático
  COALESCE(
    mp.daily_spendable_limit,
    ROUND((m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)) / NULLIF(d.total_dias_mes, 0), 2)
  ) AS saldo_diario_base,
  
  -- Saldo que debería tener acumulado HOY (días transcurridos * saldo_diario_base)
  ROUND(
    COALESCE(
      mp.daily_spendable_limit,
      (m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)) / NULLIF(d.total_dias_mes, 0)
    ) * d.dia_actual,
    2
  ) AS saldo_teorico_hoy,
  
  -- Gastos variables realizados hasta hoy
  COALESCE(gv.gastos_variables_acum, 0) AS gastos_variables_acum,
  
  -- SALDO ACUMULADO REAL HOY = saldo_teorico_hoy - gastos_variables_acum
  ROUND(
    (COALESCE(
      mp.daily_spendable_limit,
      (m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)) / NULLIF(d.total_dias_mes, 0)
    ) * d.dia_actual) - COALESCE(gv.gastos_variables_acum, 0),
    2
  ) AS saldo_acumulado_hoy,
  
  -- Total mensual teórico (si no se gasta nada)
  ROUND((m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)), 2) AS total_mensual_teorico,
  
  -- Campos legacy (mantener compatibilidad)
  ROUND((m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)) / NULLIF(d.total_dias_mes - d.dia_actual + 1, 0), 2) AS saldo_diario_hoy,
  COALESCE(t.gastos_hoy, 0) AS gastos_hoy,  -- ⭐ Ahora solo gastos variables
  ROUND((m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)) / NULLIF(d.total_dias_mes - d.dia_actual + 1, 0) - COALESCE(t.gastos_hoy, 0), 2) AS saldo_diario_restante_hoy

FROM month_data m
CROSS JOIN days_calc d
LEFT JOIN savings_data s ON s.user_id = m.user_id
LEFT JOIN today_data t ON t.user_id = m.user_id
LEFT JOIN gastos_variables_acumulados gv ON gv.user_id = m.user_id
LEFT JOIN monthly_plan_data mp ON mp.user_id = m.user_id;
