// ocr-proxy/index.ts — Secure proxy for ocr.space API
//
// exports: (handler)
// used_by: utils/ocr/ocrSpaceService.ts
// rules:   - Never expose OCR_SPACE_API_KEY to the client. Proxy all requests through the backend.
//          - Requires a valid Supabase user JWT (see _shared/auth). config.toml also sets verify_jwt = true.
// agent:   codedna-cli | 2026-05-10 | initial creation
// message: Supabase Edge Function for secure OCR.space API calls

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { requireUser, UnauthorizedError } from '../_shared/auth.ts';

interface OcrProxyRequest {
  base64Image: string;
}

interface OcrSpaceResponse {
  ParsedResults?: unknown[];
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string;
}

const TAG = 'ocr-proxy';

// Maximum allowed base64 image size: 10MB (base64 is ~33% larger than original)
const MAX_BASE64_SIZE = 10 * 1024 * 1024;

const jsonHeaders = { 'Content-Type': 'application/json', ...corsHeaders };

serve(async (req: Request) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    // Reject anonymous / unauthenticated callers before spending the OCR quota.
    await requireUser(req);

    const body: OcrProxyRequest = await req.json();
    const { base64Image } = body;

    if (!base64Image || typeof base64Image !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing base64Image in request body' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    if (base64Image.length > MAX_BASE64_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request entity too large' }),
        { status: 413, headers: jsonHeaders },
      );
    }

    const apiKey = Deno.env.get('OCR_SPACE_API_KEY');
    if (!apiKey) {
      console.error(`${TAG}: OCR_SPACE_API_KEY not configured`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const params = new URLSearchParams({
      base64Image,
      language: 'ita',
      OCREngine: '2',
      scale: 'true',
      isOverlayRequired: 'true',
    });

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!ocrResponse.ok) {
      console.error(`${TAG}: ocr.space HTTP error ${ocrResponse.status}`);
      return new Response(
        JSON.stringify({ error: 'OCR service error' }),
        { status: 502, headers: jsonHeaders },
      );
    }

    const result: OcrSpaceResponse = await ocrResponse.json();

    return new Response(JSON.stringify(result), { status: 200, headers: jsonHeaders });
  } catch (error) {
    if (error instanceof UnauthorizedError) return error.response;
    console.error(`${TAG}: Unexpected error`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
