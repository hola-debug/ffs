# 💰 Arquitectura Multi-Moneda + Ingresos Dinámicos

## 🔄 Cambio Fundamental: De `monthly_income` a Balance Dinámico

### ❌ Antes (Problema)
```
monthly_income (estático en profiles)
    ↓
Disponible = monthly_income - gastos - bolsas
```

**Problema**: No podías agregar ingresos durante el mes

### ✅ Ahora (Solución)
```
Cuentas (accounts.balance) ← se actualizan con ingresos
    ↓
Disponible = SUM(accounts.balance) - SUM(pockets activas)
```

**Ventaja**: Puedes agregar ingresos cuando quieras

---

## 📊 Flujo Completo

### 1️⃣ Día 1: Configuración Inicial

```typescript
// Usuario crea cuentas con saldo inicial
accounts = [
  { name: 'Banco BROU', type: 'bank', balance: 50000, currency: 'UYU' },
  { name: 'Efectivo', type: 'cash', balance: 5000, currency: 'UYU' },
  { name: 'PayPal', type: 'wallet', balance: 100, currency: 'USD' }
]

// Total disponible = 55,000 UYU + 100 USD
```

### 2️⃣ Separar Dinero en Bolsas

```typescript
// Usuario crea bolsas desde el disponible
pockets = [
  { 
    name: 'Comida Semanal',
    type: 'expense',
    allocated_amount: 3000,
    currency: 'UYU',
    starts_at: '2025-01-01',
    ends_at: '2025-01-07'
  },
  {
    name: 'Ahorro Vacaciones',
    type: 'saving',
    allocated_amount: 10000,
    target_amount: 50000,
    currency: 'UYU'
  }
]

// Disponible ahora = 55,000 - 3,000 - 10,000 = 42,000 UYU + 100 USD
```

### 3️⃣ Durante el Mes: Agregar Ingresos

```typescript
// El día 15 te pagan un freelance
movement = {
  type: 'income',
  account_id: 'paypal_id',
  amount: 200,
  currency: 'USD',
  description: 'Proyecto cliente X'
}

// ✅ El balance de la cuenta se actualiza automáticamente
// accounts[paypal].balance = 100 + 200 = 300 USD

// ✅ El disponible se recalcula automáticamente
// Disponible = 42,000 UYU + 300 USD
```

### 4️⃣ Agregar a Bolsa Existente

```typescript
// Decides agregar parte del ingreso a la bolsa de vacaciones
movement = {
  type: 'pocket_allocation',
  pocket_id: 'vacaciones_id',
  amount: 5000,
  currency: 'UYU'
}

// Bolsa vacaciones: 10,000 + 5,000 = 15,000
// Disponible: 42,000 - 5,000 = 37,000 UYU + 300 USD
```

---

## 🌍 Soporte Multi-Moneda

### Tablas y Vistas Clave

#### 1. `accounts` - Cuentas en diferentes monedas
```sql
-- Cada cuenta tiene su propia moneda
id | name          | type   | balance | currency
---|---------------|--------|---------|----------
1  | Banco BROU    | bank   | 50000   | UYU
2  | PayPal        | wallet | 300     | USD
3  | Banco España  | bank   | 500     | EUR
```

#### 2. `pockets` - Bolsas en diferentes monedas
```sql
-- Cada bolsa tiene su propia moneda
id | name       | type    | current_balance | currency
---|------------|---------|-----------------|----------
1  | Comida     | expense | 3000           | UYU
2  | Vacaciones | saving  | 15000          | UYU
3  | Gadgets    | saving  | 50             | USD
```

#### 3. `exchange_rates` - Tasas de cambio
```sql
-- Tabla para conversiones
from_currency | to_currency | rate   | date
--------------|-------------|--------|------------
USD           | UYU         | 41.50  | 2025-01-12
EUR           | UYU         | 45.20  | 2025-01-12
USD           | EUR         | 0.92   | 2025-01-12
```

---

## 📈 Vistas SQL Útiles

