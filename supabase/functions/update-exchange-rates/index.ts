import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Crear cliente de Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // API Key de ExchangeRate-API
    const API_KEY = 'f453e7823026864ccdd26a0a'
    
    console.log('Fetching exchange rates...')
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`)
    const data = await response.json()

    if (data.result !== 'success') {
      throw new Error(`API Error: ${data['error-type'] || 'Unknown error'}`)
    }

    // Monedas a actualizar (ajusta según tus necesidades)
    const currencies = ['EUR', 'ARS', 'BRL', 'CLP', 'MXN', 'COP', 'PEN', 'UYU']
    const today = new Date().toISOString().split('T')[0]
    
    console.log(`Updating rates for ${currencies.length} currencies`)
    
    for (const toCurrency of currencies) {
      const rate = data.conversion_rates[toCurrency]
      
      if (!rate) {
        console.warn(`Rate not found for ${toCurrency}`)
        continue
      }

      const { error } = await supabase
        .from('exchange_rates')
        .upsert({
          from_currency: 'USD',
          to_currency: toCurrency,
          rate: rate,
          date: today
        }, {
          onConflict: 'from_currency,to_currency,date'
        })

      if (error) {
        console.error(`Error updating ${toCurrency}:`, error)
      } else {
        console.log(`Updated USD -> ${toCurrency}: ${rate}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: currencies.length,
        date: today,
        timestamp: new Date().toISOString()
      }), 
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" } 
      }
    )
  }
})
