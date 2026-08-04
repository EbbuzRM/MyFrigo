// ocr-proxy/index.ts — Secure proxy for ocr.space API
//
// exports: (handler)
// used_by: utils/ocr/ocrSpaceService.ts
// rules:   Never expose OCR_SPACE_API_KEY to client. Proxy all requests through backend.
// agent:   codedna-cli | 2026-05-10 | initial creation
// message: Supabase Edge Function for secure OCR.space API calls

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

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

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS_HEADERS,
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  try {
    // Parse request body
    const body: OcrProxyRequest = await req.json();
    const { base64Image } = body;

    if (!base64Image) {
      return new Response(
        JSON.stringify({ error: 'Missing base64Image in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // Validate base64 image size (10MB limit)
    if (base64Image.length > MAX_BASE64_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request entity too large' }),
        { status: 413, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // Get API key from environment
    const apiKey = Deno.env.get('OCR_SPACE_API_KEY');
    if (!apiKey) {
      console.error(`${TAG}: OCR_SPACE_API_KEY not configured`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // Build form data for ocr.space API
    const params = new URLSearchParams({
      base64Image,
      language: 'ita',
      OCREngine: '2',
      scale: 'true',
      isOverlayRequired: 'true',
    });

    // Call ocr.space API
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
        { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const result: OcrSpaceResponse = await ocrResponse.json();

    // Return the ocr.space response directly
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error(`${TAG}: Unexpected error`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }
});