### `user_monthly_summary` - Resumen General
```sql
SELECT * FROM user_monthly_summary WHERE user_id = 'xxx';

-- Retorna:
{
  total_accounts_balance: 55300,  -- Todo el dinero en cuentas
  pockets_current_balance: 18050, -- Dinero en bolsas activas
  available_balance: 37250        -- Disponible sin asignar
}
```

### `user_balance_by_currency` - Balance por Moneda
```sql
SELECT * FROM user_balance_by_currency WHERE user_id = 'xxx';

-- Retorna:
[
  { currency: 'UYU', total_accounts: 55000, total_in_pockets: 18000, available: 37000 },
  { currency: 'USD', total_accounts: 300, total_in_pockets: 50, available: 250 },
  { currency: 'EUR', total_accounts: 500, total_in_pockets: 0, available: 500 }
]
```

### `user_unified_balance` - Balance Unificado
```sql
SELECT * FROM user_unified_balance WHERE user_id = 'xxx';

-- Retorna:
{
  base_currency: 'UYU',
  balance_in_base_currency: 55000,
  balances_by_currency: [
    { currency: 'UYU', balance: 55000, in_pockets: 18000, available: 37000 },
    { currency: 'USD', balance: 300, in_pockets: 50, available: 250 },
    { currency: 'EUR', balance: 500, in_pockets: 0, available: 500 }
  ]
}
```

### `income_by_account` - Ingresos por Cuenta
```sql
SELECT * FROM income_by_account WHERE user_id = 'xxx';

-- Retorna:
[
  { account_name: 'Banco BROU', current_balance: 50000, income_this_month: 50000 },
  { account_name: 'PayPal', current_balance: 300, income_this_month: 300 },
  { account_name: 'Efectivo', current_balance: 5000, income_this_month: 0 }
]
```

---

## 🔧 Funciones Útiles

### `convert_currency()` - Convertir entre monedas
```sql
-- Convertir 100 USD a UYU
SELECT convert_currency(100, 'USD', 'UYU');
-- Retorna: 4150.00

-- Convertir 5000 UYU a USD
SELECT convert_currency(5000, 'UYU', 'USD');
-- Retorna: 120.00
```

---

## 🎯 Casos de Uso

### Caso 1: Usuario con múltiples ingresos mensuales

```typescript
// Configuración inicial (día 1)
accounts = [
  { name: 'Banco Trabajo', balance: 0, currency: 'UYU' },
  { name: 'PayPal Freelance', balance: 0, currency: 'USD' }
]

// Día 5: Ingresa salario
addIncome({
  account: 'Banco Trabajo',
  amount: 45000,
  currency: 'UYU',
  description: 'Salario Enero'
})

// Día 15: Ingresa pago freelance
addIncome({
  account: 'PayPal Freelance',
  amount: 500,
  currency: 'USD',
  description: 'Proyecto X'
})

// Día 25: Ingresa otro freelance
addIncome({
  account: 'PayPal Freelance',
  amount: 300,
  currency: 'USD',
  description: 'Proyecto Y'
})

// Disponible total: 45,000 UYU + 800 USD (menos lo asignado a bolsas)
```

### Caso 2: Viajero con múltiples monedas

```typescript
// Usuario argentino que viaja a Europa
accounts = [
  { name: 'Banco ARS', balance: 500000, currency: 'ARS' },
  { name: 'Efectivo EUR', balance: 500, currency: 'EUR' },
  { name: 'Tarjeta USD', balance: 1000, currency: 'USD' }
]

// Crea bolsas en cada moneda
pockets = [
  { name: 'Comida Local', allocated_amount: 100000, currency: 'ARS' },
  { name: 'Restaurantes Europa', allocated_amount: 200, currency: 'EUR' },
  { name: 'Emergencias', allocated_amount: 500, currency: 'USD' }
]

// Disponible por moneda:
// ARS: 500,000 - 100,000 = 400,000 ARS
// EUR: 500 - 200 = 300 EUR
// USD: 1,000 - 500 = 500 USD
```

### Caso 3: Conversión de excedente

