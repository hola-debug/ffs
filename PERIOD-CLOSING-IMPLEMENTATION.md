# Implementación: Cierre de Periodo

Esta implementación permite a los usuarios finalizar un periodo activo con un botón "Finalizar Periodo" que:

1. Cambia el status del periodo a `'finished'`
2. Opcionalmente crea una transacción de transferencia del `remaining_amount` de vuelta a la cuenta principal
3. Actualiza automáticamente el dashboard para reflejar que no hay periodo activo

## Archivos Creados

### 1. Edge Function: `supabase/functions/finish-period/index.ts`

Nueva edge function que maneja el cierre de periodos con las siguientes características:

- **Validaciones completas**: Verifica autenticación, pertenencia del periodo, status activo
- **Actualización de status**: Cambia el periodo a `'finished'`
- **Devolución automática**: Si `remaining_amount > 0`, crea una transacción de transferencia
- **Manejo de errores robusto**: Incluye warnings si algo falla parcialmente

**Payload:**
```typescript
{
  period_id: string;
  create_refund_transaction?: boolean;
  refund_to_account_id?: string;
}
```

### 2. Cliente: `src/lib/edgeFunctions.ts`

Agregado:
- `FinishPeriodPayload` interface
- `FinishPeriodResponse` interface  
- `finishPeriod()` función que llama a la edge function

**Ejemplo de uso:**
```typescript
const result = await finishPeriod({
  period_id: activePeriod.id,
  create_refund_transaction: true,
  refund_to_account_id: primaryAccount.id,
});
```

## Archivos Modificados

### 3. Componente: `src/components/modules/PeriodBalance/index.tsx`

**Mejoras implementadas:**

- ✅ Botón "Finalizar Periodo" con icono de CheckCircle
- ✅ Confirmación con dos pasos antes de finalizar
- ✅ Muestra el monto a devolver si `remaining_amount > 0`
- ✅ Loading state durante la operación
- ✅ Error handling con mensajes claros
- ✅ Refresh automático del dashboard después de finalizar

**UI Flow:**
1. Usuario ve el botón "Finalizar Periodo"
2. Click abre confirmación mostrando si hay saldo a devolver
3. Opciones: Cancelar o Confirmar
4. Durante el proceso muestra "Finalizando..."
5. Éxito: Refresca dashboard automáticamente

### 4. Dashboard: `src/pages/DashboardPage.tsx`

**Cambios:**
- ✅ Importado `PeriodBalanceModule`
- ✅ Agregado módulo en el grid del dashboard
- ✅ Pasa `periods`, `accounts` y `onRefresh` como props

## Comportamiento del Sistema

### Cuando HAY un periodo activo:

```
┌─────────────────────────────────┐
│   SALDO DEL PERIODO             │
│                                 │
│         $1,250                  │
│                                 │
│   Quincenal Nov 1-15            │
│   5 días restantes              │
│   Gastado: $750 / $2,000        │
│                                 │
│   [✓ Finalizar Periodo]         │
└─────────────────────────────────┘
```

### Cuando NO hay periodo activo:

```
┌─────────────────────────────────┐
│   📅                            │
│   No hay periodo activo         │
└─────────────────────────────────┘
```

### Flujo de Confirmación:

```
[✓ Finalizar Periodo] 
        ↓ (click)
┌─────────────────────────────────┐
│ ¿Devolver $1,250 a              │
│ Cuenta Principal?               │
│                                 │
│  [Cancelar]  [Confirmar]        │
└─────────────────────────────────┘
```

## Impacto en Gastos

Después de finalizar un periodo:

1. **Toggle "¿Pertenece al periodo activo?"** se muestra pero no permite selección
2. Muestra warning: "⚠️ No hay un período activo"
3. Todos los gastos nuevos van automáticamente a `scope: 'outside_period'`
4. El usuario debe crear un nuevo periodo para volver a tener gastos en periodo

## Deployment

### Paso 1: Deploy Edge Function

```bash
cd supabase
supabase functions deploy finish-period
```

### Paso 2: Verificar

```bash
supabase functions list
```

Debería aparecer:
- ✅ create-transaction
- ✅ create-period
- ✅ finish-period (NUEVO)

### Paso 3: Test Manual

1. Crear un periodo activo en el dashboard
2. Agregar algunos gastos al periodo
3. Ver el módulo "SALDO DEL PERIODO" en el dashboard
4. Click en "Finalizar Periodo"
5. Confirmar la acción
6. Verificar:
   - Periodo cambia a status 'finished' en la DB
   - Si había `remaining_amount > 0`, se crea transacción de transferencia
   - Toggle de gastos vuelve a "fuera de periodo"

## Base de Datos

No requiere cambios en el schema. La funcionalidad usa:
- Tabla `periods` existente
- Campo `status` con valor `'finished'` (ya permitido)
- Campo `remaining_amount` (calculated field existente)
- Tabla `transactions` para crear la devolución

## Ventajas de esta Implementación

1. **Seguridad**: Todas las validaciones en el servidor (edge function)
2. **Atomicidad**: Si algo falla, el periodo igual se marca como finalizado
3. **Trazabilidad**: La transacción de devolución queda registrada en el historial
4. **UX Simple**: Confirmación clara, loading states, error handling
5. **Flexible**: Puede finalizar sin devolución o con devolución automática
6. **Escalable**: Fácil agregar más lógica de cierre en el futuro

## Próximos Pasos Sugeridos

1. **Analytics**: Agregar tracking de periodos finalizados
2. **Notificaciones**: Enviar email/push cuando se finaliza un periodo
3. **Historial**: Vista de periodos finalizados con detalles
4. **Auto-close**: Opción de cerrar automáticamente cuando `ends_at` llega
5. **Reportes**: Generar reporte PDF del periodo al cerrarlo

## Troubleshooting

### "Failed to finish period"
- Verificar que el periodo existe y está activo
- Verificar permisos RLS en tabla `periods`

### "Refund transaction was not created"
- Verificar que `refund_to_account_id` es válido
- Verificar permisos RLS en tabla `transactions`
- El periodo igual se marca como finalizado

### Toggle no se actualiza después de cerrar
- Verificar que `dispatchDashboardRefresh()` se está llamando
- Verificar suscripciones realtime en `useDashboardData`
