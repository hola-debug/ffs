# 🤖 Widget de IA - Configuración

## 📋 Resumen

El widget de IA permite registrar transacciones mediante:
- ✍️ **Chat de texto**: Escribe "gasté 500 en almuerzo"
- 🎤 **Entrada de voz**: Presiona el botón del micrófono y habla

## 🚀 Componentes implementados

### 1. Frontend (React)
- `src/components/AITransactionWidget.tsx` - Widget flotante con chat y voz
- `src/config/ai.config.ts` - Configuración de webhooks

### 2. Características del widget

✅ Botón flotante en la esquina inferior derecha  
✅ Chat con historial de mensajes  
✅ Entrada de texto con validación  
✅ Grabación de voz con feedback visual  
✅ Animaciones suaves con Framer Motion  
✅ Responsive y accesible  
✅ Estados de carga e error manejados  

## ⚙️ Configuración

### Paso 1: Variables de entorno

Crea o actualiza tu archivo `.env`:

```env
# Webhooks de n8n
VITE_N8N_TEXT_WEBHOOK=https://tu-servidor.com/webhook/ai-transaction
VITE_N8N_VOICE_WEBHOOK=https://tu-servidor.com/webhook/ai-voice-transaction
```

### Paso 2: Configurar n8n

#### Opción A: n8n Cloud (recomendado para empezar)

