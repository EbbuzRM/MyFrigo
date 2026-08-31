// _shared/cors.ts — shared CORS headers for all edge functions.
//
// exports: corsHeaders, handlePreflight
// used_by: ocr-proxy, send-feedback, ensure-profile, revoke-user-sessions
// rules:   Keep the header set identical across functions so the client never
//          hits a preflight mismatch. Origin stays '*' because the caller is a
//          native app (no browser origin); authorization is still required.

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-e2e-secret, x-admin-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Returns a 204 preflight response when the request is an OPTIONS call, else null. */
export function handlePreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}
