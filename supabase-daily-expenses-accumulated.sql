-- ============================================
-- Vista: Gastos diarios acumulados
-- ============================================
-- Esta vista calcula los gastos variables que se van acumulando
-- día a día durante el mes actual

DROP VIEW IF EXISTS vw_daily_expenses_accumulated CASCADE;

CREATE VIEW vw_daily_expenses_accumulated AS
WITH days_calc AS (
  SELECT
    EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::INTEGER AS total_dias_mes,
    EXTRACT(DAY FROM CURRENT_DATE)::INTEGER AS dia_actual,
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER AS mes_actual,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AS ano_actual
),
-- Gastos variables totales del mes hasta hoy
gastos_variables_mes AS (
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) AS gastos_variables_acum_mes
  FROM transactions
  WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    AND date <= CURRENT_DATE
    AND type = 'expense'
    AND is_fixed = FALSE
  GROUP BY user_id
),
-- Gastos variables solo de hoy
gastos_hoy AS (
  SELECT
    user_id,
    COALESCE(SUM(amount), 0) AS gastos_variables_hoy
  FROM transactions
  WHERE date = CURRENT_DATE
    AND type = 'expense'
    AND is_fixed = FALSE
  GROUP BY user_id
)
SELECT
  gvm.user_id,
  
  -- Día actual
  d.dia_actual,
  
  -- Mes actual
  d.mes_actual,
  
  -- Año actual
  d.ano_actual,
  
  -- Total de días del mes
  d.total_dias_mes,
  
  -- Gastos variables acumulados desde inicio del mes hasta hoy
  gvm.gastos_variables_acum_mes AS gastos_acumulados_mes,
  
  -- Gastos variables solo de hoy
  COALESCE(gh.gastos_variables_hoy, 0) AS gastos_hoy,
  
  -- Promedio diario de gasto (hasta hoy)
  ROUND(
    gvm.gastos_variables_acum_mes / NULLIF(d.dia_actual, 0),
    2
  ) AS promedio_diario_gasto

FROM gastos_variables_mes gvm
CROSS JOIN days_calc d
LEFT JOIN gastos_hoy gh ON gh.user_id = gvm.user_id;


-- ============================================
-- Función: Proyección de gastos acumulados para los próximos días
-- ============================================
-- Esta función proyecta los gastos acumulados para cada día futuro
-- basándose en el promedio de gasto diario actual
-- NOTA: Solo proyecta dentro del mes actual, no cruza al mes siguiente

CREATE OR REPLACE FUNCTION get_daily_expenses_projection(
  p_user_id UUID, 
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  date DATE,
  day_name TEXT,
  day_number INTEGER,
  month_number INTEGER,
  accumulated_expenses NUMERIC,
  projected_daily_avg NUMERIC
) AS $$
DECLARE
  v_end_of_month DATE;
  v_actual_days_ahead INTEGER;
BEGIN
  -- Calcular el último día del mes actual
  v_end_of_month := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Ajustar p_days_ahead para no pasar del fin de mes
  v_actual_days_ahead := LEAST(
    p_days_ahead,
    (v_end_of_month - CURRENT_DATE)::INTEGER
  );
  
  RETURN QUERY
  WITH daily_base AS (
    -- Obtener datos base del usuario
    SELECT
      user_id,
      gastos_acumulados_mes,
      promedio_diario_gasto
    FROM vw_daily_expenses_accumulated
    WHERE user_id = p_user_id
  ),
  date_series AS (
    -- Generar serie de fechas futuras (solo hasta fin de mes)
    SELECT 
      generate_series(
        CURRENT_DATE + INTERVAL '1 day',
        CURRENT_DATE + (v_actual_days_ahead || ' days')::INTERVAL,
        '1 day'::INTERVAL
      )::DATE AS future_date
  ),
  -- Obtener gastos ya programados/registrados futuros
  future_expenses_cumulative AS (
    SELECT
      ds.future_date,
      COALESCE(SUM(t.amount), 0) AS cumulative_expense
    FROM date_series ds
    LEFT JOIN transactions t ON 
      DATE_TRUNC('day', t.date)::DATE <= ds.future_date
      AND t.date > CURRENT_DATE
      AND t.user_id = p_user_id
      AND t.type = 'expense'
      AND t.is_fixed = FALSE
    GROUP BY ds.future_date
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
    -- Calcular gastos acumulados proyectados para ese día
    -- Gastos actuales del mes + (promedio diario * días desde hoy) + gastos programados
    ROUND(
      db.gastos_acumulados_mes + 
      (COALESCE(db.promedio_diario_gasto, 0) * (ds.future_date - CURRENT_DATE)::INTEGER) +
      COALESCE(fec.cumulative_expense, 0),
      2
    ) AS accumulated_expenses,
    db.promedio_diario_gasto AS projected_daily_avg
  FROM date_series ds
  CROSS JOIN daily_base db
  LEFT JOIN future_expenses_cumulative fec ON fec.future_date = ds.future_date
  ORDER BY ds.future_date;
END;
$$ LANGUAGE plpgsql;
