# Sistema de Actualización de Saldos

## 📋 Resumen

El sistema de actualización de saldos está diseñado para refrescar automáticamente la información del dashboard después de cada operación (transacción, periodo, movimiento de ahorro, etc.).

## 🔄 Mecanismos de Actualización

### 1. **Suscripciones en Tiempo Real (Supabase Realtime)**

El hook `useDashboardData` se suscribe automáticamente a cambios en las siguientes tablas:

- `transactions` - Transacciones
- `savings_moves` - Movimientos de ahorro
- `accounts` - Cuentas
- `categories` - Categorías
- `monthly_plan` - Plan mensual
- `periods` - Periodos

```typescript
// Ubicación: src/hooks/useDashboardData.ts (líneas 80-130)
const channel = supabase
  .channel('dashboard-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, 
    () => fetchData(true)
  )
  // ... más suscripciones
  .subscribe();
```

**Ventaja**: Actualización automática cuando cualquier usuario/proceso modifica los datos.

### 2. **Eventos Personalizados (Custom Events)**

Cuando un componente crea una transacción o realiza una acción, puede disparar un evento personalizado:

```typescript
import { dispatchDashboardRefresh } from '../lib/dashboardEvents';

// Después de crear una transacción
await supabase.from('transactions').insert({ ... });
dispatchDashboardRefresh(); // Dispara refresco
```

**Uso en**:
- `AddExpensePopover.tsx` (línea 106)
- Otros componentes que crean transacciones

### 3. **Refresco Manual con `refetch()`**

Todos los módulos reciben un callback `onRefresh` que llama a `refetch()`:

```typescript
// En DashboardPage.tsx
<DailyBalanceModule onRefresh={data.refetch} />
```

### 4. **Polling Automático (cada 15 segundos)**

Como respaldo, el hook hace polling cada 15 segundos:

```typescript
const intervalId = setInterval(() => fetchData(true), 15000);
```

## 📊 Nuevos Módulos Creados

### **PeriodBalanceModule** - Saldo del Periodo
- **Ubicación**: `src/components/modules/PeriodBalance/index.tsx`
- **Datos mostrados**:
  - `remaining_amount` del periodo activo
  - Nombre del periodo
  - Días restantes
  - Gastado vs. Asignado
- **Actualización**: Automática vía suscripción a tabla `periods`

### **AccountsBalanceModule** - Saldo General
- **Ubicación**: `src/components/modules/AccountsBalance/index.tsx`
- **Datos mostrados**:
  - Suma total de `balance` de todas las cuentas
  - Desglose por moneda (si hay múltiples)
  - Cantidad de cuentas
- **Actualización**: Automática vía suscripción a tabla `accounts`

## 🎯 Flujo de Actualización Completo

```mermaid
graph TD
    A[Usuario crea transacción] --> B[Se inserta en DB]
    B --> C1[Trigger de Supabase actualiza accounts.balance]
    B --> C2[Trigger actualiza periods.remaining_amount]
    C1 --> D1[Realtime notifica cambio en 'accounts']
    C2 --> D2[Realtime notifica cambio en 'periods']
    D1 --> E[useDashboardData recibe notificación]
    D2 --> E
    E --> F[fetchData() se ejecuta]
    F --> G1[Actualiza PeriodBalanceModule]
    F --> G2[Actualiza AccountsBalanceModule]
    F --> G3[Actualiza otros módulos]
```

## ⚙️ Triggers de Base de Datos

Para que los saldos se actualicen correctamente, asegúrate de tener estos triggers en Supabase:

### Trigger para actualizar balance de cuentas:
```sql
-- Después de insertar/actualizar/eliminar transacciones
-- debe recalcular el balance de la cuenta afectada
```

### Trigger para actualizar remaining_amount de periodos:
```sql
-- Después de insertar/actualizar/eliminar transacciones con period_id
-- debe recalcular spent_amount y remaining_amount del periodo
```

## 🧪 Verificación

Para verificar que todo funciona:

1. **Crear una transacción** en un periodo activo
2. **Observar** que `PeriodBalanceModule` muestra el nuevo `remaining_amount`
3. **Observar** que `AccountsBalanceModule` muestra el nuevo balance total
4. **Tiempo de actualización**: < 1 segundo (gracias a Realtime)

## 📝 Notas Importantes

- **No es necesario llamar manualmente a `refetch()`** en la mayoría de casos
- Los componentes se actualizan automáticamente gracias a las suscripciones
- El polling de 15 segundos es un respaldo por si falla Realtime
- Todos los cálculos de saldo se hacen en el backend (triggers SQL) para consistencia

## 🔧 Personalización

Si necesitas actualizar manualmente después de una operación específica:

```typescript
import { dispatchDashboardRefresh } from '../lib/dashboardEvents';

// Tu código aquí...
await hacerAlgunaOperacion();

// Forzar actualización
dispatchDashboardRefresh();
```

O si tienes acceso al hook directamente:

```typescript
const { refetch } = useDashboardData();

// Tu código aquí...
await hacerAlgunaOperacion();

// Forzar actualización
refetch();
```