1. Registrarse en [n8n.cloud](https://n8n.io)
2. Crear un nuevo workflow
3. Configurar los webhooks (ver workflows más abajo)

#### Opción B: n8n Self-hosted

```bash
# Con Docker
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# O con npm
npm install -g n8n
n8n
```

Accede a `http://localhost:5678`

## 🔧 Workflows de n8n

### Workflow 1: Texto → Transacción

```
1. Webhook Trigger
   - Path: /ai-transaction
   - Method: POST
   
2. OpenAI Node (GPT-4 o Claude)
   - Prompt:
     "Extrae información de esta transacción: '{{$json.message}}'
      Responde SOLO con JSON:
      {
        "amount": number,
        "category": string,
        "type": "income" | "expense",
        "date": "YYYY-MM-DD",
        "notes": string
      }"
   
3. Function Node (Mapeo de categorías)
   - Mapear nombres de categorías a IDs de tu base de datos
   - Ejemplo: "almuerzo" → category_id de "Alimentación"

4. Supabase Node (INSERT)
   - Table: transactions
   - Fields:
     {
       user_id: "{{$json.userId}}",
       amount: "{{$json.amount}}",
       category_id: "{{$json.category_id}}",
       type: "{{$json.type}}",
       date: "{{$json.date}}",
       notes: "{{$json.notes}}"
     }

5. Response
   - Return JSON:
     {
       "success": true,
       "message": "✅ Registré un gasto de {{$json.amount}} en {{$json.category}}"
     }
```

### Workflow 2: Voz → Transacción

```
1. Webhook Trigger
   - Path: /ai-voice-transaction
   - Method: POST
   - Accept: multipart/form-data

2. Whisper API Node (Transcripción)
   - File: {{$binary.audio}}
   - Model: whisper-1

3. OpenAI Node (Análisis del texto)
   - Mismo prompt que el workflow de texto
   
4-6. (Igual que workflow 1: Function, Supabase, Response)
   - Agregar "transcription" al response
```

## 📝 Ejemplo de prompt mejorado para OpenAI

```json
{
  "role": "system",
  "content": "Eres un asistente de finanzas. Extrae información de transacciones y devuelve SOLO JSON válido."
}

{
  "role": "user",
  "content": "Del siguiente mensaje, extrae: {amount, category, type ('income' o 'expense'), date (fecha de hoy si no se especifica), notes}.\n\nMensaje: '{{$json.message}}'\n\nCategorías válidas: Alimentación, Transporte, Servicios, Entretenimiento, Salud, Educación, Ropa, Otros, Salario, Freelance, Inversiones.\n\nRespuesta (SOLO JSON):"
}
```

## 🔗 Integración con Supabase

El workflow debe insertar en la tabla `transactions` con esta estructura:

```sql
INSERT INTO transactions (
  user_id,
  account_id,  -- Obtener cuenta principal del usuario
  category_id, -- Mapear desde el nombre
  type,        -- 'income' o 'expense'
  amount,
  currency,    -- 'UYU' por defecto
  date,
  notes,
  is_random,   -- false por defecto
  is_fixed     -- false por defecto
) VALUES (...)
```

## 🎯 Mapeo de categorías

Crear una función en n8n para mapear nombres a IDs:

```javascript
// Function Node en n8n
const categoryMap = {
  'almuerzo': 'uuid-de-alimentacion',
  'comida': 'uuid-de-alimentacion',
  'uber': 'uuid-de-transporte',
  'taxi': 'uuid-de-transporte',
  'netflix': 'uuid-de-servicios',
  'gimnasio': 'uuid-de-salud',
  // ... agregar más
};

const inputCategory = $json.category.toLowerCase();
const categoryId = categoryMap[inputCategory] || 'uuid-de-otros';

return {
  ...json,
  category_id: categoryId
};
```

## 🧪 Testing local

Mientras configuras n8n, puedes probar con un servidor mock:

```javascript
// Crear un archivo test-webhook.js
import express from 'express';
const app = express();
app.use(express.json());

app.post('/ai-transaction', (req, res) => {
  console.log('Received:', req.body);
  res.json({
    success: true,
    message: `✅ Registré: ${req.body.message}`
  });
});

app.listen(3001, () => console.log('Mock webhook en http://localhost:3001'));
```

Luego en `.env`:
```
VITE_N8N_TEXT_WEBHOOK=http://localhost:3001/ai-transaction
```

## 📱 Uso del widget

### Texto
1. Click en el botón flotante 💬
2. Escribe: "gasté 500 en almuerzo"
3. Presiona Enter o el botón 📤
4. La IA procesa y registra la transacción

### Voz
1. Click en el botón flotante 💬
2. Presiona el botón 🎤
3. Habla tu transacción
4. Presiona ⏹️ para detener
5. La IA transcribe, procesa y registra

## 🎨 Personalización

### Cambiar colores del widget

```tsx
// src/components/AITransactionWidget.tsx

// Botón flotante
className="... bg-gradient-to-br from-blue-500 to-purple-600"

// Header del chat
className="bg-gradient-to-r from-blue-500 to-purple-600"
```

### Agregar más idiomas

```tsx
// En el placeholder del input
placeholder="Escribe tu transacción..."  // Español
placeholder="Type your transaction..."   // Inglés
```

## 💰 Costos estimados

### OpenAI API
- GPT-4: ~$0.03 por transacción
- GPT-3.5-turbo: ~$0.002 por transacción (más económico)
- Whisper: ~$0.006 por minuto de audio

### Alternativas gratuitas/económicas
- **Claude (Anthropic)**: Similar a GPT-4, pricing competitivo
- **Ollama** (local): Gratis, modelos open-source (llama2, mistral)
- **Groq**: API gratuita (limitada), muy rápida

## 🔒 Seguridad

### Validar usuario en n8n

```javascript
// Function Node - Verificar autenticación
const userId = $json.userId;

if (!userId) {
  return { error: 'No autorizado' };
}

// Verificar que el user_id existe en Supabase
// antes de insertar transacción
```

### Rate limiting

Configurar en n8n:
- Máximo 10 requests por minuto por usuario
- Usar caché para evitar procesamientos duplicados

## 📊 Monitoreo

En n8n puedes ver:
- ✅ Ejecuciones exitosas
- ❌ Ejecuciones fallidas
- ⏱️ Tiempo de procesamiento
- 📈 Logs de cada nodo

## 🆘 Troubleshooting

### El micrófono no funciona
- Verificar permisos del navegador
- Solo funciona con HTTPS (o localhost)
- Probar con `chrome://settings/content/microphone`

### Webhook no responde
- Verificar que n8n esté corriendo
- Verificar las URLs en `.env`
- Revisar logs de n8n
- Probar con Postman/curl primero

### Transacción no se guarda
- Verificar IDs de categorías
- Verificar formato de fecha
- Revisar RLS de Supabase
- Ver logs en Supabase Dashboard

## 🚀 Próximos pasos

1. **Inteligencia contextual**: Recordar patrones del usuario
2. **Sugerencias automáticas**: "Parece un martes, ¿almuerzo de nuevo?"
3. **Análisis de gastos**: "Esta semana gastaste 30% más en comida"
4. **Notificaciones**: Alertas cuando gastes mucho
5. **Multi-idioma**: Soportar inglés, portugués, etc.

## 📚 Recursos

- [n8n Documentation](https://docs.n8n.io)
- [OpenAI API](https://platform.openai.com/docs)
- [Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**¡Listo para usar! 🎉**

Una vez configurado n8n, tu aplicación tendrá IA conversacional para registrar transacciones de forma natural.
