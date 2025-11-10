// Simple Edge Function that relays Supabase DB webhooks/broadcasts to the
// client-side dashboard refresh channel. Deploy it with `supabase functions deploy`.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const CHANNEL = 'dashboard-sync';
const EVENT = 'refresh';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Only POST allowed', { status: 405 });
  }

  // Optionally inspect payload to limit by table/event type.
  const payload = await req.json().catch(() => ({}));
  console.log('[dashboard-refresh] webhook payload', payload?.type);

  await supabase.channel(CHANNEL).send({
    type: 'broadcast',
    event: EVENT,
    payload: { source: payload?.type ?? 'webhook' },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
