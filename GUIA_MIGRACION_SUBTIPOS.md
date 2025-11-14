# 🔄 Guía de Migración: Actualización de Subtipos de Expense

## 📋 Resumen

Esta migración actualiza la arquitectura de subtipos de gastos (`expense`):

**ANTES:**
```
expense.variable  → Gasto variable (REDUNDANTE con period)
expense.fixed     → Gasto fijo mensual
expense.period    → Período personalizado
expense.shared    → Gastos compartidos (futuro)
```

**DESPUÉS:**
```
expense.period     → Presupuesto con período inicio/fin
expense.recurrent  → Vencimiento mensual + monto variable (NUEVO)
expense.fixed      → Vencimiento mensual + monto fijo
expense.shared     → Gastos compartidos (futuro)
```

---

## 🎯 Qué hace la migración

1. ✅ Agrega campos para `expense.recurrent`:
   - `average_amount`
   - `last_payment_amount`
   - `notification_days_before`

2. ✅ Actualiza constraint de subtipos:
   - Elimina `'variable'`
   - Agrega `'recurrent'`

3. ✅ Migra datos existentes:
   - `'variable'` → `'period'`

4. ✅ Actualiza vista `pocket_summary`:
   - Cambia referencia de `'variable'` a `'period'`
   - Agrega campos de `'recurrent'`

5. ✅ Actualiza comentarios de documentación

---

## 🚀 Cómo Aplicar (2 métodos)

### Método 1: Desde Supabase Dashboard (Recomendado)

