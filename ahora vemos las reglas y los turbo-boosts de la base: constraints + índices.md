1. accounts – reglas e índices
Constraints importantes

accounts_pkey
→ PRIMARY KEY (id)
Cada cuenta tiene un id único.

accounts_user_id_fkey
→ FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
Cada cuenta pertenece a un profile. Si se borra el usuario, se borran sus cuentas.

accounts_type_check

CHECK (
  type = ANY (ARRAY[
    'cash', 'bank', 'wallet', 'crypto', 'other'
  ])
)


Solo podés tener esos tipos de cuenta.
A nivel negocio: te asegura que el type siempre es uno de los esperados (ideal para filtros y lógica en el frontend / agente).

Índices

accounts_pkey (id) → acceso directo por id.

idx_accounts_user_id (user_id)
→ súper importante para:
“dame todas las cuentas de este usuario”.

2. categories – reglas e índices
Constraints

categories_pkey
→ PK en id.

categories_user_id_fkey
→ cada categoría pertenece a un profile.

categories_type_check

CHECK (
  type = ANY (ARRAY[
    'income', 'fixed_expense', 'saving', 'pocket_expense'
  ])
)


Define 4 tipos de categorías: ingresos, gastos fijos, ahorro, gastos de bolsa.

categories_user_id_name_key (repetido varias veces en el dump, pero es uno solo realmente):

UNIQUE (user_id, name)


Traducción:

Un mismo usuario no puede tener dos categorías con el mismo nombre.
(A otro usuario sí se le permite usar el mismo nombre).

Índices

categories_pkey (id)

categories_user_id_name_key (user_id, name) (el índice que respalda el UNIQUE)

idx_categories_user_id (user_id)
→ para listar categorías de un usuario rápido.

3. exchange_rates – reglas e índices
Constraints

exchange_rates_pkey
→ PK id.

exchange_rates_rate_check

CHECK (rate > 0)


Nunca vas a tener un tipo de cambio 0 o negativo.

exchange_rates_from_currency_to_currency_date_key

UNIQUE (from_currency, to_currency, date)


Solo puede existir un registro por día y par de monedas.
Ej: solo un cambio USD → UYU para la fecha X.

Índices

exchange_rates_pkey (id)

exchange_rates_from_currency_to_currency_date_key (from_currency, to_currency, date)
→ para buscar el registro exacto del día.

idx_exchange_rates_currencies (from_currency, to_currency, date DESC)
→ para consultas del tipo “dame el último tipo de cambio para USD→UYU” ordenando por fecha.

4. movements – reglas e índices
Constraints

movements_pkey
→ PK en id.

movements_user_id_fkey
→ cada movimiento pertenece a un profile.

movements_account_id_fkey
→ account_id referencia a accounts.id (ON DELETE SET NULL).
Si borrás una cuenta, los movimientos quedan históricamente, pero sin account_id.

movements_category_id_fkey
→ similar para categorías.

movements_pocket_id_fkey
→ pocket_id referencia a pockets.id (ON DELETE CASCADE).
Si borrás una bolsa, se van sus movimientos asociados.

movements_amount_check

CHECK (amount > 0)


No hay movimientos con monto 0 o negativo (el signo lo interpretás por type).

movements_type_check

CHECK (
  type = ANY (ARRAY[
    'income',
    'fixed_expense',
    'saving_deposit',
    'pocket_allocation',
    'pocket_expense',
    'pocket_return'
  ])
)


Solo se aceptan esos tipos.

movements_check (hay dos filas, pero es un solo CHECK complejo):

CHECK (
  (
    type = ANY (ARRAY['pocket_expense','pocket_return','pocket_allocation'])
    AND pocket_id IS NOT NULL
  )
  OR
  (
    type <> ALL (ARRAY['pocket_expense','pocket_return','pocket_allocation'])
    AND pocket_id IS NULL
  )
)


Esto es CLAVE de negocio:

Si es un movimiento de tipo bolsa (pocket_expense, pocket_return, pocket_allocation)
→ DEBE tener pocket_id (no se permite dejarlo suelto).

