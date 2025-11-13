# 🔧 N8N Tools Configuration V3

## Cambios necesarios en las herramientas de n8n

---

## ✅ Tool: Create Account

**Cambios necesarios:**

```json
{
  "parameters": {
    "descriptionType": "manual",
    "toolDescription": "Crear una nueva cuenta bancaria, billetera, efectivo o crypto",
    "tableId": "accounts",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "user_id",
          "fieldValue": "={{ $('Build Complete Context').first().json.user_id }}"
        },
        {
          "fieldId": "name",
          "fieldValue": "={{ $fromAI('name', 'Nombre de la cuenta (ej: Banco BROU, PayPal, Efectivo)', 'string') }}"
        },
        {
          "fieldId": "type",
          "fieldValue": "={{ $fromAI('type', 'cash|bank|wallet|crypto|other', 'string') }}"
        },
        {
          "fieldId": "currency",
          "fieldValue": "={{ $fromAI('currency', 'UYU|USD|EUR|ARS', 'string') }}"
        },
        // ✅ NUEVO: Agregar balance inicial
        {
          "fieldId": "balance",
          "fieldValue": "={{ $fromAI('balance', 'Saldo inicial de la cuenta (0 si no se especifica)', 'number', 0) }}"
        },
        {
          "fieldId": "is_primary",
          "fieldValue": "={{ $fromAI('is_primary', 'false', 'boolean', false) }}"
        }
      ]
    }
  }
}
```

---

## ✅ Tool: Create Category

**Cambios necesarios:**

```json
{
  "parameters": {
    "descriptionType": "manual",
    "toolDescription": "Crear una nueva categoría de ingreso, gasto fijo, ahorro, o gasto de bolsa. ANTES de crear, buscar si ya existe una categoría con nombre similar (case-insensitive).",
    "tableId": "categories",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "user_id",
          "fieldValue": "={{ $('Build Complete Context').first().json.user_id }}"
        },
        {
          "fieldId": "name",
          "fieldValue": "={{ $fromAI('name', 'Nombre normalizado de la categoría (Primera Letra Mayúscula)', 'string') }}"
        },
        {
          "fieldId": "type",
          // ✅ CORREGIDO: Eliminar 'pocket_saving'
          "fieldValue": "={{ $fromAI('type', 'income|fixed_expense|saving|pocket_expense', 'string') }}"
        },
        {
          "fieldId": "icon",
          "fieldValue": "={{ $fromAI('icon', 'Emoji representativo según la tabla EMOJI_MAP del prompt', 'string', '📦') }}"
        },
        {
          "fieldId": "color",
          "fieldValue": "={{ $fromAI('color', 'Color en formato hex: #ef4444 (fixed_expense), #10b981 (saving), #8b5cf6 (income), #3b82f6 (pocket_expense)', 'string', '#3b82f6') }}"
        }
      ]
    }
  }
}
```

---

## ✅ Tool: Create Pocket

**Cambios necesarios:**

