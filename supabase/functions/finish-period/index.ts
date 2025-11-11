import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars.');
}

interface FinishPeriodPayload {
  period_id: string;
  create_refund_transaction?: boolean; // Si true, crea transferencia del remaining_amount de vuelta
  refund_to_account_id?: string; // Cuenta destino para la transferencia del remaining_amount
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Obtener token de autorización
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload: FinishPeriodPayload = await req.json();

    // ====== VALIDACIONES ======
    
    // Validación 1: Campo obligatorio
    if (!payload.period_id) {
      return new Response(JSON.stringify({ 
        error: 'Missing required field: period_id' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 2: Verificar que el periodo pertenece al usuario
    const { data: period, error: periodError } = await supabase
      .from('periods')
      .select('*')
      .eq('id', payload.period_id)
      .eq('user_id', user.id)
      .single();

    if (periodError || !period) {
      return new Response(JSON.stringify({ 
        error: 'Period not found or does not belong to user' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 3: Verificar que el periodo esté activo
    if (period.status !== 'active') {
      return new Response(JSON.stringify({ 
        error: `Cannot finish period with status '${period.status}'. Only 'active' periods can be finished.` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 4: Si se solicita refund, validar cuenta destino
    let refundAccount = null;
    if (payload.create_refund_transaction && payload.refund_to_account_id) {
      const { data: targetAccount, error: targetAccountError } = await supabase
        .from('accounts')
        .select('id, currency, balance')
        .eq('id', payload.refund_to_account_id)
        .eq('user_id', user.id)
        .single();

      if (targetAccountError || !targetAccount) {
        return new Response(JSON.stringify({ 
          error: 'Refund account not found or does not belong to user' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      refundAccount = targetAccount;
    }

    // ====== ACTUALIZAR STATUS DEL PERIODO ======
    
    const { data: updatedPeriod, error: updateError } = await supabase
      .from('periods')
      .update({ status: 'finished' })
      .eq('id', payload.period_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating period:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to finish period',
        details: updateError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ====== CREAR TRANSACCIÓN DE DEVOLUCIÓN (OPCIONAL) ======
    
    let refundTransaction = null;

    if (payload.create_refund_transaction && 
        payload.refund_to_account_id && 
        updatedPeriod.remaining_amount > 0) {
      
      // Crear transacción de transferencia del remaining_amount de vuelta a la cuenta
      const transferData = {
        user_id: user.id,
        account_id: period.account_id, // Desde la cuenta del periodo
        type: 'transfer',
        scope: 'outside_period',
        amount: updatedPeriod.remaining_amount,
        currency: period.currency,
        date: new Date().toISOString().split('T')[0],
        description: `Devolución de saldo restante del periodo: ${period.name}`,
        is_random: false,
        is_fixed: false,
        is_recurring: false,
        metadata: {
          related_period_id: period.id,
          transfer_type: 'period_refund',
          to_account_id: payload.refund_to_account_id,
        },
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transferData)
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating refund transaction:', transactionError);
        // No falla la operación completa, solo se registra el error
        return new Response(JSON.stringify({ 
          success: true,
          period: updatedPeriod,
          message: `Period finished successfully, but failed to create refund transaction: ${transactionError.message}`,
          warning: 'Refund transaction was not created. You may need to create it manually.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      refundTransaction = transaction;

      // Actualizar balances de las cuentas
      // Restar del periodo
      const { error: debitError } = await supabase
        .from('accounts')
        .update({ balance: period.account_id === payload.refund_to_account_id ? 0 : supabase.rpc('decrement_balance', { 
          account_id: period.account_id, 
          amount: updatedPeriod.remaining_amount 
        })})
        .eq('id', period.account_id);

      if (debitError) {
        console.error('Error updating period account balance:', debitError);
      }

      // Sumar a la cuenta destino (si es diferente)
      if (period.account_id !== payload.refund_to_account_id) {
        const { error: creditError } = await supabase
          .from('accounts')
          .update({ balance: refundAccount.balance + updatedPeriod.remaining_amount })
          .eq('id', payload.refund_to_account_id);

        if (creditError) {
          console.error('Error updating refund account balance:', creditError);
        }
      }
    }

    // ====== RESPUESTA EXITOSA ======
    
    const response = {
      success: true,
      period: updatedPeriod,
      refund_transaction: refundTransaction,
      message: refundTransaction 
        ? `Period '${period.name}' finished successfully. Refund of $${updatedPeriod.remaining_amount} created.`
        : `Period '${period.name}' finished successfully.`,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Unexpected error in finish-period:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