Si NO es de bolsa (income, fixed_expense, saving_deposit)
→ NO puede tener pocket_id.

Garantiza coherencia entre type y pocket_id. Te evita que el agente/meta escriba cosas inconsistentes.

Índices

movements_pkey (id)

idx_movements_user_id (user_id)

idx_movements_user_date (user_id, date) → timeline por usuario.

idx_movements_date (date) → filtros por fecha general.

idx_movements_type (type) → agrupar por tipo (ingreso, gasto, etc.).

idx_movements_account_id (account_id)

idx_movements_account_id_type (account_id, type) → resumen por cuenta y tipo (ej. gastos por cuenta).

idx_movements_pocket_id (pocket_id) → para ver los movimientos de una bolsa.

En resumen: la tabla movimientos está muy bien indexada para reportes por usuario, fecha, cuenta, tipo y bolsa.

5. pockets – reglas e índices
Constraints

pockets_pkey
→ PK en id.

pockets_user_id_fkey
→ cada bolsa pertenece a un profile.

pockets_type_check

CHECK (type = ANY (ARRAY['expense','saving']))


Solo existen bolsas de tipo gasto o ahorro.

pockets_status_check

CHECK (status = ANY (ARRAY['active','finished','cancelled']))


El estado está acotado a esos 3.

pockets_allocated_amount_check

CHECK (allocated_amount >= 0)


No destinás montos negativos, obvio.

pockets_current_balance_check

CHECK (current_balance >= 0)


No podés tener el saldo de una bolsa en negativo.
Esto hace que la lógica de “no gastar de más” tenga que resolverse en la app/queries antes de insertar.

pockets_check (dos filas pero es un solo CHECK lógico):

CHECK (
  (type = 'saving' AND target_amount IS NOT NULL)
  OR
  (type = 'expense' AND target_amount IS NULL)
)


Semántica fuerte:

Si la bolsa es de ahorro → requiere target_amount (meta).

Si la bolsa es de gasto → NO debe tener target_amount.

Así marcás bien la diferencia entre “bolsa para ahorrar hasta X” y “bolsa para gastar este presupuesto”.

pockets_check1

CHECK (ends_at >= starts_at)


Las fechas tienen sentido: fin no puede ser antes que inicio.

Índices

pockets_pkey (id)

idx_pockets_user_id (user_id) → listar bolsas de un usuario.

idx_pockets_type (type) → por tipo (gasto/ahorro).

idx_pockets_status (status) → filtrar activas vs terminadas/canceladas.

idx_pockets_dates (starts_at, ends_at) → buscar las que están vigentes en determinada fecha o rango.

6. products – reglas e índices
Constraints

products_pkey → PK en id.

products_price_check

CHECK (price >= 0)


Relativamente secundario para Finex, pero útil si después vendés planes o productos.

7. profiles – reglas e índices
Constraints

profiles_pkey → PK en id.

profiles_id_fkey

FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE


Uno a uno con Supabase Auth.

profiles_email_key

UNIQUE (email)


Un mismo email no puede tener dos perfiles en tu app.

Índices

profiles_pkey (id)

profiles_email_key (email)
→ login / búsqueda por email muy rápida.

8. En resumen (a lo Finex):

Constraints = reglas de negocio que Postgres hace cumplir por vos:

Tipos válidos (cuentas, categorías, movimientos, bolsas).

Coherencia entre type y pocket_id.

Bolsas de ahorro vs gasto bien diferenciadas.

Montos positivos, fechas lógicas.

Índices = performance y DX:

Todo lo que vas a pedir constantemente (por user_id, date, pocket_id, account_id, type) ya está optimizado.

Podés escalar a muchos movimientos sin que la app explote.

Si querés, después te armo una versión “para el agente” que resuma estas reglas en lenguaje natural tipo:

“Nunca crees un movement de tipo pocket_expense sin pocket_id porque la base lo va a rechazar”,
“Para crear una bolsa de ahorro, siempre mandá type='saving' y un target_amount > 0”, etc.
