# Estructura Modular del Dashboard

Cada módulo/tarjeta del dashboard es un componente independiente que sigue esta estructura:

## Carpetas de Módulos

- `/DailyBalance` - Saldo diario disponible
- `/DailyExpenses` - Gastos del día
- `/Savings` - Ahorros totales
- `/MonthlyIncome` - Ingreso mensual
- `/DayCounter` - Contador de días
- `/RandomExpenses` - Gastos aleatorios/extras

## Estructura de cada módulo

Cada módulo contiene:
- `index.tsx` - Componente principal exportado
- `types.ts` - Tipos específicos del módulo
- `hooks.ts` (opcional) - Hooks específicos del módulo
- `styles.ts` (opcional) - Estilos o clases específicas

## Ejemplo de uso

```tsx
import { DailyBalanceModule } from './modules/DailyBalance';
import { DailyExpensesModule } from './modules/DailyExpenses';

<div className="dashboard-grid">
  <DailyBalanceModule data={data.dailySpendable} />
  <DailyExpensesModule 
    data={data.todayExpenses}
    accounts={accounts}
    onRefresh={refetch}
  />
</div>
```
