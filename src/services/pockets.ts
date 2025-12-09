import { supabase } from '../lib/supabaseClient';

export async function closePocket(pocketId: string, userId: string, targetAccountId?: string) {
  // 1. Obtener datos actuales de la bolsa
  const { data: pocketData, error: fetchError } = await (supabase
    .from('pockets') as any)
    .select('*')
    .eq('id', pocketId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;
  if (!pocketData) throw new Error('Bolsa no encontrada');

  const pocket = pocketData as any;
  let amountToReturn = 0;

  if (pocket.type === 'saving') {
    amountToReturn = Number(pocket.amount_saved || 0);
  } else if (pocket.type === 'expense') {
    // Para bolsas de gasto tipo periodo, devolvemos lo no gastado
    if (pocket.subtype === 'period' || pocket.subtype === 'shared') {
      const allocated = Number(pocket.allocated_amount || 0);
      const spent = Number(pocket.spent_amount || 0);
      amountToReturn = Math.max(0, allocated - spent);
    }
    // Otros tipos de gasto podrían no tener "saldo" retornable o usar lógica distinta
  }

  // 2. Iniciar transacción (usando llamadas secuenciales ya que Supabase no soporta transacciones directas en cliente fácilmente, 
  // pero podemos intentar hacerlo lo más atómico posible o confiar en el orden)
  
  // Si hay saldo, crear movimiento de devolución
  // NOTA: El trigger trg_update_account_balance en la BD actualiza automáticamente
  // el balance de account_currencies cuando se inserta un movimiento de tipo 'pocket_return'
  if (amountToReturn > 0) {
    const accountIdToUse = pocket.account_id || targetAccountId;

    const { error: movementError } = await (supabase
      .from('movements') as any)
      .insert({
        user_id: userId,
        type: 'pocket_return',
        amount: amountToReturn,
        currency: pocket.currency,
        date: new Date().toISOString(),
        description: `Cierre de bolsa: ${pocket.name}`,
        pocket_id: pocketId,
        account_id: accountIdToUse
      });

    if (movementError) throw movementError;
  }

  // 3. Actualizar estado de la bolsa a cancelled y resetear montos
  const { error: updateError } = await (supabase
    .from('pockets') as any)
    .update({
      status: 'cancelled',
      amount_saved: 0, // Resetear saldo visual de la bolsa
      updated_at: new Date().toISOString()
    })
    .eq('id', pocketId);

  if (updateError) throw updateError;

  return true;
}