```json
{
  "parameters": {
    "descriptionType": "manual",
    "toolDescription": "Crear una bolsa de gasto (expense) o ahorro (saving). IMPORTANTE: Si el usuario no especifica duración (ends_at), DEBES preguntar antes de crear la bolsa.",
    "tableId": "pockets",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "user_id",
          "fieldValue": "={{ $('Build Complete Context').first().json.user_id }}"
        },
        {
          "fieldId": "name",
          "fieldValue": "={{ $fromAI('name', 'Nombre de la bolsa normalizado (Primera Letra Mayúscula)', 'string') }}"
        },
        {
          "fieldId": "type",
          "fieldValue": "={{ $fromAI('type', 'expense|saving', 'string') }}"
        },
        // ✅ NUEVO: Agregar emoji
        {
          "fieldId": "emoji",
          "fieldValue": "={{ $fromAI('emoji', 'Emoji representativo de la bolsa según tabla EMOJI_MAP', 'string', '📦') }}"
        },
        {
          "fieldId": "allocated_amount",
          "fieldValue": "={{ $fromAI('allocated_amount', 'Monto inicial asignado a la bolsa', 'number') }}"
        },
        // ✅ NUEVO: Inicializar current_balance igual a allocated_amount
        {
          "fieldId": "current_balance",
          "fieldValue": "={{ $fromAI('allocated_amount', 'El balance inicial es igual al monto asignado', 'number') }}"
        },
        {
          "fieldId": "currency",
          "fieldValue": "={{ $fromAI('currency', 'UYU|USD|EUR|ARS', 'string', $('Build Complete Context').first().json.profile.currency) }}"
        },
        {
          "fieldId": "starts_at",
          "fieldValue": "={{ $fromAI('starts_at', 'Fecha de inicio YYYY-MM-DD (hoy si no se especifica)', 'string', $now.format('yyyy-MM-dd')) }}"
        },
        {
          "fieldId": "ends_at",
          // ✅ MEJORADO: Dejar claro que DEBE preguntar si no está especificado
          "fieldValue": "={{ $fromAI('ends_at', 'Fecha de fin YYYY-MM-DD. CRÍTICO: Si el usuario no la mencionó, debes PREGUNTAR antes de continuar. Debe ser >= starts_at', 'string') }}"
        },
        {
          "fieldId": "target_amount",
          "fieldValue": "={{ $fromAI('type', '', 'string') === 'saving' ? $fromAI('target_amount', 'Meta de ahorro (requerido para tipo saving)', 'number') : null }}"
        },
        {
          "fieldId": "auto_return_remaining",
          "fieldValue": "={{ $fromAI('auto_return_remaining', 'Devolver saldo restante al finalizar (true por defecto)', 'boolean', true) }}"
        }
      ]
    }
  }
}
```

---

## ✅ Tool: Update Pocket

**Sin cambios necesarios** - Ya está bien configurado.

---

## ✅ Tool: Create Movement

**Cambios necesarios:**

```json
{
  "parameters": {
    "descriptionType": "manual",
    "toolDescription": "Registrar movimiento financiero. CRÍTICO: Antes de crear, validar que las monedas coincidan (movement.currency == account.currency para income, movement.currency == pocket.currency para pocket_expense/pocket_allocation). Validar que available_balance >= amount para pocket_allocation.",
    "tableId": "movements",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "user_id",
          "fieldValue": "={{ $('Build Complete Context').first().json.user_id }}"
        },
        {
          "fieldId": "type",
          "fieldValue": "={{ $fromAI('type', 'income|fixed_expense|saving_deposit|pocket_allocation|pocket_expense|pocket_return', 'string') }}"
        },
        {
          "fieldId": "account_id",
          // ✅ MEJORADO: Clarificar cuándo es requerido
          "fieldValue": "={{ ($fromAI('account_id', 'UUID de cuenta. REQUERIDO para type=income. Dejar null en otros casos.', 'string') || '').trim() || null }}"
        },
        {
          "fieldId": "category_id",
          // ✅ MEJORADO: Clarificar cuándo es requerido/opcional
          "fieldValue": "={{ ($fromAI('category_id', 'UUID de categoría. REQUERIDO para fixed_expense y saving_deposit. OPCIONAL para pocket_expense (si se quiere categorizar el gasto dentro de la bolsa). Null en otros casos.', 'string') || '').trim() || null }}"
        },
        {
          "fieldId": "pocket_id",
          // ✅ MEJORADO: Clarificar cuándo es requerido
          "fieldValue": "={{ ($fromAI('pocket_id', 'UUID de bolsa. REQUERIDO para pocket_allocation, pocket_expense y pocket_return. Null en otros casos.', 'string') || '').trim() || null }}"
        },
        {
          "fieldId": "amount",
          "fieldValue": "={{ $fromAI('amount', 'Monto del movimiento (número mayor a 0)', 'number') }}"
        },
        {
          "fieldId": "currency",
          // ✅ MEJORADO: Recordar validación de monedas
          "fieldValue": "={{ $fromAI('currency', 'Moneda del movimiento. DEBE coincidir con la moneda de la cuenta/bolsa relacionada.', 'string', $('Build Complete Context').first().json.profile.currency) }}"
        },
        {
          "fieldId": "date",
          "fieldValue": "={{ $fromAI('date', 'Fecha del movimiento YYYY-MM-DD (hoy si no se especifica)', 'string', $now.format('yyyy-MM-dd')) }}"
        },
        {
          "fieldId": "description",
          "fieldValue": "={{ ($fromAI('description', 'Descripción opcional del movimiento', 'string') || '').trim() || null }}"
        },
        {
          "fieldId": "metadata",
          "fieldValue": "={{ $fromAI('metadata', 'Metadatos adicionales en formato JSON (opcional)', 'string') || null }}"
        }
      ]
    }
  }
}
```

