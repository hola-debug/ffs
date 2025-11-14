# 🎯 Arquitectura de Subtipos de Gastos (Expense)

## 📋 Resumen

La arquitectura de Finex maneja **TODO mediante bolsas (pockets)**. No hay gastos fijos o ahorros directos a nivel ingreso, todo se modela como bolsas.

```
FLUJO SIMPLIFICADO:

Ingresos → Cuentas (balance dinámico) → Disponible → BOLSAS
```

---

## 🎒 Tipos de Bolsas

### 1. `expense` - Bolsas de Gasto
Con 4 subtipos: `period`, `recurrent`, `fixed`, `shared`

### 2. `saving` - Bolsas de Ahorro
Sin subtipos (solo hay un tipo de ahorro)

### 3. `debt` - Bolsas de Deuda
Sin subtipos (solo hay un tipo de deuda)

---

## 🛍️ Subtipos de Expense (Detalle)

### Comparación Rápida

| Subtipo | ¿Tiene período? | ¿Tiene vencimiento? | Monto | Caso de uso |
|---------|----------------|---------------------|-------|-------------|
| **period** | ✅ inicio/fin | ❌ | Variable | Comida mensual, viajes |
| **recurrent** | ❌ | ✅ día del mes | Variable | Luz, agua, teléfono |
| **fixed** | ❌ | ✅ día del mes | Fijo | Alquiler, Netflix |
| **shared** | Depende | Depende | Variable | Gastos compartidos |

---

## 1️⃣ EXPENSE.PERIOD

**Concepto:** Presupuesto para gastar en un período específico

### Campos Principales

```typescript
{
  type: "expense",
  subtype: "period",
  
  // Core
  allocated_amount: number,     // Presupuesto asignado
  spent_amount: number,          // Cuánto has gastado
  
  // Período
  starts_at: Date,               // Fecha inicio
  ends_at: Date,                 // Fecha fin
  days_duration: number,         // Calculado automático
  
  // Calculados
  daily_allowance: number,       // allocated_amount / days_duration
  remaining_amount: number,      // allocated_amount - spent_amount
  days_remaining: number         // ends_at - today
}
```

### Ejemplos de Uso

```typescript
// Comida mensual
{
  name: "Comida Febrero",
  subtype: "period",
  allocated_amount: 10000,
  starts_at: "2025-02-01",
  ends_at: "2025-02-28"
  // → daily_allowance: 357 UYU/día
}

// Viaje de 10 días
{
  name: "Vacaciones Punta del Este",
  subtype: "period",
  allocated_amount: 15000,
  starts_at: "2025-02-15",
  ends_at: "2025-02-25"
  // → daily_allowance: 1500 UYU/día
}

// Gastos semanales
{
  name: "Salidas fin de semana",
  subtype: "period",
  allocated_amount: 3000,
  starts_at: "2025-02-08",
  ends_at: "2025-02-14"
  // → daily_allowance: 428 UYU/día
}
```

### Diferencias con otros subtipos

- **vs recurrent**: `period` NO tiene día de vencimiento, tiene rango de fechas
- **vs fixed**: `period` NO es recurrente automáticamente, es de una sola vez (o manual)

---

## 2️⃣ EXPENSE.RECURRENT

**Concepto:** Gasto que vence cada mes pero el monto varía

### Campos Principales

```typescript
{
  type: "expense",
  subtype: "recurrent",
  
  // Core
  average_amount: number,           // Promedio histórico
  spent_amount: number,             // Monto pagado este mes
  
  // Vencimiento
  due_day: number,                  // Día del mes que vence (1-31)
  next_payment: Date,               // Calculado automático
  last_payment_amount?: number,     // Último monto pagado
  
  // Notificaciones
  notification_days_before: number  // Días antes para notificar
}
```

### Ejemplos de Uso

```typescript
// Luz (varía según consumo)
{
  name: "UTE - Luz",
  subtype: "recurrent",
  average_amount: 2500,
  due_day: 10,
  notification_days_before: 3,
  last_payment_amount: 2350
  // → Notifica el 7 de cada mes
}

// Agua (varía según consumo)
{
  name: "OSE - Agua",
  subtype: "recurrent",
  average_amount: 1800,
  due_day: 5,
  notification_days_before: 2
}

// Teléfono móvil (varía según uso de datos)
{
  name: "Antel Móvil",
  subtype: "recurrent",
  average_amount: 900,
  due_day: 20,
  notification_days_before: 3
}
```

