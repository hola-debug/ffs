# 🎒 Nueva Arquitectura: Sistema de Bolsas

## 📋 Resumen del Cambio

**Antes (Períodos):**
- Sistema basado en "períodos" que dividían el ingreso
- Concepto confuso y limitado

**Ahora (Bolsas):**
- Sistema de **BOLSAS DE DINERO** que se separan del ingreso
- Tres tipos: **Bolsas de Gasto**, **Bolsas de Ahorro** y **Bolsas de Deuda**
- Subtipos de gasto: **period**, **recurrent**, **fixed**, **shared**
- Flujo de dinero más claro y natural

---

## 🌊 Flujo de Dinero

```
INGRESOS (cuando llegan)
    ↓
CUENTAS (balance dinámico por cuenta/moneda)
    • Banco BROU: 50,000 UYU
    • PayPal: 100 USD
    • Efectivo: 5,000 UYU
    ↓
DISPONIBLE = SUM(cuentas) - SUM(bolsas activas)
    ↓
BOLSAS (expense/saving/debt)
    • Comida (expense.period, 8,000 UYU / 30d)
    • Luz/Agua (expense.recurrent, vence día 10, ~2,500 UYU)
    • Alquiler (expense.fixed, 15,000 UYU)
    • Vacaciones (saving, objetivo 10,000 UYU)
    • Tarjeta (debt, restante 5,000 UYU)

Al finalizar, si sobra dinero (expense/saving) → vuelve al disponible
```

---

## 🎯 Conceptos Clave

### 1. **Cuentas e ingresos dinámicos**
- Los ingresos se registran como movimientos de tipo `income` en cuentas
- El balance de cada cuenta se actualiza automáticamente

### 2. **Disponible**
```
DISPONIBLE = SUM(balance de cuentas) - SUM(saldo en bolsas activas)
```

### 3. **Bolsas (Pockets)**

Son separaciones del dinero disponible con un objetivo específico (todo gasto/ahorro/deuda se modela como una bolsa):
- Tipos: `expense`, `saving`, `debt`
- Subtipos de `expense`: `period`, `recurrent`, `fixed`, `shared` (futuro)

#### 🛍️ Bolsas de GASTO (`type: 'expense'`)
Separo dinero para gastar con diferentes modalidades según el subtipo.

**1. EXPENSE.PERIOD** (`subtype: 'period'`) - Gasto con período definido
- Para gastos con inicio/fin específico
- Cálculo automático de cuota diaria
- Ejemplos: comida mensual, viajes, gastos de fin de semana

```typescript
{
  name: "Comida Febrero",
  type: "expense",
  subtype: "period",
  allocated_amount: 10000,
  spent_amount: 3500,
  starts_at: "2025-02-01",
  ends_at: "2025-02-28",
  days_duration: 28,
  daily_allowance: 357  // 10000 / 28
}
```

**2. EXPENSE.RECURRENT** (`subtype: 'recurrent'`) - Gasto mensual variable
- Para gastos que vencen mensualmente pero el monto varía
- Notificaciones automáticas antes del vencimiento
- Ejemplos: luz, agua, teléfono, gas

```typescript
{
  name: "Luz",
  type: "expense",
  subtype: "recurrent",
  average_amount: 2500,
  spent_amount: 2350,
  due_day: 10,  // Vence el 10 de cada mes
  last_payment_amount: 2350,
  notification_days_before: 3,
  next_payment: "2025-02-10"
}
```

**3. EXPENSE.FIXED** (`subtype: 'fixed'`) - Gasto mensual fijo
- Para gastos que siempre son el mismo monto
- Puede auto-registrarse automáticamente
- Ejemplos: alquiler, Netflix, suscripciones

```typescript
{
  name: "Alquiler",
  type: "expense",
  subtype: "fixed",
  monthly_amount: 15000,
  due_day: 1,
  auto_register: true,  // Se registra automáticamente
  last_payment: "2025-01-01",
  next_payment: "2025-02-01"
}
```

