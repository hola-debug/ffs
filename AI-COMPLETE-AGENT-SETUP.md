# 🤖 Agente AI Completo - Gestión Total de Finanzas

## 🎯 Qué Puede Hacer

El agente AI ahora puede gestionar **TODA** tu base de datos financiera:

### ✅ Capacidades Completas

#### 1. **Gestión de Ingresos**
- 💰 "agregué 50000 a mi cuenta banco"
- 💵 "recibí 200 dólares en PayPal"
- 📅 "ingresé mi salario de enero"

#### 2. **Gestión de Cuentas**
- 🏦 "crea una cuenta en dólares"
- 💳 "crear cuenta PayPal en USD"
- 💵 "agregar cuenta de efectivo"

#### 3. **Gestión de Categorías**
- 📁 "crear categoría gimnasio de gasto de bolsa"
- 🏷️ "nueva categoría freelance de ingreso"

#### 4. **Gestión de Bolsas (Pockets)**
- 🍔 "crea una bolsa de comida de 8000 por 15 días"
- 🎬 "crear bolsa de entretenimiento con 5000 por un mes"
- 🏖️ "bolsa de ahorro para vacaciones con meta de 50000"
- 💰 "agregar 2000 más a la bolsa de comida"
- ❌ "cerrar la bolsa de transporte"
- 📊 "extender la bolsa de comida por 7 días más"

#### 5. **Gestión de Gastos**
- 🛒 "gasté 500 en supermercado"
- 🚗 "uber de 300"
- 🏠 "pagué el alquiler de 15000"
- 💡 "pagar servicios de 3000"
- 🐷 "ahorrar 5000 para emergencias"

#### 6. **Consultas e Insights**
- 📊 "cuánto dinero me queda disponible?"
- 💵 "cuánto tengo en la bolsa de comida?"
- 📈 "cuánto gasté este mes?"
- 🎯 "cuánto me falta para mi meta de ahorro?"
- ⚠️ "estoy gastando de más?"

---

## 🚀 Configuración en n8n

### Paso 1: Importar Workflow

1. Abre n8n
2. Click en **"Import from File"**
3. Selecciona `AI-COMPLETE-AGENT.json`
4. El workflow se cargará con todos los nodos

### Paso 2: Configurar Credenciales

#### OpenAI
1. Nodo **"OpenAI Chat Model"**
   - Model: `gpt-4o` (recomendado) o `gpt-4o-mini` (más económico)
   - Conectar tus credenciales de OpenAI

2. Nodo **"Transcribe Audio"**
   - Usar las mismas credenciales de OpenAI
   - Model: `whisper-1`

#### Supabase
Todos los nodos de Supabase deben usar las mismas credenciales:
- **Get Profile**
- **Get Accounts**
- **Get Categories**
- **Get Active Pockets**
- **Get Monthly Summary**
- **Tool: Create Account**
- **Tool: Create Category**
- **Tool: Create Pocket**
- **Tool: Create Movement**
- **Tool: Update Pocket**

Configuración de credenciales Supabase:
```
Host: https://tu-proyecto.supabase.co
Service Role Key: tu-service-role-key
```

### Paso 3: Activar Webhook

1. Click en el nodo **"Webhook"**
2. Copia la URL del webhook de **producción**
3. Guarda esa URL para el frontend

Ejemplo:
```
https://tu-n8n.com/webhook/complete-ai-agent
```

---

## 🔧 Integración con el Frontend

### Actualizar Configuración

Edita `src/config/ai.config.ts`:

```typescript
const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK || 'https://tu-n8n.com/webhook/complete-ai-agent';

export const AI_CONFIG = {
  textWebhook: WEBHOOK_URL,
  voiceWebhook: WEBHOOK_URL,
  recording: {
    maxDuration: 30000,
    mimeType: 'audio/webm',
  },
};
```

### Variables de Entorno