### Diferencias con otros subtipos

- **vs period**: `recurrent` tiene vencimiento mensual, NO tiene inicio/fin
- **vs fixed**: `recurrent` el monto varía cada mes, `fixed` es siempre igual

---

## 3️⃣ EXPENSE.FIXED

**Concepto:** Gasto que vence cada mes con el mismo monto exacto

### Campos Principales

```typescript
{
  type: "expense",
  subtype: "fixed",
  
  // Core
  monthly_amount: number,        // Monto exacto mensual
  
  // Vencimiento
  due_day: number,               // Día del mes que vence
  next_payment: Date,            // Calculado automático
  last_payment?: Date,           // Última vez que se pagó
  
  // Automatización
  auto_register: boolean         // ¿Registrar automáticamente?
}
```

### Ejemplos de Uso

```typescript
// Alquiler (siempre el mismo monto)
{
  name: "Alquiler Apartamento",
  subtype: "fixed",
  monthly_amount: 15000,
  due_day: 1,
  auto_register: true
}

// Netflix (suscripción fija)
{
  name: "Netflix Premium",
  subtype: "fixed",
  monthly_amount: 599,
  due_day: 15,
  auto_register: true
}

// Seguro (cuota fija)
{
  name: "Seguro Auto",
  subtype: "fixed",
  monthly_amount: 3200,
  due_day: 10,
  auto_register: false  // Prefiero registrarlo manual
}
```

### Diferencias con otros subtipos

- **vs recurrent**: `fixed` monto NO varía, `recurrent` sí varía
- **vs period**: `fixed` es automáticamente mensual, `period` tiene inicio/fin

---

## 4️⃣ EXPENSE.SHARED (Futuro)

**Concepto:** Gasto dividido entre varias personas

### Campos Principales

```typescript
{
  type: "expense",
  subtype: "shared",
  
  // Core
  allocated_amount: number,
  spent_amount: number,
  
  // División
  split_type: "equal" | "percentage" | "custom",
  participants: string[],        // IDs de usuarios
  splits: {
    user_id: string,
    amount: number,
    paid: boolean
  }[]
}
```

### Ejemplos de Uso

```typescript
// Alquiler compartido
{
  name: "Alquiler Depto Compartido",
  subtype: "shared",
  allocated_amount: 20000,
  split_type: "equal",
  participants: ["user_1", "user_2", "user_3"]
  // → Cada uno paga 6,666
}

// Cena dividida
{
  name: "Cena Restaurant",
  subtype: "shared",
  allocated_amount: 4500,
  split_type: "custom",
  splits: [
    { user_id: "user_1", amount: 1500, paid: true },
    { user_id: "user_2", amount: 1500, paid: false },
    { user_id: "user_3", amount: 1500, paid: false }
  ]
}
```

---

## 🔄 Flujo de Trabajo

### Caso 1: Usuario con gastos mensuales

```typescript
// Al inicio del mes, el usuario crea:

// 1. Comida del mes (period)
{
  name: "Comida Febrero",
  subtype: "period",
  allocated_amount: 10000,
  starts_at: "2025-02-01",
  ends_at: "2025-02-28"
}

// 2. Luz que vence el 10 (recurrent)
{
  name: "Luz",
  subtype: "recurrent",
  average_amount: 2500,
  due_day: 10
}

// 3. Alquiler que vence el 1 (fixed)
{
  name: "Alquiler",
  subtype: "fixed",
  monthly_amount: 15000,
  due_day: 1,
  auto_register: true
}

// El día 1: El alquiler se registra automáticamente (auto_register: true)
// El día 7: Notificación "Luz vence en 3 días"
// El día 10: Usuario registra el pago real de luz (ej: 2,350)
// Durante el mes: Usuario gasta desde la bolsa de comida
// Fin de mes: Dinero sobrante de comida vuelve al disponible
```

---

## 🎨 UI Propuesta

### Crear Bolsa de Gasto

