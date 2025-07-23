import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@3.2.0'

// Inizializza il client di Resend con la chiave API sicura
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const resend = new Resend(RESEND_API_KEY)

// Indirizzo da cui verranno inviate le email (richiesto da Resend)
const FROM_EMAIL = 'MyFrigo Feedback <onboarding@resend.dev>'
// Il tuo indirizzo email dove riceverai i feedback
const TO_EMAIL = 'borlo92@gmail.com'

serve(async (req) => {
  // Gestisce la richiesta CORS pre-flight (necessaria per le chiamate dal browser/app)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    })
  }

  try {
    // Estrae il testo del feedback dal corpo della richiesta
    const { feedbackText } = await req.json()

    if (!feedbackText) {
      throw new Error('Il testo del feedback è mancante.')
    }

    // Invia l'email usando Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: 'Nuovo Feedback da MyFrigo App',
      html: `
        <h1>Nuovo Feedback Ricevuto</h1>
        <p>Hai ricevuto un nuovo feedback da un utente dell'app MyFrigo:</p>
        <hr>
        <p><strong>${feedbackText.replace(/\n/g, '<br>')}</strong></p>
        <hr>
        <p><small>Email inviata automaticamente tramite Supabase Edge Function.</small></p>
      `,
    })

    // Se Resend restituisce un errore, lo logga e lo invia al client
    if (error) {
      console.error({ error })
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Se tutto va a buon fine, restituisce un messaggio di successo
    return new Response(JSON.stringify({ message: 'Feedback inviato con successo!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    // Gestisce altri errori (es. JSON malformato)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
