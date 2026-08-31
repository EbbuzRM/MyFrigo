// send-feedback/index.ts — receives in-app feedback, stores an optional
// screenshot in Storage, and emails it to the maintainer via Resend.
//
// exports: none
// used_by: app/feedback.tsx
// rules:   - Requires a valid Supabase user JWT (see _shared/auth); config.toml sets verify_jwt = true.
//          - feedbackText is user-controlled and ends up in an HTML email — it MUST be escaped.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4'
import { decode } from 'https://deno.land/std@0.224.0/encoding/base64.ts'
import { corsHeaders, handlePreflight } from '../_shared/cors.ts'
import { requireUser, UnauthorizedError } from '../_shared/auth.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const resend = new Resend(RESEND_API_KEY)

const FROM_EMAIL = 'MyFrigo Feedback <onboarding@resend.dev>'
const TO_EMAIL = Deno.env.get('FEEDBACK_TO_EMAIL') ?? 'borlo92@gmail.com'
const STORAGE_BUCKET = 'feedback-screenshots'

const MAX_FEEDBACK_CHARS = 5000
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders }

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

serve(async (req: Request) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const user = await requireUser(req)

    const { feedbackText, screenshot } = await req.json()

    if (typeof feedbackText !== 'string' || feedbackText.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Il testo del feedback è mancante.' }), {
        status: 400,
        headers: jsonHeaders,
      })
    }
    const text = feedbackText.slice(0, MAX_FEEDBACK_CHARS)

    let screenshotUrl: string | null = null

    if (screenshot) {
      if (typeof screenshot !== 'string') {
        return new Response(JSON.stringify({ error: 'Formato screenshot non valido.' }), {
          status: 400,
          headers: jsonHeaders,
        })
      }
      const match = screenshot.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) {
        return new Response(JSON.stringify({ error: 'Formato screenshot non valido. Atteso un data URI base64.' }), {
          status: 400,
          headers: jsonHeaders,
        })
      }
      const contentType = match[1]
      if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
        return new Response(JSON.stringify({ error: 'Tipo di immagine non supportato.' }), {
          status: 400,
          headers: jsonHeaders,
        })
      }
      const fileContent = decode(match[2])
      if (fileContent.byteLength > MAX_SCREENSHOT_BYTES) {
        return new Response(JSON.stringify({ error: 'Screenshot troppo grande.' }), {
          status: 413,
          headers: jsonHeaders,
        })
      }

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )

      const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
      const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, fileContent, { contentType, upsert: false })

      if (uploadError) {
        console.error('screenshot upload failed:', uploadError.message)
        return new Response(JSON.stringify({ error: 'Impossibile caricare lo screenshot.' }), {
          status: 502,
          headers: jsonHeaders,
        })
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)
      screenshotUrl = publicUrlData?.publicUrl ?? null
    }

    let emailHtml = `
      <h1>Nuovo Feedback Ricevuto</h1>
      <p>Da utente <code>${escapeHtml(user.id)}</code>${user.email ? ` (${escapeHtml(user.email)})` : ''}:</p>
      <hr>
      <p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>
      <hr>
    `
    if (screenshotUrl) {
      emailHtml += `<h2>Screenshot</h2><p><a href="${escapeHtml(screenshotUrl)}">${escapeHtml(screenshotUrl)}</a></p>`
    }
    emailHtml += `<p><small>Inviata automaticamente tramite Supabase Edge Function.</small></p>`

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: 'Nuovo Feedback da MyFrigo App',
      html: emailHtml,
    })

    if (error) {
      console.error('resend error:', error)
      return new Response(JSON.stringify({ error: 'Invio email non riuscito.' }), {
        status: 502,
        headers: jsonHeaders,
      })
    }

    return new Response(JSON.stringify({ message: 'Feedback inviato con successo!' }), {
      status: 200,
      headers: jsonHeaders,
    })
  } catch (err) {
    if (err instanceof UnauthorizedError) return err.response
    console.error('send-feedback unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