**4. EXPENSE.SHARED** (`subtype: 'shared'`) - Gasto compartido (futuro)
- Para gastos divididos entre varias personas
- Seguimiento de quién pagó y quién debe
- Ejemplos: alquiler compartido, cena dividida

```typescript
{
  name: "Alquiler Compartido",
  type: "expense",
  subtype: "shared",
  allocated_amount: 20000,
  split_type: "equal",  // o "percentage"
  participants: ["user_1", "user_2"]
}
```

#### 🐷 Bolsas de AHORRO (`type: 'saving'`)
- Separo dinero para cumplir un objetivo
- Tiene un monto objetivo a alcanzar
- Voy agregando dinero progresivamente
- Al finalizar, el dinero puede volver o quedarse

**Ejemplo:**
```typescript
{
  name: "Viaje a la Playa",
  type: "saving",
  allocated_amount: 5000,   // Ya tengo ahorrado
  target_amount: 10000,      // Quiero llegar a esto
  starts_at: "2025-01-01",
  ends_at: "2025-06-01",
  progress_percentage: 50    // 50% completado
}
```

---

## 🗄️ Estructura de Base de Datos

### Tabla: `pockets` (Bolsas)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único |
| `name` | TEXT | Nombre de la bolsa |
| `type` | TEXT | `'expense'` o `'saving'` |
| `allocated_amount` | NUMERIC | Dinero asignado inicialmente |
| `current_balance` | NUMERIC | Saldo actual en la bolsa |
| `starts_at` | DATE | Fecha de inicio |
| `ends_at` | DATE | Fecha de fin |
| `days_duration` | INT | Días totales (calculado) |
| `daily_allowance` | NUMERIC | Gasto diario permitido (solo expense) |
| `target_amount` | NUMERIC | Objetivo de ahorro (solo saving) |
| `status` | TEXT | `'active'`, `'finished'`, `'cancelled'` |
| `auto_return_remaining` | BOOLEAN | ¿Devolver dinero restante? |

### Tabla: `movements` (Movimientos)

Reemplaza la tabla `transactions`. Tipos de movimientos (asociados a cuentas/bolsas):

| Tipo | Descripción |
|------|-------------|
| `income` | Ingreso a una cuenta |
| `pocket_allocation` | Asignación de dinero desde cuenta a una bolsa |
| `pocket_expense` | Gasto registrado desde una bolsa de tipo expense |
| `pocket_return` | Devolución de saldo de una bolsa a la cuenta/disponible |
| `saving_deposit` | Movimiento de aporte a una bolsa de ahorro (`saving`) |
| `fixed_expense_auto` | Registro automático del pago de una bolsa `expense.fixed` |
| `debt_payment` | Pago aplicado a una bolsa de deuda |
| `debt_interest` | Interés aplicado a una bolsa de deuda |

---

## 🔄 Ciclo de Vida de una Bolsa

### 1. **Creación** (`status: 'active'`)
```typescript
// Usuario crea una bolsa de gasto
const pocket = {
  name: "Comida",
  type: "expense",
  allocated_amount: 3000,
  starts_at: "2025-01-01",
  ends_at: "2025-01-15"
}

// Se crea un movement de tipo 'pocket_allocation'
// El available_balance del usuario disminuye
```

### 2. **Uso** (durante el período)
```typescript
// Usuario gasta desde la bolsa
const movement = {
  type: "pocket_expense",
  pocket_id: "...",
  amount: 150,
  category_id: "comida",
  description: "Supermercado"
}

// current_balance de la bolsa disminuye
```

### 3. **Finalización** (`status: 'finished'`)
```typescript
// Al llegar a ends_at, la bolsa se marca como 'finished'
// Si auto_return_remaining = true y current_balance > 0:
//   - Se crea un movement de tipo 'pocket_return'
//   - El dinero vuelve al available_balance
```

---

## 📊 Vistas SQL Útiles

### `active_pockets_summary`
Bolsas activas con información calculada:
- `days_elapsed`: Días transcurridos
- `days_remaining`: Días restantes
- `progress_percentage`: % de progreso (saving)
- `remaining_daily_allowance`: Cuánto puedo gastar hoy (expense)

