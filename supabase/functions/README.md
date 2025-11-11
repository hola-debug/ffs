# Edge Functions - FFS Finance

Este directorio contiene las Edge Functions de Supabase que centralizan la lógica de negocio crítica para transacciones y períodos.

## 📋 Funciones Disponibles

### 1. `create-transaction`

Crea transacciones con validaciones centralizadas y actualización automática de balances.

**Endpoint:** `POST /functions/v1/create-transaction`

**Headers requeridos:**
```
Authorization: Bearer <user_jwt_token>
Content-Type: application/json
```

**Payload:**
```typescript
{
  account_id: string;              // ID de la cuenta (obligatorio)
  type: 'income' | 'expense' | 'transfer';  // Tipo de transacción (obligatorio)
  amount: number;                   // Monto > 0 (obligatorio)
  scope?: 'period' | 'outside_period';  // Default: 'outside_period'
  period_id?: string;               // Obligatorio si scope='period'
  category_id?: string;             // Opcional
  currency?: string;                // Default: moneda de la cuenta
  date?: string;                    // Default: fecha actual (YYYY-MM-DD)
  description?: string;             // Opcional
  is_random?: boolean;              // Default: false
  is_fixed?: boolean;               // Default: false
  is_recurring?: boolean;           // Default: false
  metadata?: object;                // Opcional
  
  // Solo para transfers:
  to_account_id?: string;           // Obligatorio si type='transfer'
}
```

**Ejemplo - Gasto en período:**
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-transaction`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    account_id: 'uuid-cuenta',
    type: 'expense',
    amount: 150.50,
    scope: 'period',
    period_id: 'uuid-periodo',
    category_id: 'uuid-categoria',
    description: 'Supermercado',
  }),
});

const { success, data } = await response.json();
```

**Ejemplo - Transfer entre cuentas:**
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-transaction`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    account_id: 'uuid-cuenta-origen',
    to_account_id: 'uuid-cuenta-destino',
    type: 'transfer',
    amount: 500,
    description: 'Transfer to savings',
  }),
});
```

**Validaciones realizadas:**
1. ✅ Campos obligatorios presentes
2. ✅ Amount > 0
3. ✅ Type válido
4. ✅ Scope válido
5. ✅ Si scope='period', period_id requerido
6. ✅ Cuenta pertenece al usuario
7. ✅ Período existe y pertenece al usuario
8. ✅ Saldo suficiente en período (para expenses)
9. ✅ Categoría existe y es compatible
10. ✅ Para transfers: validar to_account_id
11. ✅ Actualización automática de balances

---

### 2. `create-period`

Crea períodos con validaciones y opción de transferencia automática desde otra cuenta.

**Endpoint:** `POST /functions/v1/create-period`

**Headers requeridos:**
```
Authorization: Bearer <user_jwt_token>
Content-Type: application/json
```

**Payload:**
```typescript
{
  account_id: string;           // ID de la cuenta del periodo (obligatorio)
  name: string;                 // Nombre del período (obligatorio)
  percentage: number;           // Porcentaje 0-100 (obligatorio)
  days: number;                 // Días 1-120 (obligatorio)
  allocated_amount: number;     // Monto asignado >= 0 (obligatorio)
  currency?: string;            // Default: moneda de la cuenta
  starts_at?: string;           // Default: fecha actual (YYYY-MM-DD)
  status?: 'draft' | 'active' | 'finished' | 'cancelled';  // Default: 'draft'
  
  // Opciones para transferencia automática:
  transfer_from_account_id?: string;    // Cuenta desde la que transferir
  create_transfer_transaction?: boolean; // Si true, crea transacción de transfer
}
```

**Ejemplo - Crear período simple:**
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-period`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    account_id: 'uuid-cuenta-periodo',
    name: 'Quincenal Nov 1-15',
    percentage: 50,
    days: 15,
    allocated_amount: 5000,
    status: 'active',
  }),
});

const { success, period } = await response.json();
```

**Ejemplo - Crear período con transferencia:**
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-period`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    account_id: 'uuid-cuenta-periodo',
    name: 'Quincenal Nov 1-15',
    percentage: 50,
    days: 15,
    allocated_amount: 5000,
    status: 'active',
    
    // Transferir automáticamente desde cuenta principal
    transfer_from_account_id: 'uuid-cuenta-principal',
    create_transfer_transaction: true,
  }),
});

const { success, period, transfer_transaction } = await response.json();
```

**Validaciones realizadas:**
1. ✅ Campos obligatorios presentes
2. ✅ Percentage entre 0-100
3. ✅ Days entre 1-120
4. ✅ Allocated amount >= 0
5. ✅ Cuenta destino existe y pertenece al usuario
6. ✅ Cuenta origen existe (si se usa transfer)
7. ✅ Saldo suficiente en cuenta origen
8. ✅ Calcula automáticamente daily_amount y ends_at
9. ✅ Actualiza balances de cuentas involucradas

**Campos calculados automáticamente:**
- `daily_amount`: `allocated_amount / days`
- `ends_at`: `starts_at + days - 1`
- `spent_amount`: `0` (inicial)
- `remaining_amount`: calculado por trigger

---

## 🚀 Deployment

Para desplegar las funciones a Supabase:

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref <tu-project-ref>

# Deploy individual
supabase functions deploy create-transaction
supabase functions deploy create-period

# Deploy todas
supabase functions deploy
```

---

## 🔒 Seguridad

- ✅ **Autenticación:** Todas las funciones requieren JWT token válido
- ✅ **Autorización:** Solo pueden acceder a recursos del usuario autenticado
- ✅ **Validación:** Validaciones exhaustivas de datos antes de cualquier operación
- ✅ **RLS:** Respeta Row Level Security de Supabase
- ✅ **CORS:** Configurado para permitir requests desde frontend

---

## 🧪 Testing

### Desde el cliente (React):

```typescript
import { supabase } from '@/lib/supabase';

// Crear transacción
async function createTransaction(data: TransactionPayload) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-transaction`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
  
  return response.json();
}

// Crear período
async function createPeriod(data: PeriodPayload) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-period`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
  
  return response.json();
}
```

### Desde curl (testing manual):

```bash
# Obtener token (primero login en la app)
TOKEN="eyJhbGc..."

# Test create-transaction
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/create-transaction \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "uuid-aqui",
    "type": "expense",
    "amount": 100,
    "description": "Test"
  }'

# Test create-period
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/create-period \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "uuid-aqui",
    "name": "Test Period",
    "percentage": 50,
    "days": 15,
    "allocated_amount": 5000
  }'
```

---

## 📊 Respuestas

### Success (201):
```json
{
  "success": true,
  "data": { /* transaction o period object */ }
}
```

### Error (400/404/500):
```json
{
  "error": "Mensaje descriptivo del error",
  "details": "Detalles adicionales si aplica"
}
```

---

## 💡 Ventajas de usar Edge Functions

1. **Validación centralizada**: Una sola fuente de verdad para reglas de negocio
2. **Seguridad**: El cliente no puede manipular balances directamente
3. **Atomicidad**: Operaciones complejas (transfer + update balance) son atómicas
4. **Auditoría**: Logs centralizados de todas las operaciones
5. **Rendimiento**: Más rápido que múltiples requests desde el cliente
6. **Mantenibilidad**: Cambios de lógica en un solo lugar

---

## 🔄 Flujo de datos

```
Cliente
  ↓
Edge Function (validaciones + lógica)
  ↓
Supabase Database (RLS + triggers)
  ↓
Respuesta al cliente
```
