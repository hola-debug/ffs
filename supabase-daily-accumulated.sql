-- ============================================
-- Vista mejorada: Saldo diario acumulado
-- ============================================
-- Esta vista calcula el saldo diario que se va acumulando
-- a lo largo del mes si no se gasta todo cada día

-- Primero eliminar la vista existente para evitar conflictos de columnas
DROP VIEW IF EXISTS vw_daily_spendable;

-- Recrear la vista con los nuevos campos
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
today_data AS (
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) AS gastos_hoy
  FROM transactions
  WHERE date = CURRENT_DATE
    AND type = 'expense'
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
  COALESCE(t.gastos_hoy, 0) AS gastos_hoy,
  ROUND((m.ingresos_mes - m.gastos_fijos_mes - COALESCE(s.ahorro_mes, 0)) / NULLIF(d.total_dias_mes - d.dia_actual + 1, 0) - COALESCE(t.gastos_hoy, 0), 2) AS saldo_diario_restante_hoy

FROM month_data m
CROSS JOIN days_calc d
LEFT JOIN savings_data s ON s.user_id = m.user_id
LEFT JOIN today_data t ON t.user_id = m.user_id
LEFT JOIN gastos_variables_acumulados gv ON gv.user_id = m.user_id
LEFT JOIN monthly_plan_data mp ON mp.user_id = m.user_id;

-- ============================================
-- Función: Proyección de saldo diario para los próximos días
-- ============================================
-- Esta función calcula el saldo acumulado proyectado para cada día futuro
-- considerando los gastos ya realizados

CREATE OR REPLACE FUNCTION get_daily_projection(p_user_id UUID, p_days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  day_name TEXT,
  day_number INTEGER,
  month_number INTEGER,
  accumulated_balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_base AS (
    -- Obtener el saldo diario base del usuario
    SELECT
      user_id,
      saldo_diario_base,
      saldo_acumulado_hoy,
      gastos_variables_acum
    FROM vw_daily_spendable
    WHERE user_id = p_user_id
  ),
  date_series AS (
    -- Generar serie de fechas futuras
    SELECT 
      generate_series(
        CURRENT_DATE + INTERVAL '1 day',
        CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL,
        '1 day'::INTERVAL
      )::DATE AS future_date
  ),
  -- Obtener gastos programados/recurrentes futuros (si existen)
  future_expenses AS (
    SELECT
      DATE_TRUNC('day', t.date)::DATE AS expense_date,
      SUM(t.amount) AS total_expense
    FROM transactions t
    WHERE t.user_id = p_user_id
      AND t.date > CURRENT_DATE
      AND t.date <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
      AND t.type = 'expense'
      AND t.is_fixed = FALSE
    GROUP BY DATE_TRUNC('day', t.date)::DATE
  )
  SELECT
    ds.future_date AS date,
    CASE EXTRACT(DOW FROM ds.future_date)
      WHEN 0 THEN 'DOM'
      WHEN 1 THEN 'LUN'
      WHEN 2 THEN 'MAR'
      WHEN 3 THEN 'MIÉ'
      WHEN 4 THEN 'JUE'
      WHEN 5 THEN 'VIE'
      WHEN 6 THEN 'SÁB'
    END AS day_name,
    EXTRACT(DAY FROM ds.future_date)::INTEGER AS day_number,
    EXTRACT(MONTH FROM ds.future_date)::INTEGER AS month_number,
    -- Calcular saldo acumulado para ese día
    ROUND(
      db.saldo_acumulado_hoy 
      + (db.saldo_diario_base * (ds.future_date - CURRENT_DATE))
      - COALESCE(SUM(fe.total_expense) OVER (ORDER BY ds.future_date), 0),
      2
    ) AS accumulated_balance
  FROM date_series ds
  CROSS JOIN daily_base db
  LEFT JOIN future_expenses fe ON fe.expense_date <= ds.future_date
  ORDER BY ds.future_date;
END;
$$ LANGUAGE plpgsql;
