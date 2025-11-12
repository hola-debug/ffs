# 🎒 Nueva Arquitectura: Sistema de Bolsas

## 📋 Resumen del Cambio

**Antes (Períodos):**
- Sistema basado en "períodos" que dividían el ingreso
- Concepto confuso y limitado

**Ahora (Bolsas):**
- Sistema de **BOLSAS DE DINERO** que se separan del ingreso
- Dos tipos: **Bolsas de Gasto** y **Bolsas de Ahorro**
- Flujo de dinero más claro y natural

---

## 🌊 Flujo de Dinero

```
INGRESO MENSUAL ($10,000)
    │
    ├─────────────────────────────────────────┐
    │                                         │
    ▼                                         ▼
NIVEL INGRESO                         DISPONIBLE
    │                                   ($6,000)
    ├─ Gastos Fijos (-$3,000)              │
    │  • Alquiler                           │
    │  • Servicios                          ├──────────────┬─────────────┐
    │  • Internet                           │              │             │
    │                                       ▼              ▼             ▼
    └─ Ahorro Directo (-$1,000)      BOLSA #1        BOLSA #2      BOLSA #3
       • Emergencias                  Comida         Viaje         Entretenimiento
                                     $2,000/15d     $3,000/30d      $1,000/30d
                                     GASTO          AHORRO          GASTO
                                     
                                     └─> Al finalizar, si sobra dinero
                                         vuelve al INGRESO
```

---

## 🎯 Conceptos Clave

### 1. **Ingreso Mensual** (Nivel base)
- El dinero total que entra cada mes
- Configurado en el perfil del usuario

### 2. **Gastos Fijos** (Nivel ingreso)
- Gastos recurrentes mensuales
- Se descuentan directamente del ingreso
- Ej: alquiler, servicios, subscripciones

### 3. **Ahorro Directo** (Nivel ingreso)
- Ahorros permanentes que NO están en bolsas
- Se descuentan directamente del ingreso
- Ej: fondo de emergencia, inversiones

### 4. **Disponible**
```
DISPONIBLE = INGRESO - GASTOS_FIJOS - AHORRO_DIRECTO
```

### 5. **Bolsas (Pockets)**

Son separaciones del dinero disponible con un objetivo específico:

#### 🛒 Bolsas de GASTO (`type: 'expense'`)
- Separo X dinero para gastar en Y días
- Me dice cuánto puedo gastar por día
- Al finalizar, el dinero restante vuelve al ingreso

**Ejemplo:**
```typescript
{
  name: "Comida Quincenal",
  type: "expense",
  allocated_amount: 2000,
  starts_at: "2025-01-01",
  ends_at: "2025-01-15",
  daily_allowance: 133.33,  // 2000 / 15 días
  auto_return_remaining: true
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

Reemplaza la tabla `transactions`. Tipos de movimientos:

| Tipo | Descripción | Nivel |
|------|-------------|-------|
| `income` | Ingreso mensual | Ingreso |
| `fixed_expense` | Gasto fijo mensual | Ingreso |
| `saving_deposit` | Depósito a ahorro directo | Ingreso |
| `pocket_allocation` | Asignar dinero a una bolsa | Bolsa |
| `pocket_expense` | Gasto desde una bolsa | Bolsa |
| `pocket_return` | Devolución de bolsa al ingreso | Bolsa |

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
