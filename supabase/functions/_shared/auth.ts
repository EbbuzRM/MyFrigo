// _shared/auth.ts — request authentication helpers for edge functions.
//
// exports: requireUser, requireSecret, AuthedUser, UnauthorizedError
// used_by: ocr-proxy, send-feedback, revoke-user-sessions, delete-all-users, e2e-otp
// rules:   - Functions that act on behalf of a signed-in user MUST call
//            `requireUser` and use the returned id/email — never an id taken
//            from the request body (prevents IDOR / privilege escalation).
//          - Admin / test-only functions MUST call `requireSecret` with a
//            dedicated env var so a leaked anon key is not enough to invoke them.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthedUser {
  id: string;
  email?: string;
  userMetadata: Record<string, unknown>;
}

/** Thrown when a request fails authentication. Carries the HTTP Response to return. */
export class UnauthorizedError extends Error {
  readonly response: Response;
  constructor(detail: string, status = 401) {
    super(detail);
    this.name = 'UnauthorizedError';
    this.response = new Response(
      JSON.stringify({ error: 'Unauthorized', detail }),
      { status, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

/**
 * Validates the caller's Supabase JWT (Authorization: Bearer <access_token>).
 * Returns the authenticated user. Throws {@link UnauthorizedError} otherwise.
 */
export async function requireUser(req: Request): Promise<AuthedUser> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new UnauthorizedError('Missing bearer token');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!supabaseUrl || !anonKey) {
    throw new UnauthorizedError('Auth backend not configured', 500);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new UnauthorizedError('Invalid or expired token');

  return {
    id: data.user.id,
    email: data.user.email ?? undefined,
    userMetadata: (data.user.user_metadata ?? {}) as Record<string, unknown>,
  };
}

/**
 * Constant-time comparison of a request header against an env-var secret.
 * Use for admin / E2E-only functions that must not be reachable with just the
 * public anon key.
 */
export function requireSecret(req: Request, headerName: string, envVar: string): void {
  const provided = req.headers.get(headerName) ?? '';
  const expected = Deno.env.get(envVar) ?? '';
  if (!expected) throw new UnauthorizedError(`${envVar} not configured`, 500);
  if (!timingSafeEqual(provided, expected)) {
    throw new UnauthorizedError('Bad or missing function secret', 403);
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}