### `user_monthly_summary`
Resumen financiero del mes:
- `fixed_expenses_month`: Total gastos fijos
- `saving_deposits_month`: Total ahorrado directamente
- `pockets_allocated_month`: Total asignado a bolsas
- `available_balance`: Dinero disponible sin asignar

---

## 🎨 Ejemplos de Uso

### Caso 1: Usuario con ingreso de $50,000

```typescript
// Configuración inicial
profile.monthly_income = 50000

// Gastos fijos (nivel ingreso)
movements = [
  { type: 'fixed_expense', amount: 15000, description: 'Alquiler' },
  { type: 'fixed_expense', amount: 3000, description: 'Servicios' },
  { type: 'fixed_expense', amount: 2000, description: 'Internet' }
]
// Total: -20,000

// Ahorro directo (nivel ingreso)
movements.push(
  { type: 'saving_deposit', amount: 10000, description: 'Fondo emergencia' }
)
// Total: -10,000

// DISPONIBLE = 50,000 - 20,000 - 10,000 = $20,000

// Crear bolsas desde el disponible
pockets = [
  {
    name: 'Comida Quincenal',
    type: 'expense',
    allocated_amount: 8000,
    starts_at: '2025-01-01',
    ends_at: '2025-01-15'
    // daily_allowance = 533.33/día
  },
  {
    name: 'Nueva Laptop',
    type: 'saving',
    allocated_amount: 5000,
    target_amount: 25000,
    starts_at: '2025-01-01',
    ends_at: '2025-06-01'
    // progress = 20%
  },
  {
    name: 'Salidas',
    type: 'expense',
    allocated_amount: 4000,
    starts_at: '2025-01-01',
    ends_at: '2025-01-31'
    // daily_allowance = 129.03/día
  }
]

// DISPONIBLE SIN ASIGNAR = 20,000 - 17,000 = $3,000
```

---

## 🚀 Migración desde el Sistema Anterior

### Paso 1: Eliminar tablas antiguas
```sql
-- BACKUP PRIMERO!!!
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS periods CASCADE;
DROP TABLE IF EXISTS savings_vaults CASCADE;
DROP TABLE IF EXISTS savings_moves CASCADE;
```

### Paso 2: Crear nuevas tablas
```bash
# Ejecutar en Supabase SQL Editor
supabase-new-schema.sql
```

### Paso 3: Actualizar tipos TypeScript
```typescript
// Reemplazar src/lib/types.ts con src/lib/types-new.ts
mv src/lib/types-new.ts src/lib/types.ts
```

### Paso 4: Actualizar hooks
- `useDashboardData` → cargar `pockets` en lugar de `periods`
- Crear nuevos hooks: `usePockets`, `useMovements`

### Paso 5: Actualizar componentes
- `PeriodBalanceModule` → `PocketsModule`
- Crear `ExpensePocketCard` y `SavingPocketCard`

---

## 🎯 Ventajas del Nuevo Sistema

### ✅ Más Claro
- "Bolsa de comida" es más intuitivo que "período"
- El flujo de dinero es evidente

### ✅ Más Flexible
- Puedes tener múltiples bolsas simultáneas
- Bolsas de ahorro con objetivos claros
- Devolución automática de saldo restante

### ✅ Mejor UX
- Separar bolsas de gasto vs ahorro
- Ver progreso de objetivos de ahorro
- Entender cuánto puedo gastar HOY

### ✅ Más Simple en DB
- Una tabla `movements` en lugar de múltiples
- Triggers más simples
- Vistas SQL claras

---

## 📝 Próximos Pasos

1. ✅ Diseñar nueva estructura de datos
2. ✅ Crear SQL schema
3. ✅ Crear tipos TypeScript
4. ⏳ Ejecutar migración en Supabase
5. ⏳ Actualizar hooks y servicios
6. ⏳ Refactorizar componentes UI
7. ⏳ Actualizar onboarding
8. ⏳ Eliminar código legacy
9. ⏳ Testing completo

---

**¿Listo para empezar la migración? 🚀**
