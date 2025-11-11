# Edge Function: finish-period

Esta Edge Function permite finalizar un período activo, cambiando su status a `'finished'` y opcionalmente creando una transacción de devolución del saldo restante.

## Funcionalidad

1. **Validaciones**:
   - Verifica que el usuario esté autenticado
   - Valida que el periodo exista y pertenezca al usuario
   - Verifica que el periodo esté en estado `'active'`
   - Si se solicita devolución, valida la cuenta destino

2. **Actualización del Periodo**:
   - Cambia el status del periodo a `'finished'`
   - El periodo deja de aceptar nuevas transacciones

3. **Devolución del Saldo (Opcional)**:
   - Si `create_refund_transaction = true` y `remaining_amount > 0`
   - Crea una transacción de transferencia desde la cuenta del periodo hacia la cuenta especificada
   - Actualiza los balances de ambas cuentas

## Payload

```typescript
{
  period_id: string;                    // ID del periodo a finalizar (requerido)
  create_refund_transaction?: boolean;  // Si crear transacción de devolución (opcional)
  refund_to_account_id?: string;        // Cuenta destino para la devolución (opcional)
}
```

## Ejemplos de Uso

### Finalizar periodo sin devolución

```typescript
const result = await finishPeriod({
  period_id: 'uuid-periodo'
});
```

### Finalizar periodo con devolución del saldo restante

```typescript
const result = await finishPeriod({
  period_id: 'uuid-periodo',
  create_refund_transaction: true,
  refund_to_account_id: 'uuid-cuenta-principal'
});
```

## Respuesta Exitosa

```typescript
{
  success: true,
  period: Period,                    // Periodo actualizado con status 'finished'
  refund_transaction?: Transaction,  // Transacción de devolución (si aplica)
  message: string                    // Mensaje descriptivo del resultado
}
```

## Errores Posibles

- `Missing authorization header` (401)
- `Unauthorized` (401)
- `Missing required field: period_id` (400)
- `Period not found or does not belong to user` (404)
- `Cannot finish period with status 'X'` (400)
- `Refund account not found or does not belong to user` (404)
- `Failed to finish period` (500)

## Deployment

### 1. Deploy la función

```bash
supabase functions deploy finish-period
```

### 2. Set environment variables (si no están seteadas)

```bash
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
```

### 3. Verificar deployment

```bash
supabase functions list
```

## Flujo de Usuario

1. El usuario ve un periodo activo en el dashboard con el módulo `PeriodBalanceModule`
2. Hace click en "Finalizar Periodo"
3. Se muestra confirmación indicando si hay saldo restante a devolver
4. Al confirmar, se llama a la edge function `finish-period`
5. Si hay `remaining_amount > 0`, se crea automáticamente una transacción de transferencia
6. El periodo cambia a status `'finished'`
7. El toggle "¿Pertenece al periodo activo?" en gastos se deshabilita hasta crear un nuevo periodo

## Notas Técnicas

- La transacción de devolución tiene `scope = 'outside_period'` y `type = 'transfer'`
- La metadata incluye `related_period_id` y `transfer_type = 'period_refund'`
- Si falla la creación de la transacción, el periodo igual se marca como finalizado con un warning
- Los balances de las cuentas se actualizan automáticamente