---

## 🔄 Trigger SQL Necesario en Supabase

**Este trigger es CRÍTICO para que los ingresos actualicen el balance de las cuentas:**

```sql
-- ============================================
-- TRIGGER: Actualizar balance de cuenta al crear ingreso
-- ============================================

CREATE OR REPLACE FUNCTION update_account_balance_on_income()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar movimientos de tipo 'income' que tengan account_id
  IF NEW.type = 'income' AND NEW.account_id IS NOT NULL THEN
    UPDATE accounts 
    SET 
      balance = balance + NEW.amount,
      updated_at = NOW()
    WHERE id = NEW.account_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trg_update_account_balance_on_income ON movements;

CREATE TRIGGER trg_update_account_balance_on_income
AFTER INSERT ON movements
FOR EACH ROW 
WHEN (NEW.type = 'income' AND NEW.account_id IS NOT NULL)
EXECUTE FUNCTION update_account_balance_on_income();
```

---

## 🔄 Función SQL para búsqueda case-insensitive de categorías

**Esta función ayudará al agente a buscar categorías similares:**

```sql
-- ============================================
-- FUNCIÓN: Buscar categoría por nombre (case-insensitive)
-- ============================================

CREATE OR REPLACE FUNCTION find_category_by_name(
  p_user_id UUID,
  p_name TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  icon TEXT,
  color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.type,
    c.icon,
    c.color
  FROM categories c
  WHERE 
    c.user_id = p_user_id 
    AND LOWER(c.name) = LOWER(p_name)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Uso desde n8n:
-- SELECT * FROM find_category_by_name('user-id-aqui', 'supermercado');
```

---

## 🔄 Función SQL para búsqueda case-insensitive de bolsas

```sql
-- ============================================
-- FUNCIÓN: Buscar bolsa activa por nombre (case-insensitive)
-- ============================================

CREATE OR REPLACE FUNCTION find_active_pocket_by_name(
  p_user_id UUID,
  p_name TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  currency TEXT,
  current_balance NUMERIC,
  allocated_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.type,
    p.currency,
    p.current_balance,
    p.allocated_amount
  FROM pockets p
  WHERE 
    p.user_id = p_user_id 
    AND LOWER(p.name) LIKE LOWER('%' || p_name || '%')
    AND p.status = 'active'
  ORDER BY 
    -- Priorizar coincidencias exactas
    CASE WHEN LOWER(p.name) = LOWER(p_name) THEN 1 ELSE 2 END,
    p.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 Función SQL para validar consistencia de monedas

```sql
-- ============================================
-- FUNCIÓN: Validar que las monedas coincidan
-- ============================================