1. Ir a tu proyecto en [Supabase](https://app.supabase.com)
2. Ir a **SQL Editor** (menú lateral izquierdo)
3. Crear nueva query
4. Copiar todo el contenido de `supabase/migrations/004_update_expense_subtypes.sql`
5. Pegar en el editor
6. Click en **Run** (o `Ctrl+Enter`)
7. Verificar que aparezca: `"Migración de subtipos completada exitosamente"`

### Método 2: Desde CLI (Supabase CLI)

```bash
# Si tienes Supabase CLI instalado
cd /home/fran/Documents/DTE/ffs.finance

# Aplicar migración
supabase db push

# O aplicar archivo específico
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/004_update_expense_subtypes.sql
```

---

## ✅ Verificación

Después de aplicar la migración, verifica que todo funcionó:

### 1. Verificar constraint actualizado

```sql
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'pockets_subtype_check';
```

**Resultado esperado:**
```
check_clause: ((type = 'expense' AND subtype IN ('period', 'recurrent', 'fixed', 'shared')) OR (type IN ('saving', 'debt') AND subtype IS NULL))
```

### 2. Verificar campos agregados

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'pockets' 
  AND column_name IN ('average_amount', 'last_payment_amount', 'notification_days_before');
```

**Resultado esperado:**
```
average_amount              | numeric | NULL
last_payment_amount         | numeric | NULL
notification_days_before    | integer | 3
```

### 3. Verificar migración de datos

```sql
SELECT 
  subtype,
  COUNT(*) as count
FROM pockets
WHERE type = 'expense'
GROUP BY subtype;
```

**Resultado esperado:**
- ✅ NO debe haber ningún `'variable'`
- ✅ Los que eran `'variable'` ahora son `'period'`

### 4. Verificar vista actualizada

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'pocket_summary' 
  AND column_name IN ('average_amount', 'last_payment_amount', 'notification_days_before');
```

**Resultado esperado:** Debe retornar las 3 columnas

---

## 🔧 Rollback (Si algo sale mal)

Si necesitas revertir los cambios:

```sql
-- 1. Revertir constraint
ALTER TABLE pockets DROP CONSTRAINT IF EXISTS pockets_subtype_check;
ALTER TABLE pockets ADD CONSTRAINT pockets_subtype_check CHECK (
  (type = 'expense' AND subtype IN ('variable', 'fixed', 'period', 'shared')) OR
  (type IN ('saving', 'debt') AND subtype IS NULL)
);

-- 2. Revertir migración de datos
UPDATE pockets
SET subtype = 'variable'
WHERE type = 'expense' AND subtype = 'period' AND allocated_amount IS NOT NULL;

-- 3. Eliminar campos (opcional, puedes dejarlos)
ALTER TABLE pockets DROP COLUMN IF EXISTS average_amount;
ALTER TABLE pockets DROP COLUMN IF EXISTS last_payment_amount;
ALTER TABLE pockets DROP COLUMN IF EXISTS notification_days_before;
```

---

## 📝 Impacto en Frontend

### Archivos TypeScript que debes actualizar:

#### 1. `src/lib/types.ts` o `src/lib/types-new.ts`

```typescript
// ANTES
type ExpenseSubtype = 'variable' | 'fixed' | 'period' | 'shared'

// DESPUÉS
type ExpenseSubtype = 'period' | 'recurrent' | 'fixed' | 'shared'
```

```typescript
// AGREGAR nueva interface
interface ExpenseRecurrentPocket extends ExpensePocketBase {
  subtype: 'recurrent'
  average_amount: number
  spent_amount: number
  due_day: number
  last_payment_amount?: number
  notification_days_before?: number
  next_payment: string
}
```

#### 2. Componentes que usan `subtype === 'variable'`

Buscar y reemplazar:

```bash
# Buscar archivos que usen 'variable'
grep -r "subtype === 'variable'" src/

# Reemplazar por 'period'
# O ajustar lógica según el caso
```

#### 3. `PocketEditor.tsx` o similar

Actualizar opciones de selección:

```typescript
const subtypeOptions = [
  { value: 'period', label: 'Por Período', description: 'Presupuesto con inicio/fin' },
  { value: 'recurrent', label: 'Recurrente Variable', description: 'Vence cada mes, monto varía' },
  { value: 'fixed', label: 'Fijo Mensual', description: 'Vence cada mes, mismo monto' },
  { value: 'shared', label: 'Compartido', description: 'Dividir entre personas' }
]
```

---

## 🧪 Testing

Después de actualizar el frontend, prueba:

### 1. Crear bolsa `period`
```
✅ Nombre: "Comida Febrero"
✅ Presupuesto: 10000
✅ Desde: 01/02/2025
✅ Hasta: 28/02/2025
✅ Debe calcular daily_allowance automáticamente
```

### 2. Crear bolsa `recurrent`
```
✅ Nombre: "Luz"
✅ Presupuesto estimado: 2500
✅ Vence el día: 10
✅ Notificar: 3 días antes
✅ Debe calcular next_payment automáticamente
```

### 3. Crear bolsa `fixed`
```
✅ Nombre: "Alquiler"
✅ Monto mensual: 15000
✅ Vence el día: 1
✅ Auto-registrar: true
✅ Debe calcular next_payment automáticamente
```

---

## 📊 Diferencias Clave

### ¿Cuándo usar cada subtipo?

| Subtipo | Caso de uso | Campos clave |
|---------|-------------|--------------|
| **period** | Presupuesto para período específico (comida, viaje) | `starts_at`, `ends_at`, `allocated_amount` |
| **recurrent** | Gasto mensual variable (luz, agua, teléfono) | `due_day`, `average_amount`, `notification_days_before` |
| **fixed** | Gasto mensual fijo (alquiler, Netflix) | `due_day`, `monthly_amount`, `auto_register` |
| **shared** | Gasto dividido entre personas | `split_type`, `participants` |

---

## ⚠️ Notas Importantes

1. **Backup**: Aunque la migración es segura, siempre es buena idea hacer backup de tu base de datos antes
2. **Datos existentes**: Todos los `'variable'` se migran automáticamente a `'period'`
3. **Frontend**: Recuerda actualizar el frontend después de aplicar la migración
4. **Validación**: Los nuevos campos son opcionales (`NULL` permitido)

---

## 📚 Documentación Relacionada

- `ARQUITECTURA-SUBTIPOS-GASTOS.md` - Explicación detallada de cada subtipo
- `NUEVA-ARQUITECTURA-BOLSAS.md` - Sistema completo de bolsas
- `README_NUEVA_ARQUITECTURA.md` - Resumen ejecutivo

---

## ❓ FAQ

**P: ¿Perderé datos al aplicar esta migración?**  
R: No, la migración solo renombra `'variable'` a `'period'` y agrega nuevos campos opcionales.

**P: ¿Puedo tener bolsas con el subtipo antiguo `'variable'`?**  
R: No, después de la migración solo existen: `period`, `recurrent`, `fixed`, `shared`.

**P: ¿Qué pasa si ya tengo bolsas `'period'`?**  
R: No hay problema, la migración solo afecta a las que tengan `'variable'`.

**P: ¿Necesito actualizar mi frontend inmediatamente?**  
R: Sí, porque el constraint de la DB ya no permitirá crear bolsas con `subtype='variable'`.

---

**Última actualización:** 2025-11-14