```
┌─────────────────────────────────────┐
│ Nueva Bolsa de Gasto                │
├─────────────────────────────────────┤
│                                     │
│ Tipo de gasto:                      │
│                                     │
│ ○ Por Período                       │
│   Presupuesto para días específicos │
│   Ej: comida mensual, viajes        │
│                                     │
│ ○ Recurrente Variable               │
│   Vence cada mes, monto varía       │
│   Ej: luz, agua, teléfono           │
│                                     │
│ ○ Fijo Mensual                      │
│   Vence cada mes, mismo monto       │
│   Ej: alquiler, Netflix             │
│                                     │
│ ○ Compartido                        │
│   Dividir entre varias personas     │
│   Ej: alquiler compartido           │
│                                     │
│         [Cancelar]  [Continuar]     │
└─────────────────────────────────────┘
```

### Según selección:

**Si selecciona "Por Período":**
```
┌─────────────────────────────────────┐
│ Bolsa de Gasto por Período          │
├─────────────────────────────────────┤
│ Nombre: [___________]               │
│ Presupuesto: [$______]              │
│ Desde: [01/02/2025]                 │
│ Hasta: [28/02/2025]                 │
│                                     │
│ 💡 Podrás gastar $357/día           │
│                                     │
│         [Cancelar]  [Crear]         │
└─────────────────────────────────────┘
```

**Si selecciona "Recurrente Variable":**
```
┌─────────────────────────────────────┐
│ Gasto Recurrente Variable           │
├─────────────────────────────────────┤
│ Nombre: [___________]               │
│ Presupuesto estimado: [$______]     │
│ Vence el día: [10] de cada mes      │
│ Notificar [3] días antes            │
│                                     │
│ 💡 Te avisaremos el 7 de cada mes   │
│                                     │
│         [Cancelar]  [Crear]         │
└─────────────────────────────────────┘
```

**Si selecciona "Fijo Mensual":**
```
┌─────────────────────────────────────┐
│ Gasto Fijo Mensual                  │
├─────────────────────────────────────┤
│ Nombre: [___________]               │
│ Monto mensual: [$______]            │
│ Vence el día: [1] de cada mes       │
│ ☑ Registrar automáticamente         │
│                                     │
│ 💡 Se descontará solo cada mes      │
│                                     │
│         [Cancelar]  [Crear]         │
└─────────────────────────────────────┘
```

---

## 📊 Resumen de Diferencias

### ¿Cuál usar?

**Usa `period` cuando:**
- Sabes las fechas exactas (inicio y fin)
- Quieres control día a día del presupuesto
- Es algo temporal o único (viaje, evento)
- Ejemplo: "Tengo 10,000 para comida del 1 al 28 de febrero"

**Usa `recurrent` cuando:**
- Vence cada mes en un día específico
- El monto varía mes a mes
- Quieres notificaciones de vencimiento
- Ejemplo: "Luz vence el 10, normalmente pago ~2,500"

**Usa `fixed` cuando:**
- Vence cada mes en un día específico
- El monto es SIEMPRE el mismo
- Quieres que se registre automáticamente
- Ejemplo: "Alquiler vence el 1, siempre son 15,000"

**Usa `shared` cuando:**
- El gasto se divide entre varias personas
- Necesitas trackear quién pagó
- Ejemplo: "Alquiler de 20,000 dividido en 3"

---

## 🔧 Migración SQL Necesaria

```sql
-- Actualizar constraint para nuevos subtipos
ALTER TABLE pockets DROP CONSTRAINT IF EXISTS pockets_subtype_check;
ALTER TABLE pockets ADD CONSTRAINT pockets_subtype_check CHECK (
  (type = 'expense' AND subtype IN ('period', 'recurrent', 'fixed', 'shared')) OR
  (type IN ('saving', 'debt') AND subtype IS NULL)
);

-- Agregar campos para recurrent
ALTER TABLE pockets ADD COLUMN IF NOT EXISTS average_amount NUMERIC(12,2);
ALTER TABLE pockets ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC(12,2);
ALTER TABLE pockets ADD COLUMN IF NOT EXISTS notification_days_before INT DEFAULT 3;

-- Migrar datos existentes: variable → period
UPDATE pockets 
SET subtype = 'period'
WHERE type = 'expense' AND subtype = 'variable';
```

---

## ✅ Beneficios de Esta Arquitectura

1. **Sin redundancia**: Eliminamos `variable` que era redundante con `period`
2. **Semántica clara**: Cada subtipo tiene un propósito único y obvio
3. **Extensible**: Fácil agregar nuevos subtipos en el futuro
4. **UX intuitivo**: Los nombres describen claramente qué hace cada uno
5. **Flexible**: Cubre todos los casos de uso comunes de finanzas personales

---

**Última actualización:** 2025-11-14
