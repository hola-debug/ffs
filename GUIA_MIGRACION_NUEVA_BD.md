# 📦 GUÍA: Migración de Base de Datos (Desde Cero)

## 🎯 Resumen

Esta guía te ayuda a configurar la base de datos de Finex desde cero con la arquitectura completa:

- ✅ Múltiples divisas por cuenta
- ✅ 3 tipos de bolsas: expense, saving, debt
- ✅ 4 subtipos de expense: **period**, **recurrent**, **fixed**, **shared**
- ✅ Triggers automáticos para cálculos
- ✅ Vistas SQL optimizadas

---

## 🚀 PASO 1: Ejecutar Migración SQL

### Opción A: Desde Supabase Dashboard (RECOMENDADO)

1. **Ir a Supabase**
   - Ve a [supabase.com](https://app.supabase.com)
   - Abre tu proyecto

2. **Abrir SQL Editor**
   - En el menú lateral izquierdo, busca "SQL Editor"
   - Haz clic en "New Query"

3. **Copiar y Pegar el SQL**
   - Abre el archivo en tu editor:
     ```
     supabase/migrations/003_refactor_pockets_with_divisas_and_subtypes.sql
     ```
   - Copia **TODO** el contenido (son ~450 líneas)
   - Pega en el editor SQL de Supabase

4. **Ejecutar**
   - Presiona el botón **"Run"** (o `Ctrl+Enter` / `Cmd+Enter`)
   - Espera a que termine (puede tardar 5-10 segundos)

5. **Verificar Éxito**
   - Deberías ver al final:
     ```
     ✓ MIGRACIÓN COMPLETADA EXITOSAMENTE
     ✓ account_currencies
     ✓ accounts (type)
     ✓ pockets (subtipos: period, recurrent, fixed, shared)
     ...
     ```

### Opción B: Desde Supabase CLI

Si tienes Supabase CLI instalado:

```bash
cd /home/fran/Documents/DTE/ffs.finance

# Verificar primero
supabase db push --dry-run

# Ejecutar
supabase db push
```

---

## ✅ PASO 2: Verificar que Todo Funcionó

En el SQL Editor de Supabase, ejecuta estas queries para confirmar:

### 2.1 Verificar Tablas

```sql
-- Debe mostrar: accounts, pockets, movements, account_currencies, etc.
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2.2 Verificar Vistas

```sql
-- Debe mostrar: pocket_summary, account_with_currencies
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public';
```

### 2.3 Verificar Funciones

```sql
-- Debe mostrar: calculate_recommended_contribution, calculate_next_payment
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION';
```

### 2.4 Verificar Triggers

```sql
-- Debe mostrar los 3 triggers de actualización automática
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

**Resultado esperado:**
```
trg_update_saving_pocket_balance    | movements
trg_update_expense_pocket_spent     | movements
trg_update_debt_pocket_remaining    | movements
```

### 2.5 Verificar Constraints de Subtipos

```sql
-- Verificar que los subtipos sean los correctos
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'pockets_subtype_check';
```

**Debe contener:** `'period', 'recurrent', 'fixed', 'shared'`

---

## 🎨 PASO 3: Actualizar Frontend (TypeScript)

### 3.1 Buscar Usos de Subtipos Antiguos

```bash
# Buscar referencias a 'variable' en el código
grep -r "subtype.*variable" src/ --include="*.ts" --include="*.tsx"

# Buscar tipos de expense
grep -r "ExpenseSubtype" src/ --include="*.ts" --include="*.tsx"
```

### 3.2 Actualizar Tipos TypeScript

En tu archivo de tipos (`src/lib/types.ts` o similar), actualizar:

```typescript
// ❌ ANTES (si existía)
type ExpenseSubtype = 'variable' | 'fixed' | 'period' | 'shared'

// ✅ DESPUÉS
type ExpenseSubtype = 'period' | 'recurrent' | 'fixed' | 'shared'
```

### 3.3 Agregar Interface para Recurrent

```typescript
interface ExpenseRecurrentPocket extends ExpensePocketBase {
  subtype: 'recurrent'
  average_amount: number
  spent_amount: number
  due_day: number
  last_payment_amount?: number
  notification_days_before?: number
  next_payment?: string
}
```

---

## 🧪 PASO 4: Probar la Configuración

### 4.1 Compilar Frontend

```bash
cd /home/fran/Documents/DTE/ffs.finance
npm run build
```

**Si hay errores TypeScript**, significa que hay código usando los tipos antiguos. Busca y actualiza.

### 4.2 Probar Inserción de Datos (SQL)

Desde Supabase SQL Editor, prueba crear datos de ejemplo:

```sql
-- 1. Crear cuenta de prueba
INSERT INTO accounts (user_id, name, type, balance, currency)
VALUES (auth.uid(), 'Banco Prueba', 'bank', 50000, 'UYU')
RETURNING id;

-- 2. Crear bolsa expense.period
INSERT INTO pockets (
  user_id, 
  name, 
  type, 
  subtype,
  allocated_amount,
  starts_at,
  ends_at,
  currency
)
VALUES (
  auth.uid(),
  'Comida Febrero',
  'expense',
  'period',
  10000,
  '2025-02-01',
  '2025-02-28',
  'UYU'
)
RETURNING id, name, subtype;

-- 3. Crear bolsa expense.recurrent
INSERT INTO pockets (
  user_id,
  name,
  type,
  subtype,
  average_amount,
  due_day,
  notification_days_before,
  currency
)
VALUES (
  auth.uid(),
  'Luz',
  'expense',
  'recurrent',
  2500,
  10,
  3,
  'UYU'
)
RETURNING id, name, subtype;

-- 4. Verificar vista pocket_summary
SELECT 
  name,
  type,
  subtype,
  allocated_amount,
  average_amount,
  due_day
FROM pocket_summary
WHERE user_id = auth.uid();
```

**Si todo funciona correctamente**, deberías ver tus bolsas con los campos calculados.

---

## 📋 CHECKLIST DE VERIFICACIÓN

Marca cada item al completarlo:

### Base de Datos
- [ ] Migración SQL ejecutada sin errores
- [ ] Tabla `account_currencies` creada
- [ ] Tabla `pockets` tiene columnas: `subtype`, `average_amount`, `notification_days_before`, etc.
- [ ] Vista `pocket_summary` funciona
- [ ] Vista `account_with_currencies` funciona
- [ ] Funciones `calculate_*` existen
- [ ] Triggers están activos
- [ ] RLS policies configuradas

### Frontend
- [ ] Tipos TypeScript actualizados (no hay 'variable')
- [ ] Compilación sin errores (`npm run build`)
- [ ] No hay referencias a `subtype: 'variable'` en el código

### Pruebas
- [ ] Puedo crear una cuenta
- [ ] Puedo crear una bolsa `expense.period`
- [ ] Puedo crear una bolsa `expense.recurrent`
- [ ] Puedo crear una bolsa `expense.fixed`
- [ ] Puedo crear una bolsa `saving`
- [ ] Los campos calculados funcionan (daily_allowance, next_payment, etc.)

---

## 🐛 TROUBLESHOOTING

### Error: "relation already exists"

**Causa:** Ya ejecutaste la migración antes

**Solución:** 
La migración usa `CREATE TABLE IF NOT EXISTS`, así que es seguro ejecutarla de nuevo. Si quieres empezar de cero:

```sql
-- ⚠️ ESTO BORRA TODO
DROP TABLE IF EXISTS account_currencies CASCADE;
DROP TABLE IF EXISTS pockets CASCADE;
DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- Luego ejecuta la migración de nuevo
```

### Error: "constraint already exists"

**Solución:** La migración ya maneja esto con `DROP CONSTRAINT IF EXISTS`, ignora el error.

### Error: "function calculate_next_payment already exists"

**Solución:** La migración usa `CREATE OR REPLACE FUNCTION`, ignora el error.

### Los triggers no funcionan

```sql
-- Verificar que existen
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Si no aparecen, ejecuta manualmente la sección de TRIGGERS del archivo SQL
```

---

## 📚 Arquitectura Final

### Tipos de Bolsas

```
expense
├── period      → Presupuesto con inicio/fin (comida mensual, viajes)
├── recurrent   → Vence mensualmente, monto variable (luz, agua, teléfono)
├── fixed       → Vence mensualmente, monto fijo (alquiler, Netflix)
└── shared      → Gastos compartidos (futuro)

saving
└── (sin subtipos) → Objetivo de ahorro

debt
└── (sin subtipos) → Deuda con cuotas
```

### Campos por Subtipo

**expense.period:**
- `allocated_amount`, `spent_amount`
- `starts_at`, `ends_at`
- `daily_allowance` (calculado)

**expense.recurrent:**
- `average_amount`, `spent_amount`
- `due_day`, `last_payment_amount`
- `notification_days_before`
- `next_payment` (calculado)

**expense.fixed:**
- `monthly_amount`
- `due_day`, `auto_register`
- `next_payment` (calculado)

**saving:**
- `target_amount`, `amount_saved`
- `frequency`, `allow_withdrawals`
- `progress_percentage` (calculado)

**debt:**
- `original_amount`, `remaining_amount`
- `installments_total`, `installment_current`
- `installment_amount`, `interest_rate`

---

## 📞 Próximos Pasos

Una vez completada la migración:

1. Actualizar componentes de UI para crear/editar bolsas
2. Implementar notificaciones para `expense.recurrent` (antes del vencimiento)
3. Implementar auto-registro para `expense.fixed`
4. Crear dashboard con resumen por tipo/subtipo
5. Agregar gráficos y análisis

---

## 🔗 Referencias

- **Migración SQL completa:** `supabase/migrations/003_refactor_pockets_with_divisas_and_subtypes.sql`
- **Arquitectura de subtipos:** `ARQUITECTURA-SUBTIPOS-GASTOS.md`
- **Sistema de bolsas:** `NUEVA-ARQUITECTURA-BOLSAS.md`
- **Documentación Supabase:** https://supabase.com/docs

---

**¡Tu base de datos está lista! 🚀**

Si algo falla, revisa la sección de Troubleshooting o consulta los archivos de documentación.