Crea/actualiza `.env`:
```env
VITE_N8N_WEBHOOK=https://tu-n8n.com/webhook/complete-ai-agent
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Flujo Completo de Ingreso
```
Usuario: "recibí mi salario de 50000"

Agente:
1. Detecta que es un ingreso
2. Busca cuenta principal del usuario
3. Crea movimiento tipo 'income'
4. Actualiza balance de cuenta
5. Responde: "✅ Registré tu salario de $50,000 en Banco BROU. 
   Tu disponible ahora es $87,500."
```

### Ejemplo 2: Crear y Usar Bolsa
```
Usuario: "crea una bolsa de comida de 8000 por 15 días"

Agente:
1. Crea pocket con type='expense'
2. Calcula ends_at = hoy + 15 días
3. Crea movement tipo 'pocket_allocation'
4. Responde: "✅ Creé la bolsa 'Comida' con $8,000 por 15 días.
   Tendrás $533.33 diarios para gastar."

---

Usuario: "gasté 500 en supermercado"

Agente:
1. Busca bolsa activa de comida
2. Verifica que tenga saldo suficiente
3. Crea movement tipo 'pocket_expense'
4. Responde: "✅ Registré $500 en supermercado desde tu bolsa de Comida.
   Te quedan $7,500 para 14 días más."
```

### Ejemplo 3: Gasto Fijo
```
Usuario: "pagué el alquiler de 15000"

Agente:
1. Detecta que es gasto fijo
2. Busca categoría 'Alquiler'
3. Crea movement tipo 'fixed_expense' (sin pocket_id)
4. Responde: "✅ Registré el pago de alquiler de $15,000.
   Es un gasto fijo que se resta de tu ingreso disponible."
```

### Ejemplo 4: Multi-Moneda
```
Usuario: "crear cuenta en dólares"

Agente:
1. Crea account con currency='USD'
2. Responde: "✅ Creé una cuenta en USD.
   Ya puedes agregar ingresos en dólares y crear bolsas en esa moneda."

---

Usuario: "agregué 200 dólares a PayPal"

Agente:
1. Busca cuenta PayPal (currency='USD')
2. Crea movement tipo 'income' con currency='USD'
3. Responde: "✅ Agregué $200 USD a tu cuenta PayPal.
   Tu disponible en USD es ahora $500."
```

### Ejemplo 5: Bolsa de Ahorro
```
Usuario: "crear bolsa de ahorro para vacaciones con meta de 50000"

Agente:
1. Crea pocket con type='saving' y target_amount=50000
2. Pregunta: "¿Cuánto quieres asignar ahora a esta bolsa?"

---

Usuario: "agregar 10000"

Agente:
1. Crea movement tipo 'pocket_allocation'
2. Calcula progreso: 10000/50000 = 20%
3. Responde: "✅ Agregué $10,000 a tu bolsa 'Vacaciones'.
   Llevas 20% de tu meta ($10,000 de $50,000)."
```

### Ejemplo 6: Consultas
```
Usuario: "cuánto dinero tengo disponible?"

Agente:
1. Lee user_monthly_summary
2. Calcula disponible por moneda
3. Responde: "Tienes disponible:
   - $42,000 UYU
   - $500 USD
   - $300 EUR
   
   En total: $42,000 UYU + equivalentes."
```

---

## 🧠 Cómo Funciona Internamente

### Flujo de Procesamiento

```
1. Usuario envía mensaje → Webhook
2. Switch Type: ¿texto o voz?
   - Si es voz → Whisper transcribe
3. Merge → combina mensaje procesado
4. Cargar Contexto en Paralelo:
   - Get Profile
   - Get Accounts
   - Get Categories
   - Get Active Pockets
   - Get Monthly Summary
5. Build Complete Context → genera JSON completo
6. Financial AI Agent → procesa con GPT-4o
   - Usa herramientas de Supabase:
     * Tool: Create Account
     * Tool: Create Category
     * Tool: Create Pocket
     * Tool: Create Movement
     * Tool: Update Pocket
