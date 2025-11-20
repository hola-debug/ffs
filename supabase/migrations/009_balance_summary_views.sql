-- ============================================
-- MIGRACIÓN 009: VISTAS DE RESUMEN DE SALDOS
-- ============================================
-- Agrega una vista que expone el total de cuentas por usuario y moneda,
-- cuánto hay en bolsas activas y cuánto queda disponible para gastar.

CREATE OR REPLACE VIEW user_balance_by_currency AS
WITH account_totals AS (
  SELECT
    a.user_id,
    ac.currency,
    SUM(ac.balance)::numeric(20,2) AS total_accounts_balance
  FROM accounts a
  JOIN account_currencies ac ON ac.account_id = a.id
  GROUP BY a.user_id, ac.currency
),
pocket_totals AS (
  SELECT
    user_id,
    currency,
    SUM(pocket_balance)::numeric(20,2) AS pockets_current_balance,
    SUM(CASE WHEN type = 'expense' THEN pocket_balance ELSE 0 END)::numeric(20,2) AS expense_pockets_balance,
    SUM(CASE WHEN type = 'saving' THEN pocket_balance ELSE 0 END)::numeric(20,2) AS saving_pockets_balance
  FROM (
    SELECT
      user_id,
      currency,
      type,
      CASE
        WHEN type = 'expense' THEN GREATEST(
          COALESCE(allocated_amount, 0) - COALESCE(spent_amount, 0),
          0
        )
        WHEN type = 'saving' THEN COALESCE(amount_saved, 0)
        ELSE 0
      END AS pocket_balance
    FROM pockets
    WHERE status = 'active'
  ) pocket_data
  GROUP BY user_id, currency
),
user_currencies AS (
  SELECT user_id, currency FROM account_totals
  UNION
  SELECT user_id, currency FROM pocket_totals
)
SELECT
  pr.id AS user_id,
  c.currency,
  COALESCE(at.total_accounts_balance, 0::numeric) AS total_accounts_balance,
  COALESCE(pt.pockets_current_balance, 0::numeric) AS pockets_current_balance,
  COALESCE(pt.expense_pockets_balance, 0::numeric) AS expense_pockets_balance,
  COALESCE(pt.saving_pockets_balance, 0::numeric) AS saving_pockets_balance,
  (
    COALESCE(at.total_accounts_balance, 0::numeric)
    - COALESCE(pt.pockets_current_balance, 0::numeric)
  ) AS available_balance
FROM profiles pr
JOIN user_currencies c ON c.user_id = pr.id
LEFT JOIN account_totals at ON at.user_id = c.user_id AND at.currency = c.currency
LEFT JOIN pocket_totals pt ON pt.user_id = c.user_id AND pt.currency = c.currency;

COMMENT ON VIEW user_balance_by_currency IS 'Resumen por usuario/moneda que expone cuentas, bolsas y disponible';

-- ============================================
-- VERIFICACIÓN (opcional)
-- ============================================
-- SELECT * FROM user_balance_by_currency WHERE user_id = '...' LIMIT 5;
