// delete-all-users/index.ts — DESTRUCTIVE: deletes every auth user.
//
// exports: none
// used_by: components/DiagnosticPanel.tsx (dev diagnostics only)
// rules:   - DANGEROUS. Kept disabled in config.toml (`enabled = false`); deploy
//            manually only for a throw-away/staging project, never production.
//          - Requires the `x-admin-secret` header to match ADMIN_TASK_SECRET AND
//            ENVIRONMENT to be explicitly non-production.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireSecret, UnauthorizedError } from '../_shared/auth.ts'

const jsonHeaders = { 'Content-Type': 'application/json' }

serve(async (req: Request) => {
  try {
    if ((Deno.env.get('ENVIRONMENT') ?? 'production').toLowerCase() === 'production') {
      return new Response(JSON.stringify({ error: 'Disabled in this environment' }), {
        status: 403,
        headers: jsonHeaders,
      })
    }
    requireSecret(req, 'x-admin-secret', 'ADMIN_TASK_SECRET')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    )

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    let deleted = 0
    for (const user of users) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (deleteError) {
        console.error(`Failed to delete user ${user.id}:`, deleteError.message)
      } else {
        deleted++
      }
    }

    return new Response(JSON.stringify({ message: `${deleted} users deleted.` }), {
      status: 200,
      headers: jsonHeaders,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) return error.response
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('delete-all-users error:', message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
