import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { decode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

// Inizializza il client di Resend con la chiave API sicura
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const resend = new Resend(RESEND_API_KEY)

// Indirizzo da cui verranno inviate le email (richiesto da Resend)
const FROM_EMAIL = 'MyFrigo Feedback <onboarding@resend.dev>'
// Il tuo indirizzo email dove riceverai i feedback
const TO_EMAIL = 'borlo92@gmail.com'

// Nome del bucket di Supabase Storage
const STORAGE_BUCKET = 'feedback-screenshots'

serve(async (req) => {
  // Gestisce la richiesta CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    })
  }

  try {
    const { feedbackText, screenshot } = await req.json()
    let screenshotUrl = null

    if (!feedbackText) {
      throw new Error('Il testo del feedback è mancante.')
    }

    // Se è presente uno screenshot, caricalo su Supabase Storage
    if (screenshot) {
      // Crea un client Supabase con i permessi di servizio per l'upload
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Estrai il tipo di contenuto e i dati base64
      const match = screenshot.match(/^data:(.+);base64,(.+)$/);
      if (!match) {
        throw new Error('Formato screenshot non valido. Atteso un data URI base64.');
      }
      const contentType = match[1];
      const base64Data = match[2];
      const fileContent = decode(base64Data);

      const fileName = `feedback-${new Date().toISOString()}.jpg`

      // Esegui l'upload
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, fileContent, {
          contentType: contentType || 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        console.error('Errore durante l\'upload dello screenshot:', uploadError)
        throw new Error(`Impossibile caricare lo screenshot: ${uploadError.message}`)
      }
      console.log('Upload completato con successo:', uploadData)

      // Ottieni l\'URL pubblico del file caricato
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName)
      
      console.log('Dati URL pubblico:', publicUrlData)

      // Controlla se l\'URL pubblico è valido
      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('URL pubblico non generato dopo l\'upload.')
      }
      
      screenshotUrl = publicUrlData.publicUrl
      console.log('URL dello screenshot impostato:', screenshotUrl)
    }

    // Prepara il corpo dell'email
    let emailHtml = `
      <h1>Nuovo Feedback Ricevuto</h1>
      <p>Hai ricevuto un nuovo feedback da un utente dell'app MyFrigo:</p>
      <hr>
      <p><strong>${feedbackText.replace(/\n/g, '<br>')}</strong></p>
      <hr>
    `
    if (screenshotUrl) {
      emailHtml += `
        <h2>Screenshot Allegato:</h2>
        <img src="${screenshotUrl}" alt="Screenshot del feedback" style="max-width: 100%; border: 1px solid #ccc;"/>
      `
    }
    emailHtml += `<p><small>Email inviata automaticamente tramite Supabase Edge Function.</small></p>`

    // Invia l'email usando Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: 'Nuovo Feedback da MyFrigo App',
      html: emailHtml,
    })

    // Se Resend restituisce un errore, loggalo e invialo al client
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
    // Gestisce altri errori
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