```typescript
// Usuario termina bolsa con saldo sobrante en USD
const pocket = {
  name: 'Compras Online',
  allocated_amount: 200,
  current_balance: 50,
  currency: 'USD',
  status: 'finished',
  auto_return_remaining: true
}

// Al cerrar, los $50 USD vuelven al disponible
// Opcionalmente puedes convertirlos a tu moneda base:
const converted = convert_currency(50, 'USD', 'UYU')
// Retorna: 2075 UYU
```

---

## 🚀 Implementación en Frontend

### Hook: `useMultiCurrencyBalance`
```typescript
const useMultiCurrencyBalance = () => {
  const { data: summary } = useQuery('user-unified-balance', async () => {
    const { data } = await supabase
      .from('user_unified_balance')
      .select('*')
      .single()
    return data
  })

  return {
    baseCurrency: summary?.base_currency,
    totalInBaseCurrency: summary?.balance_in_base_currency,
    balancesByCurrency: summary?.balances_by_currency || [],
    
    // Función helper para obtener disponible en una moneda
    getAvailableInCurrency: (currency: string) => {
      const balance = summary?.balances_by_currency.find(b => b.currency === currency)
      return balance?.available || 0
    }
  }
}
```

### Componente: Agregar Ingreso
```typescript
const AddIncomeForm = () => {
  const { accounts } = useAccounts()
  
  const handleSubmit = async (values) => {
    // Insertar movimiento de ingreso
    const { error } = await supabase
      .from('movements')
      .insert({
        type: 'income',
        account_id: values.account_id,
        amount: values.amount,
        currency: values.currency,
        date: values.date,
        description: values.description
      })
    
    // ✅ El trigger update_account_balance_on_income()
    //    actualiza automáticamente el balance de la cuenta
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Select label="Cuenta" options={accounts} />
      <Input label="Monto" type="number" />
      <Input label="Descripción" />
      <Button type="submit">Agregar Ingreso</Button>
    </form>
  )
}
```

---

## ⚙️ Migraciones Necesarias

### Paso 1: Ejecutar SQL
```bash
psql -f fix-available-balance-multimoneda.sql
```

### Paso 2: Actualizar Tipos TypeScript
```typescript
// types.ts
interface UserMonthlySummary {
  user_id: string
  default_currency: string
  total_accounts_balance: number      // Nuevo
  income_month: number                // Nuevo
  fixed_expenses_month: number
  saving_deposits_month: number
  pockets_allocated_month: number
  pockets_current_balance: number
  available_balance: number
}

interface CurrencyBalance {
  currency: string
  total_accounts: number
  total_in_pockets: number
  available: number
}

interface UnifiedBalance {
  user_id: string
  base_currency: string
  balance_in_base_currency: number
  balances_by_currency: CurrencyBalance[]
}
```

### Paso 3: Actualizar Hooks
```typescript
// Reemplazar useDashboardData
const useDashboardData = () => {
  // Cambiar de profiles.monthly_income a user_monthly_summary
  const { data: summary } = useQuery('monthly-summary', ...)
  const { data: accounts } = useQuery('accounts', ...)
  const { data: pockets } = useQuery('pockets', ...)
  
  return {
    available: summary?.available_balance || 0,
    totalInAccounts: summary?.total_accounts_balance || 0,
    // ...
  }
}
```

---

## ✅ Beneficios

1. **Ingresos Dinámicos**: Agrega dinero cuando quieras, no solo al inicio del mes
2. **Multi-Moneda**: Maneja cuentas en diferentes monedas simultáneamente
3. **Conversión Automática**: Función `convert_currency()` para convertir entre monedas
4. **Balance Real**: El disponible se calcula desde el balance real de las cuentas
5. **Trazabilidad**: Cada ingreso queda registrado en `movements`
6. **Flexibilidad**: Puedes tener bolsas en diferentes monedas

---

## 🔮 Futuras Mejoras

- [ ] Integrar API de tasas de cambio en tiempo real
- [ ] Auto-convertir excedentes a moneda base
- [ ] Dashboard multi-moneda con gráficos
- [ ] Alertas cuando una moneda alcanza cierto valor
- [ ] Exportar reportes por moneda
