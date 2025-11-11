import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars.');
}

interface PeriodPayload {
  account_id: string;
  name: string;
  percentage: number;
  days: number;
  allocated_amount: number;
  currency?: string;
  starts_at?: string;
  status?: 'draft' | 'active' | 'finished' | 'cancelled';
  
  // Opciones para transferencia de reserva
  transfer_from_account_id?: string;
  create_transfer_transaction?: boolean;
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

    const payload: PeriodPayload = await req.json();

    // ====== VALIDACIONES ======
    
    // Validación 1: Campos obligatorios
    if (!payload.account_id || !payload.name || !payload.percentage || !payload.days || payload.allocated_amount === undefined) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: account_id, name, percentage, days, allocated_amount' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 2: Percentage válido (0-100)
    if (payload.percentage <= 0 || payload.percentage > 100) {
      return new Response(JSON.stringify({ 
        error: 'Percentage must be between 0 and 100' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 3: Days válido (1-120)
    if (payload.days < 1 || payload.days > 120) {
      return new Response(JSON.stringify({ 
        error: 'Days must be between 1 and 120' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 4: Allocated amount >= 0
    if (payload.allocated_amount < 0) {
      return new Response(JSON.stringify({ 
        error: 'Allocated amount must be greater than or equal to 0' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 5: Verificar que la cuenta destino pertenece al usuario
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, currency, balance')
      .eq('id', payload.account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return new Response(JSON.stringify({ 
        error: 'Account not found or does not belong to user' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 6: Si se solicita transfer, validar cuenta origen
    let fromAccount = null;
    if (payload.create_transfer_transaction && payload.transfer_from_account_id) {
      if (payload.transfer_from_account_id === payload.account_id) {
        return new Response(JSON.stringify({ 
          error: 'Cannot transfer from and to the same account' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data: sourceAccount, error: sourceAccountError } = await supabase
        .from('accounts')
        .select('id, currency, balance')
        .eq('id', payload.transfer_from_account_id)
        .eq('user_id', user.id)
        .single();

      if (sourceAccountError || !sourceAccount) {
        return new Response(JSON.stringify({ 
          error: 'Source account not found or does not belong to user' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      fromAccount = sourceAccount;

      // Validación 7: Verificar saldo suficiente en cuenta origen
      if (sourceAccount.balance < payload.allocated_amount) {
        return new Response(JSON.stringify({ 
          error: `Insufficient balance in source account. Available: ${sourceAccount.balance}` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ====== CALCULAR DAILY AMOUNT ======
    const dailyAmount = Math.round((payload.allocated_amount / payload.days) * 100) / 100;

    // ====== CALCULAR ENDS_AT ======
    const startsAt = payload.starts_at || new Date().toISOString().split('T')[0];
    const startDate = new Date(startsAt);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + payload.days - 1);
    const endsAt = endDate.toISOString().split('T')[0];

    // ====== CREAR PERIODO ======
    
    const periodData = {
      user_id: user.id,
      account_id: payload.account_id,
      name: payload.name,
      percentage: payload.percentage,
      days: payload.days,
      allocated_amount: payload.allocated_amount,
      spent_amount: 0,
      daily_amount: dailyAmount,
      currency: payload.currency || account.currency,
      starts_at: startsAt,
      ends_at: endsAt,
      status: payload.status || 'draft',
    };

    const { data: period, error: periodError } = await supabase
      .from('periods')
      .insert(periodData)
      .select()
      .single();

    if (periodError) {
      console.error('Period creation error:', periodError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create period',
        details: periodError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let transferTransaction = null;

    // ====== CREAR TRANSACCIÓN DE TRANSFERENCIA (opcional) ======
    
    if (payload.create_transfer_transaction && fromAccount && payload.transfer_from_account_id) {
      const transferData = {
        user_id: user.id,
        account_id: payload.transfer_from_account_id,
        type: 'transfer',
        scope: 'outside_period',
        amount: payload.allocated_amount,
        currency: payload.currency || account.currency,
        date: startsAt,
        description: `Transfer to period: ${payload.name}`,
        metadata: {
          to_account_id: payload.account_id,
          period_id: period.id,
          transfer_type: 'period_reservation',
        },
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert(transferData)
        .select()
        .single();

      if (transactionError) {
        console.error('Transfer transaction error:', transactionError);
        // No retornamos error, el periodo ya fue creado
      } else {
        transferTransaction = transaction;

        // ====== ACTUALIZAR BALANCES ======
        
        // Descontar de cuenta origen
        await supabase
          .from('accounts')
          .update({ balance: fromAccount.balance - payload.allocated_amount })
          .eq('id', payload.transfer_from_account_id);

        // Sumar a cuenta destino
        await supabase
          .from('accounts')
          .update({ balance: account.balance + payload.allocated_amount })
          .eq('id', payload.account_id);
      }
    }

    // ====== RESPUESTA ======
    
    const responseData: Record<string, unknown> = {
      success: true,
      period,
    };

    if (transferTransaction) {
      responseData.transfer_transaction = transferTransaction;
      responseData.message = 'Period created successfully with transfer transaction';
    } else {
      responseData.message = 'Period created successfully';
    }

    return new Response(JSON.stringify(responseData), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
