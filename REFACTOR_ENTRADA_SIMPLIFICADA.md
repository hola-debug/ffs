# 🎯 Refactorización: Entrada Simplificada de Bolsas

## 📋 Resumen del Cambio

Se ha refactorizado el sistema de entrada de datos para **minimizar la carga del usuario** y hacer que el sistema sea **más inteligente**.

### Filosofía: "El usuario ingresa LO MÍNIMO, el sistema calcula el resto"

---

## 🔄 Cambios Implementados

### 1. **EXPENSE.PERIOD** - Gasto por Período

#### ✅ Antes:
- Usuario debía ingresar: `starts_at` + `ends_at` (2 fechas)
- Sistema calculaba: `days_duration`

#### ✅ Ahora:
Usuario puede elegir **una de dos opciones**:

**OPCIÓN A: Por días (más simple)**
- Ingresa: `periodDaysDuration` (ej: 30)
- Sistema calcula: `starts_at = HOY`, `ends_at = HOY + 30 días`

**OPCIÓN B: Por fechas (para casos específicos)**
- Ingresa: `starts_at` + `ends_at`
- Sistema calcula: `days_duration`

#### Campos UI nuevos:
- `periodDateMode`: 'days' | 'dates' (selector de modo)
- `periodDaysDuration`: número de días

---

### 2. **SAVING** - Bolsa de Ahorro

#### ✅ Antes:
- Usuario debía ingresar: `starts_at` (siempre hoy) + `ends_at` (opcional)

#### ✅ Ahora:
Usuario puede elegir **una de dos opciones**:

**OPCIÓN A: Por días**
- Ingresa: `savingDaysDuration` (ej: 180 días = 6 meses)
- Sistema calcula: `starts_at = HOY`, `ends_at = HOY + 180 días`

**OPCIÓN B: Por fecha límite**
- Ingresa: `ends_at`
- Sistema calcula: `starts_at = HOY`

**OPCIÓN C: Sin fecha límite**
- No ingresa nada
- Sistema: `starts_at = HOY`, sin `ends_at`

#### Campos UI nuevos:
- `savingDateMode`: 'days' | 'dates'
- `savingDaysDuration`: número de días

#### Bonus:
- Se calcula automáticamente la **contribución recomendada** según frecuencia y tiempo

---

### 3. **DEBT** - Bolsa de Deuda

#### ✅ Antes:
- Usuario debía ingresar: `installments_total` + `installment_amount`
- Ambos campos eran editables (confuso)

#### ✅ Ahora:
Usuario puede elegir **una de dos opciones**:

**OPCIÓN A: Sé cuántas cuotas son**
- Ingresa: `installments_total` (ej: 12)
- Sistema calcula: `installment_amount = original_amount / 12`

**OPCIÓN B: Sé cuánto pago por cuota**
- Ingresa: `installment_amount` (ej: 9000)
- Sistema calcula: `installments_total = CEIL(original_amount / 9000)`

#### Campos UI nuevos:
- `debtInputMode`: 'installments' | 'amount'

#### Bonus:
- Se muestra un **resumen visual** con total a pagar e intereses

---

## 🎨 Mejoras de UX

### 1. **Selectores de Modo**
Cada tipo de bolsa ahora tiene botones toggle visuales para elegir el modo de entrada:

```tsx
<button className={modo === 'days' ? 'activo' : 'inactivo'}>
  Por días
</button>
<button className={modo === 'dates' ? 'activo' : 'inactivo'}>
  Por fechas
</button>
```

### 2. **Previews en Tiempo Real**
- **EXPENSE.PERIOD**: Muestra duración y presupuesto diario
- **SAVING**: Muestra contribución recomendada
- **DEBT**: Muestra resumen con total e intereses

### 3. **Campos Deshabilitados Inteligentes**
Los campos auto-calculados se muestran **deshabilitados** con placeholder "Auto-calculado"

---

## 🗂️ Archivos Modificados

### Frontend (React/TypeScript)

#### 1. `types.ts`
```typescript
// Nuevos tipos
export type DateInputMode = 'days' | 'dates';
export type DebtInputMode = 'installments' | 'amount';

// Nuevos campos en PocketFormState
periodDateMode: DateInputMode;
periodDaysDuration: string;
savingDateMode: DateInputMode;
savingDaysDuration: string;
debtInputMode: DebtInputMode;
```

#### 2. `ExpensePeriodFields.tsx`
- ✅ Selector de modo (días vs fechas)
- ✅ Preview con duración y daily_allowance
- ✅ Cálculo en tiempo real con `useMemo`

#### 3. `SavingFields.tsx`
- ✅ Selector de modo (días vs fecha)
- ✅ Preview con contribución recomendada
- ✅ Soporte para ahorro sin fecha límite

#### 4. `DebtFields.tsx`
- ✅ Selector de modo (cuotas vs monto)
- ✅ Auto-cálculo con `useEffect`
- ✅ Preview con resumen de deuda e intereses

