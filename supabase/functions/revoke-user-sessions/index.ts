// revoke-user-sessions/index.ts — revokes every session for the CALLER.
//
// exports: serve | function
// used_by: context/AuthContext.tsx (after a password change)
// rules:   - Requires the service_role key (server-side only, never exposed to the client).
//          - The target user is taken from the caller's JWT, never from the request
//            body — otherwise any signed-in user could force-log-out anyone.
//          - config.toml sets verify_jwt = true.
// agent:   qwen3.7-plus | 2026-08-27 | initial creation

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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    )

    const { error } = await supabaseAdmin.auth.admin.signOut(user.id, { scope: 'global' })

    if (error) {
      console.error('Error revoking sessions:', error.message)
      return new Response(JSON.stringify({ error: 'Could not revoke sessions' }), {
        status: 502,
        headers: jsonHeaders,
      })
    }

    console.log(`Revoked all sessions for user: ${user.id}`)
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders })
  } catch (err) {
    if (err instanceof UnauthorizedError) return err.response
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Unexpected error:', message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
