// ensure-profile/index.ts — upserts the caller's row in `public.users`,
// splitting user_metadata.full_name into first/last name.
//
// exports: none
// used_by: (client optional) — safe to call after sign-in to backfill a profile row
// rules:   - The profile row is ALWAYS keyed by the JWT user id, never by an id
//            taken from the request body (prevents overwriting another user's row).
//          - config.toml sets verify_jwt = true.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handlePreflight } from '../_shared/cors.ts'
import { requireUser, UnauthorizedError } from '../_shared/auth.ts'

const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders }

serve(async (req: Request) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const user = await requireUser(req)

    const fullName = typeof user.userMetadata.full_name === 'string'
      ? user.userMetadata.full_name
      : ''
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean)
    const firstName = nameParts[0] ?? null
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ profile: data }), { status: 200, headers: jsonHeaders })
  } catch (err) {
    if (err instanceof UnauthorizedError) return err.response
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('ensure-profile error:', message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