CREATE OR REPLACE FUNCTION validate_currency_match(
  p_movement_type TEXT,
  p_account_id UUID,
  p_pocket_id UUID,
  p_movement_currency TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_account_currency TEXT;
  v_pocket_currency TEXT;
BEGIN
  -- Validar para income
  IF p_movement_type = 'income' AND p_account_id IS NOT NULL THEN
    SELECT currency INTO v_account_currency 
    FROM accounts 
    WHERE id = p_account_id;
    
    IF v_account_currency IS NULL THEN
      RETURN QUERY SELECT FALSE, 'Cuenta no encontrada';
    ELSIF v_account_currency != p_movement_currency THEN
      RETURN QUERY SELECT FALSE, 
        'La cuenta está en ' || v_account_currency || ', no puedo agregar ingreso en ' || p_movement_currency;
    ELSE
      RETURN QUERY SELECT TRUE, NULL;
    END IF;
    RETURN;
  END IF;
  
  -- Validar para pocket_allocation y pocket_expense
  IF p_movement_type IN ('pocket_allocation', 'pocket_expense', 'pocket_return') 
     AND p_pocket_id IS NOT NULL THEN
    SELECT currency INTO v_pocket_currency 
    FROM pockets 
    WHERE id = p_pocket_id;
    
    IF v_pocket_currency IS NULL THEN
      RETURN QUERY SELECT FALSE, 'Bolsa no encontrada';
    ELSIF v_pocket_currency != p_movement_currency THEN
      RETURN QUERY SELECT FALSE, 
        'La bolsa está en ' || v_pocket_currency || ', no puedo asignar ' || p_movement_currency;
    ELSE
      RETURN QUERY SELECT TRUE, NULL;
    END IF;
    RETURN;
  END IF;
  
  -- Si no aplica validación, es válido
  RETURN QUERY SELECT TRUE, NULL;
END;
$$ LANGUAGE plpgsql;

-- Uso desde n8n (en un nodo Code previo al create_movement):
-- SELECT * FROM validate_currency_match('income', 'account-id', NULL, 'USD');
```

---

## 📋 Nodo adicional recomendado: Validation Node

**Agregar ANTES del Tool: Create Movement:**

```javascript
// Nodo: Validate Movement
// Tipo: Code Node

const movementType = $fromAI('type', '', 'string');
const accountId = $fromAI('account_id', '', 'string');
const pocketId = $fromAI('pocket_id', '', 'string');
const amount = $fromAI('amount', '', 'number');
const currency = $fromAI('currency', '', 'string');

const context = $('Build Complete Context').first().json;

let errors = [];

// Validar moneda para income
if (movementType === 'income' && accountId) {
  const account = context.accounts.find(a => a.id === accountId);
  if (account && account.currency !== currency) {
    errors.push(`La cuenta está en ${account.currency}, no puedo agregar ingreso en ${currency}`);
  }
}

// Validar moneda para pocket_allocation/pocket_expense
if (['pocket_allocation', 'pocket_expense'].includes(movementType) && pocketId) {
  const pocket = context.pockets.find(p => p.id === pocketId);
  if (pocket && pocket.currency !== currency) {
    errors.push(`La bolsa está en ${pocket.currency}, no puedo asignar ${currency}`);
  }
}

// Validar saldo disponible para pocket_allocation
if (movementType === 'pocket_allocation') {
  const available = context.summary.available_balance || 0;
  if (amount > available) {
    errors.push(`No hay suficiente disponible. Tienes ${available} y quieres asignar ${amount}`);
  }
}

if (errors.length > 0) {
  return {
    json: {
      success: false,
      error: errors[0] // Retornar primer error
    }
  };
}

return {
  json: {
    success: true,
    validated: true
  }
};
```

---

## 🎯 Resumen de Prioridades

### 🔴 CRÍTICO (implementar YA)
1. ✅ Agregar campo `balance` en Tool: Create Account
2. ✅ Crear trigger `update_account_balance_on_income()`
3. ✅ Corregir tipos válidos en Tool: Create Category
4. ✅ Agregar validación de monedas (nodo Validation o en prompt)

### 🟡 ALTO (implementar esta semana)
5. ✅ Agregar campo `emoji` en Tool: Create Pocket
6. ✅ Inicializar `current_balance` en Tool: Create Pocket
7. ✅ Mejorar descriptions de las tools con validaciones explícitas
8. ✅ Crear funciones SQL helper para búsquedas case-insensitive

### 🟢 MEDIO (mejoras de UX)
9. ✅ Actualizar prompt del agente con AGENT_PROMPT_V3.md
10. ✅ Agregar tabla EMOJI_MAP al contexto del agente
11. ✅ Implementar nodo de validación pre-movement

### 🔵 BAJO (optimizaciones futuras)
12. ⏳ Logging estructurado de acciones del agente
13. ⏳ Tests E2E del workflow
14. ⏳ Versionado del workflow en Git
