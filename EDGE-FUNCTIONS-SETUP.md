# 🚀 Edge Functions - Setup & Deployment Guide

Esta guía explica cómo configurar y desplegar las Edge Functions para FFS Finance.

## 📋 Prerequisitos

1. Tener una cuenta de Supabase activa
2. Tener el proyecto de Supabase creado
3. Tener instalado Supabase CLI

## 🔧 Instalación de Supabase CLI

### Linux / macOS
```bash
npm install -g supabase
# o
brew install supabase/tap/supabase
```

### Windows
```bash
npm install -g supabase
# o usar scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Verificar instalación:
```bash
supabase --version
```

## 🔑 Login y Link al Proyecto

### 1. Login en Supabase CLI

```bash
supabase login
```

Esto abrirá un navegador para autenticarte. Una vez autenticado, recibirás un token de acceso.

### 2. Link al Proyecto

Obtén tu Project Reference ID desde el dashboard de Supabase (Settings > General > Reference ID).

```bash
supabase link --project-ref <tu-project-ref>
```

Ejemplo:
```bash
supabase link --project-ref abcdefghijklmnop
```

## 📂 Estructura de Directorios

Las Edge Functions deben estar en:
```
supabase/
└── functions/
    ├── create-transaction/
    │   └── index.ts
    ├── create-period/
    │   └── index.ts
    └── dashboard-refresh/
        └── index.ts
```

Esta estructura ya está creada en el proyecto.

## 🌐 Variables de Entorno

Las Edge Functions necesitan acceso a variables de entorno. Supabase proporciona automáticamente:

- `SUPABASE_URL` - URL de tu proyecto
- `SUPABASE_ANON_KEY` - Anon key pública
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (solo disponible en funciones)

Estas variables se configuran automáticamente, **no necesitas hacer nada adicional**.

## 🚀 Deployment

### Desplegar todas las funciones

```bash
supabase functions deploy
```

### Desplegar una función específica

```bash
# Desplegar create-transaction
supabase functions deploy create-transaction

# Desplegar create-period
supabase functions deploy create-period

# Desplegar dashboard-refresh
supabase functions deploy dashboard-refresh
```

### Ver logs en tiempo real

Durante el desarrollo, puedes ver los logs:

```bash
# Logs de todas las funciones
supabase functions logs

# Logs de una función específica
supabase functions logs create-transaction

# Seguir logs en vivo
supabase functions logs --tail
```

## 🧪 Testing Local (Opcional)

Puedes ejecutar las Edge Functions localmente antes de desplegar:

### 1. Iniciar Supabase localmente

```bash
supabase start
```

### 2. Servir las funciones localmente

```bash
supabase functions serve
```

Esto iniciará un servidor local en `http://localhost:54321/functions/v1/`

### 3. Probar la función

```bash
# Con curl
curl -X POST \
  http://localhost:54321/functions/v1/create-transaction \
  -H "Authorization: Bearer <tu-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "uuid-aqui",
    "type": "expense",
    "amount": 100,
    "description": "Test local"
  }'
```

### 4. Detener servidor local

```bash
supabase stop
```

## 🔒 Seguridad y CORS

Las Edge Functions ya tienen configurado CORS para aceptar requests desde cualquier origen (`*`). En producción, puedes restringir esto modificando las respuestas OPTIONS en cada función:

```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', {
    headers: {
      'Access-Control-Allow-Origin': 'https://tu-dominio.com', // Cambiar aquí
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}
```

## 📊 Monitoreo

### Ver información de las funciones desplegadas

```bash
supabase functions list
```

### Ver detalles de una función

```bash
supabase functions inspect create-transaction
```

### Ver métricas (desde el dashboard)

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a "Edge Functions"
3. Selecciona la función que quieres monitorear
4. Verás:
   - Número de invocaciones
   - Tiempo de ejecución promedio
   - Errores
   - Logs

## 🔄 Actualización de Funciones

Cuando hagas cambios en el código de las funciones, simplemente vuelve a desplegar:

```bash
# Desplegar función modificada
supabase functions deploy create-transaction

# O todas a la vez
supabase functions deploy
```

