// e2e-otp/index.ts — Edge Function for E2E test recovery token generation.
//
// exports: serve | function
// used_by: app\forgot-password.tsx (E2E test mode)
// rules:   - This function MUST only be used in E2E test environments, never in production
//          - Uses the service role key to generate recovery links without sending an email
//          - Returns a token_hash that can be used with supabase.auth.verifyOtp()
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-27 | codedna-cli | initial creation
// message:

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { requireSecret, UnauthorizedError } from '../_shared/auth.ts'

serve(async (req: Request) => {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-e2e-secret',
      },
    })
  }

  try {
    // Hard gate: this function mints password-recovery tokens for arbitrary
    // emails, so it must never be reachable with just the public anon key.
    if ((Deno.env.get('ENVIRONMENT') ?? 'production').toLowerCase() === 'production') {
      return new Response(JSON.stringify({ error: 'Disabled in this environment' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    requireSecret(req, 'x-e2e-secret', 'E2E_FUNCTION_SECRET')

    const { email, action } = await req.json()

    if (action !== 'generate-recovery-token') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create an admin client with the service role key
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const normalizedEmail = email.trim().toLowerCase()

    // Ensure the E2E user exists before generating a recovery link.
    // Supabase cannot create a recovery link for an unknown email.
    const { data: createUserData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: {
        e2e_test_user: true,
      },
    })

    if (createUserError && createUserError.status !== 422) {
      console.error('Error ensuring E2E user:', createUserError.message)
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (createUserData?.user) {
      console.log('Created E2E user:', normalizedEmail)
    }

    // Generate a recovery link without sending an email
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
    })

    if (error) {
      console.error('Error generating recovery link:', error.message)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const actionLink = data.properties?.action_link

    // Supabase returns the recovery token hash as `hashed_token`.
    // Some action links also include `token_hash`, so keep URL parsing as a fallback.
    let tokenHash: string | undefined = data.properties?.hashed_token
    if (!tokenHash && actionLink) {
      const url = new URL(actionLink)
      tokenHash = url.searchParams.get('token_hash') ?? undefined
    }

    if (!tokenHash) {
      return new Response(JSON.stringify({ error: 'No token_hash in action link' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ token_hash: tokenHash }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    if (err instanceof UnauthorizedError) return err.response
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Unexpected error:', errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
