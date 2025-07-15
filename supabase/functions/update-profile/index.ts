import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Funzione per creare un client di servizio con privilegi di amministratore
const createAdminClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

serve(async (req) => {
  try {
    // 1. Creare un client con il token dell'utente per l'autenticazione
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Ottenere l'utente dalla richiesta per sapere CHI sta facendo l'operazione
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError) throw userError

    // 3. Estrarre i dati dal corpo della richiesta
    const { firstName, lastName } = await req.json()
    if (!firstName || !lastName) {
      return new Response(JSON.stringify({ error: 'Nome e cognome sono richiesti.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 4. Creare un client di servizio per eseguire l'operazione con privilegi elevati
    const supabaseAdmin = createAdminClient();

    // 5. Eseguire l'aggiornamento sulla tabella 'users'
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ first_name: firstName, last_name: lastName })
      .eq('id', user.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ message: 'Profilo aggiornato con successo.' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
