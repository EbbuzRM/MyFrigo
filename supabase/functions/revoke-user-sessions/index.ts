// revoke-user-sessions/index.ts — Edge Function to revoke all sessions for a user.
//
// exports: serve | function
// used_by: context\AuthContext.tsx (after password change)
// rules:   - Requires service_role key (server-side only, never expose to client)
//          - Revokes ALL sessions globally for the specified user
//          - Called after successful password change to invalidate other devices
// agent:   qwen3.7-plus | 2026-08-27 | initial creation
// message:

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { user_id } = await req.json()

    if (!user_id || typeof user_id !== 'string') {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Revoke all sessions for user (global scope)
    const { error } = await supabaseAdmin.auth.admin.signOut(user_id, { scope: 'global' })

    if (error) {
      console.error('Error revoking sessions:', error.message)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Successfully revoked all sessions for user: ${user_id}`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Unexpected error:', errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