#### 5. `usePocketSubmit.ts`
- ✅ Lógica actualizada en `buildPocketData()`
- ✅ Envía `days_duration` O fechas según modo
- ✅ Comentarios explicando qué se calcula en BD

#### 6. `useCreateWizard.ts`
- ✅ Valores iniciales para nuevos campos
- ✅ `periodDateMode: 'days'` por defecto
- ✅ `savingDateMode: 'days'` por defecto
- ✅ `debtInputMode: 'installments'` por defecto

---

### Backend (SQL/Supabase)

#### `004_update_trigger_simplified_input.sql`
Trigger actualizado para soportar 3 modos de entrada:

**CASO 1: Usuario ingresó `days_duration`**
```sql
IF NEW.days_duration IS NOT NULL THEN
  NEW.starts_at := CURRENT_DATE;
  NEW.ends_at := NEW.starts_at + (NEW.days_duration || ' days')::INTERVAL;
END IF;
```

**CASO 2: Usuario ingresó fechas**
```sql
ELSIF NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL THEN
  NEW.days_duration := (NEW.ends_at - NEW.starts_at)::INT + 1;
END IF;
```

**CASO 3: Saving sin fecha límite**
```sql
ELSIF NEW.starts_at IS NULL AND NEW.type = 'saving' THEN
  NEW.starts_at := CURRENT_DATE;
END IF;
```

**DEBT: Auto-cálculo de cuotas**
```sql
-- Opción A: Usuario ingresó cantidad de cuotas
IF NEW.installments_total IS NOT NULL AND NEW.installment_amount IS NULL THEN
  NEW.installment_amount := ROUND((NEW.original_amount / NEW.installments_total)::NUMERIC, 2);

-- Opción B: Usuario ingresó monto por cuota
ELSIF NEW.installment_amount IS NOT NULL AND NEW.installments_total IS NULL THEN
  NEW.installments_total := CEIL((NEW.original_amount / NEW.installment_amount)::NUMERIC);
END IF;
```

---

## 📊 Comparación Visual

### Antes (Complejo)
```
┌─────────────────────────────────┐
│ Nueva Bolsa de Gasto            │
├─────────────────────────────────┤
│ Monto: [______]                 │
│ Desde: [01/02/2025]  ❌ Confuso │
│ Hasta: [28/02/2025]  ❌ Confuso │
└─────────────────────────────────┘
```

### Ahora (Simple)
```
┌─────────────────────────────────┐
│ Nueva Bolsa de Gasto            │
├─────────────────────────────────┤
│ Monto: [______]                 │
│                                 │
│ ○ Por días  ● Por fechas        │
│                                 │
│ Cantidad de días: [30]          │
│ 💡 Durará 30 días ($333/día)    │
└─────────────────────────────────┘
```

---

## 🚀 Cómo Probar

### 1. Ejecutar migración SQL
```bash
# En Supabase SQL Editor
supabase/migrations/004_update_trigger_simplified_input.sql
```

### 2. Crear bolsa EXPENSE.PERIOD
1. Abrir modal de crear bolsa
2. Seleccionar "Gasto" → "Por período"
3. Ver selector "¿Cómo quieres definir el período?"
4. Elegir "Por días"
5. Ingresar: Monto $10,000 + 30 días
6. Ver preview: "Duración: 30 días • Presupuesto diario: $333.33"
7. Guardar
8. Verificar en BD: `starts_at = HOY`, `ends_at = HOY + 30 días`

### 3. Crear bolsa SAVING
1. Seleccionar "Ahorro"
2. Ingresar: Objetivo $50,000
3. Frecuencia: Mensual
4. Ver selector de fecha límite
5. Elegir "Por días" → 180 días
6. Ver preview: "Aporte mensual sugerido: $8,333 (6 meses)"

### 4. Crear bolsa DEBT
1. Seleccionar "Deuda"
2. Ingresar: Monto total $100,000
3. Ver selector "¿Qué dato conoces?"
4. Elegir "Cantidad de cuotas" → 12
5. Ver campo "Monto por cuota" deshabilitado con valor $8,333.33
6. Ver preview: "12 cuotas de $8,333.33 • Total: $100,000"

---

## ✅ Beneficios

1. **Menos trabajo para el usuario**: Solo ingresa lo que sabe
2. **Más intuitivo**: Selector visual de modo de entrada
3. **Menos errores**: Cálculos automáticos en BD
4. **Mejor feedback**: Previews en tiempo real
5. **Más flexible**: Soporta múltiples flujos de entrada
6. **Más inteligente**: Sistema calcula lo que falta

---

## 📝 Próximos Pasos (Opcional)

1. ✅ Agregar validaciones en frontend antes de submit
2. ✅ Agregar tooltips explicativos en selectores
3. ✅ Agregar animaciones de transición entre modos
4. ✅ Agregar tests unitarios para cálculos
5. ✅ Actualizar documentación de usuario

---

**¿Dudas?** Todos los cálculos se hacen en el trigger `calculate_pocket_period_fields()` de Supabase. El frontend solo envía lo mínimo necesario y la BD completa el resto.
