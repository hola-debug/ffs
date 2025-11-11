import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars.');
}

interface TransactionPayload {
  account_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  scope?: 'period' | 'outside_period';
  period_id?: string;
  category_id?: string;
  currency?: string;
  date?: string;
  description?: string;
  is_random?: boolean;
  is_fixed?: boolean;
  is_recurring?: boolean;
  metadata?: Record<string, unknown>;
  
  // Para transfers
  to_account_id?: string;
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

    const payload: TransactionPayload = await req.json();

    // ====== VALIDACIONES ======
    
    // Validación 1: Campos obligatorios
    if (!payload.account_id || !payload.type || !payload.amount) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: account_id, type, amount' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 2: Amount positivo
    if (payload.amount <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Amount must be greater than 0' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 3: Type válido
    if (!['income', 'expense', 'transfer'].includes(payload.type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid type. Must be: income, expense, or transfer' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 4: Scope válido
    const scope = payload.scope || 'outside_period';
    if (!['period', 'outside_period'].includes(scope)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid scope. Must be: period or outside_period' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 5: Si scope=period, debe tener period_id
    if (scope === 'period' && !payload.period_id) {
      return new Response(JSON.stringify({ 
        error: 'period_id is required when scope=period' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validación 6: Verificar que la cuenta pertenece al usuario
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

    // Validación 7: Si hay period_id, verificar que existe y pertenece al usuario
    if (payload.period_id) {
      const { data: period, error: periodError } = await supabase
        .from('periods')
        .select('id, account_id, allocated_amount, spent_amount')
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

      // Validación 8: Si es expense con scope=period, verificar saldo disponible
      if (payload.type === 'expense' && scope === 'period') {
        const remaining = period.allocated_amount - period.spent_amount;
        if (payload.amount > remaining) {
          return new Response(JSON.stringify({ 
            error: `Insufficient period balance. Available: ${remaining}` 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Validación 9: Si es category_id, verificar que existe
    if (payload.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id, scope')
        .eq('id', payload.category_id)
        .eq('user_id', user.id)
        .single();

      if (categoryError || !category) {
        return new Response(JSON.stringify({ 
          error: 'Category not found or does not belong to user' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validación 10: Verificar scope de categoría compatible
      if (category.scope !== 'both' && category.scope !== scope) {
        return new Response(JSON.stringify({ 
          error: `Category scope (${category.scope}) incompatible with transaction scope (${scope})` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Validación 11: Para transfers, validar to_account_id
    if (payload.type === 'transfer') {
      if (!payload.to_account_id) {
        return new Response(JSON.stringify({ 
          error: 'to_account_id is required for transfers' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (payload.to_account_id === payload.account_id) {
        return new Response(JSON.stringify({ 
          error: 'Cannot transfer to the same account' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data: toAccount, error: toAccountError } = await supabase
        .from('accounts')
        .select('id, currency')
        .eq('id', payload.to_account_id)
        .eq('user_id', user.id)
        .single();

      if (toAccountError || !toAccount) {
        return new Response(JSON.stringify({ 
          error: 'Destination account not found or does not belong to user' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ====== CREACIÓN DE TRANSACCIÓN ======

    const transactionData = {
      user_id: user.id,
      account_id: payload.account_id,
      type: payload.type,
      amount: payload.amount,
      scope,
      period_id: payload.period_id || null,
      category_id: payload.category_id || null,
      currency: payload.currency || account.currency,
      date: payload.date || new Date().toISOString().split('T')[0],
      description: payload.description || null,
      is_random: payload.is_random || false,
      is_fixed: payload.is_fixed || false,
      is_recurring: payload.is_recurring || false,
      metadata: payload.metadata || null,
    };

    const { data: transaction, error: insertError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create transaction',
        details: insertError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ====== ACTUALIZAR BALANCE DE CUENTA ======
    
    let newBalance = account.balance;
    
    if (payload.type === 'income') {
      newBalance += payload.amount;
    } else if (payload.type === 'expense') {
      newBalance -= payload.amount;
    } else if (payload.type === 'transfer') {
      // Descontar de cuenta origen
      newBalance -= payload.amount;
    }

    const { error: updateBalanceError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', payload.account_id);

    if (updateBalanceError) {
      console.error('Balance update error:', updateBalanceError);
      // No retornamos error porque la transacción ya fue creada
    }

    // Si es transfer, actualizar cuenta destino
    if (payload.type === 'transfer' && payload.to_account_id) {
      const { data: toAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', payload.to_account_id)
        .single();

      if (toAccount) {
        await supabase
          .from('accounts')
          .update({ balance: toAccount.balance + payload.amount })
          .eq('id', payload.to_account_id);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      data: transaction 
    }), {
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