Los cambios se aplican **inmediatamente** sin downtime.

## 🌍 URLs de las Funciones

Una vez desplegadas, las funciones estarán disponibles en:

```
https://<project-ref>.supabase.co/functions/v1/create-transaction
https://<project-ref>.supabase.co/functions/v1/create-period
https://<project-ref>.supabase.co/functions/v1/dashboard-refresh
```

Donde `<project-ref>` es tu Project Reference ID.

## 💻 Uso desde el Cliente

Ya hay helpers creados en `src/lib/edgeFunctions.ts` que manejan las llamadas a las Edge Functions:

```typescript
import { createTransaction, createPeriod } from '@/lib/edgeFunctions';

// Usar en componentes
const result = await createTransaction({
  account_id: 'uuid',
  type: 'expense',
  amount: 100,
});
```

Ver ejemplos completos en `src/lib/edgeFunctions.examples.tsx`.

## 🐛 Troubleshooting

### Error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY"

Las Edge Functions necesitan estas variables, pero Supabase las proporciona automáticamente. Si ves este error:

1. Verifica que desplegaste correctamente: `supabase functions deploy`
2. Verifica que estás llamando a la URL correcta
3. Revisa los logs: `supabase functions logs <function-name>`

### Error: "Unauthorized"

Asegúrate de que estás enviando el token JWT en el header `Authorization`:

```typescript
headers: {
  'Authorization': `Bearer ${session.access_token}`,
}
```

### Error: "No active session"

El usuario no está autenticado. Verifica que haya una sesión activa:

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirigir al login
}
```

### La función no se ejecuta

1. Verifica que la función esté desplegada: `supabase functions list`
2. Revisa los logs: `supabase functions logs <function-name>`
3. Verifica que el método HTTP sea POST
4. Verifica el payload JSON

### Errores de CORS

Si ves errores de CORS desde el navegador:

1. Verifica que la función tenga el handler OPTIONS configurado
2. Verifica que los headers CORS estén en las respuestas
3. Considera hacer un redeploy: `supabase functions deploy <function-name>`

## 📝 Checklist de Deployment

- [ ] Supabase CLI instalado
- [ ] Login en Supabase CLI realizado
- [ ] Proyecto linkeado con `supabase link`
- [ ] Schema de base de datos aplicado (ejecutar `supabase-periods-transactions.sql`)
- [ ] Edge Functions desplegadas
- [ ] Variables de entorno configuradas en `.env` del cliente:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Funciones probadas desde el cliente
- [ ] Logs revisados para verificar funcionamiento

## 🎯 Próximos Pasos

1. **Desplegar las funciones:**
   ```bash
   supabase functions deploy
   ```

2. **Actualizar tu aplicación React** para usar los helpers:
   ```typescript
   import { createTransaction } from '@/lib/edgeFunctions';
   ```

3. **Reemplazar llamadas directas a Supabase** por llamadas a las Edge Functions

4. **Monitorear en el dashboard** para asegurar que todo funcione correctamente

## 📚 Recursos

- [Documentación oficial de Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Deno Documentation](https://deno.land/manual) (Edge Functions usan Deno)

## ❓ Preguntas Frecuentes

### ¿Cuánto cuestan las Edge Functions?

- Plan gratuito: 500,000 invocaciones/mes
- Plan Pro: 2,000,000 invocaciones/mes incluidas
- Después de eso: $2 por millón de invocaciones adicionales

### ¿Puedo usar npm packages en las Edge Functions?

Sí, pero debes usar imports desde CDNs como `esm.sh`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
```

### ¿Las Edge Functions tienen acceso a la base de datos?

Sí, a través del cliente de Supabase con el Service Role Key. Sin embargo, es mejor usar RLS (Row Level Security) con el token del usuario para mantener la seguridad.

### ¿Puedo hacer llamadas HTTP externas?

Sí, puedes usar `fetch()` para hacer llamadas a APIs externas.

---

**¡Listo!** Ya tienes todo configurado para usar las Edge Functions. 🎉