7. Respond → devuelve resultado al frontend
```

### Herramientas del Agente

El agente tiene acceso a estas herramientas que puede ejecutar automáticamente:

#### `Tool: Create Account`
```json
{
  "user_id": "xxx",
  "name": "PayPal",
  "type": "wallet",
  "currency": "USD",
  "balance": 0,
  "is_primary": false
}
```

#### `Tool: Create Category`
```json
{
  "user_id": "xxx",
  "name": "Gimnasio",
  "type": "pocket_expense",
  "icon": "💪",
  "color": "#10b981"
}
```

#### `Tool: Create Pocket`
```json
{
  "user_id": "xxx",
  "name": "Comida Quincenal",
  "type": "expense",
  "emoji": "🍔",
  "allocated_amount": 8000,
  "currency": "UYU",
  "starts_at": "2025-01-12",
  "ends_at": "2025-01-27",
  "target_amount": null,
  "auto_return_remaining": true
}
```

#### `Tool: Create Movement`
```json
{
  "user_id": "xxx",
  "type": "pocket_expense",
  "account_id": null,
  "category_id": "cat-xxx",
  "pocket_id": "pocket-xxx",
  "amount": 500,
  "currency": "UYU",
  "date": "2025-01-12",
  "description": "Compra en supermercado",
  "metadata": {
    "ai_generated": true,
    "confidence": 0.95
  }
}
```

#### `Tool: Update Pocket`
```json
{
  "id": "pocket-xxx",
  "name": "Comida Extendida",
  "ends_at": "2025-02-05",
  "status": "active"
}
```

---

## 🎨 Personalización del Prompt

### Modificar Comportamiento

Puedes editar el prompt en el nodo **"Financial AI Agent"** para:

1. **Cambiar el tono**
   ```
   Sé más formal / más casual / más técnico
   ```

2. **Agregar validaciones**
   ```
   - Siempre confirma gastos mayores a $10,000
   - Alerta si el disponible baja de $5,000
   ```

3. **Agregar sugerencias proactivas**
   ```
   - Sugiere crear bolsas si detecta gastos recurrentes
   - Recomienda ahorrar si el disponible es muy alto
   ```

4. **Multi-idioma**
   ```
   Detecta el idioma del mensaje y responde en ese idioma
   ```

### Ejemplo de Personalización

```javascript
// En el systemMessage del agente
"Siempre:
1. Valida que la operación sea posible (saldo suficiente)
2. Si el gasto excede el 50% de la bolsa, confirma con el usuario
3. Si detectas un gasto recurrente sin categoría, sugiere crearla
4. Al final de cada respuesta, da un tip financiero
5. Si el disponible baja de $5,000, alerta al usuario"
```

---

## 📊 Monitoreo y Debug

### Ver Ejecuciones en n8n

1. Click en **"Executions"** en n8n
2. Verás cada mensaje procesado
3. Puedes ver:
   - Input del usuario
   - Contexto cargado
   - Decisiones del agente
   - Herramientas ejecutadas
   - Output final

### Logs Útiles

En el nodo **"Build Complete Context"** puedes agregar logs:

```javascript
console.log('User ID:', profile.id);
console.log('Accounts:', accounts.length);
console.log('Pockets:', pockets.length);
console.log('Available Balance:', summary.available_balance);
```

---

## 💰 Costos Estimados

### OpenAI API

**GPT-4o** (recomendado):
- Input: $2.50 por 1M tokens
- Output: $10 por 1M tokens
- **Costo por mensaje:** ~$0.05 - $0.15

**GPT-4o-mini** (económico):
- Input: $0.15 por 1M tokens
- Output: $0.60 por 1M tokens
- **Costo por mensaje:** ~$0.002 - $0.01

**Whisper** (transcripción de voz):
- $0.006 por minuto de audio
- **Costo promedio:** $0.01 - $0.03 por mensaje de voz

### Ejemplo Mensual
Con 300 mensajes al mes:
- GPT-4o: ~$15 - $45/mes
- GPT-4o-mini: ~$1 - $3/mes
- Whisper (si 50% son voz): ~$5/mes

---

## 🔒 Seguridad

### Validaciones del Agente

El agente SIEMPRE valida:

1. ✅ **user_id presente** en todas las operaciones
2. ✅ **Saldo suficiente** antes de gastar
3. ✅ **Bolsa existe y está activa** antes de asignar
4. ✅ **Fechas válidas** en bolsas (ends_at >= starts_at)
5. ✅ **Monedas coherentes** (no mezclar USD con UYU sin conversión)

### RLS en Supabase

Asegúrate de tener RLS activo:
```sql
-- Ya configurado en supabase-new-schema.sql
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see own movements"
ON movements FOR SELECT
USING (auth.uid() = user_id);
```

### Rate Limiting

En n8n puedes configurar:
- Máximo 10 requests por minuto por usuario
- Timeout de 30 segundos por request

---

## 🆘 Troubleshooting

### El agente no entiende el comando
**Problema:** Responde "No entendí tu mensaje"

**Solución:**
1. Sé más específico: en vez de "gasté", usa "gasté 500 en comida"
2. Revisa el prompt del agente para agregar más ejemplos
3. Verifica que el contexto esté cargando correctamente

### No se crean movimientos
**Problema:** El agente dice que hizo algo pero no aparece en la DB

**Solución:**
1. Verifica las credenciales de Supabase
2. Revisa los logs de n8n en "Executions"
3. Verifica que el user_id sea correcto
4. Chequea RLS policies en Supabase

### Errores de "pocket_id required"
**Problema:** Error al crear gasto desde bolsa

**Solución:**
1. El agente debe pasar `pocket_id` cuando `type='pocket_expense'`
2. Verifica que la bolsa existe y está activa
3. Mejora el prompt para que siempre incluya `pocket_id`

### Costos muy altos
**Problema:** Factura de OpenAI elevada

**Solución:**
1. Cambia de GPT-4o a GPT-4o-mini
2. Reduce el tamaño del contexto (solo datos necesarios)
3. Implementa caché de respuestas frecuentes
4. Usa alternativas: Claude, Llama 3, Mistral

---

## 🚀 Próximos Pasos

### Mejoras Sugeridas

1. **Memoria Conversacional**
   - Recordar contexto de mensajes anteriores
   - "agregar más a eso" → sabe a qué te refieres

2. **Sugerencias Inteligentes**
   - "Gastas mucho en comida últimamente, ¿aumentar la bolsa?"
   - "Tienes $20,000 disponibles, ¿crear una bolsa de ahorro?"

3. **Análisis Predictivo**
   - "A este ritmo te quedarás sin dinero en 10 días"
   - "Proyección de gastos para fin de mes: $45,000"

4. **Alertas Proactivas**
   - Notificar cuando una bolsa se está acabando
   - Alertar si hay gastos inusuales

5. **Exportar Reports**
   - "envíame un resumen del mes en PDF"
   - "exportar mis gastos de enero"

6. **Integración con Bancos**
   - Sincronizar automáticamente con APIs bancarias
   - Detectar ingresos/gastos automáticamente

---

## 📚 Recursos

- [n8n Documentation](https://docs.n8n.io)
- [OpenAI API](https://platform.openai.com/docs)
- [GPT-4o Models](https://platform.openai.com/docs/models/gpt-4o)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

---

**¡Tu agente AI está listo para gestionar todas tus finanzas! 🎉**

Ahora puedes hablarle de forma natural y se encargará de TODO:
- ✅ Agregar ingresos
- ✅ Crear bolsas
- ✅ Registrar gastos
- ✅ Gestionar cuentas
- ✅ Crear categorías
- ✅ Consultar balances
- ✅ Dar sugerencias

**¡Solo habla con él!** 💬
