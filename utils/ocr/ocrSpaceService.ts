// ocrSpaceService.ts — ocr.space fallback service for dot-matrix OCR.
//
// exports: ocrSpaceRecognize | convertOcrSpaceToTextBlocks
// used_by: hooks\usePhotoOCR.ts
// rules:   Only call ocr.space when ML Kit fails to find dates. Never replace ML Kit as primary OCR.
// agent:   codedna-cli (no-llm) | codedna-cli | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message:

import { File } from 'expo-file-system';
import { TextBlock } from '@react-native-ml-kit/text-recognition';
import { LoggingService } from '@/services/LoggingService';
// TODO(#perf): Questo import tira dentro l'intero client Supabase (~50KB).
// Ottimizzazione futura: usare fetch() diretta a SUPABASE_URL/functions/v1/ocr-proxy
// con header Authorization: Bearer SUPABASE_ANON_KEY
import { supabase } from '@/services/supabaseClient';

const TAG = 'OCR_Space';

/**
 * Response shape from ocr.space API (minimal subset we use).
 */
interface OcrSpaceParsedResult {
    ParsedText?: string;
    TextOverlay?: {
        Lines?: OcrSpaceLine[];
        HasOverlay?: boolean;
    };
    ErrorExitCode?: number;
    ErrorMessage?: string;
}

interface OcrSpaceLine {
    LineText?: string;
    Words?: OcrSpaceWord[];
    MaxHeight?: number;
}

interface OcrSpaceWord {
    WordText?: string;
    Left?: number;
    Top?: number;
    Height?: number;
    Width?: number;
}

interface OcrSpaceResponse {
    ParsedResults?: OcrSpaceParsedResult[];
    OCRExitCode?: number;
    IsErroredOnProcessing?: boolean;
    ErrorMessage?: string;
}

/**
 * Reads an image file as a base64 string with data URI prefix.
 * Uses the new expo-file-system v19 File API.
 */
async function imageToBase64(imageUri: string): Promise<string> {
    const file = new File(imageUri);
    const base64 = await file.base64();
    return `data:image/jpeg;base64,${base64}`;
}

/**
 * Calls the ocr.space API with Engine 2 (dot-matrix optimized).
 * Always uses the Supabase Edge Function proxy to avoid exposing the API key in the client.
 *
 * @param imageUri Local file URI of the image to process
 * @returns The raw API response, or null on error
 */
export async function ocrSpaceRecognize(imageUri: string): Promise<OcrSpaceResponse | null> {
    const base64Image = await imageToBase64(imageUri);

    LoggingService.info(TAG, 'Calling ocr.space fallback via Supabase Edge Function proxy (Engine 2 — dot matrix)');

    try {
        const { data, error } = await supabase.functions.invoke('ocr-proxy', {
            body: { base64Image, engine: 2 },
        });

        if (error) {
            LoggingService.error(TAG, `ocr.space proxy invocation error: ${error.message}`);
            return null;
        }

        const result: OcrSpaceResponse = data;

        if (!result || result.IsErroredOnProcessing) {
            LoggingService.error(TAG, `ocr.space proxy processing error: ${result?.ErrorMessage ?? 'unknown'}`);
            return null;
        }

        const textLength = result.ParsedResults?.[0]?.ParsedText?.length ?? 0;
        LoggingService.info(TAG, `ocr.space proxy response received — ${textLength} chars of text`);

        return result;
    } catch (error) {
        LoggingService.error(TAG, 'ocr.space network/fetch error', error);
        return null;
    }
}

/**
 * Converts an ocr.space API response into TextBlock[] compatible with
 * the existing parsing pipeline (findAllMatches, spatial analysis, scoring).
 *
 * Each Line in the ocr.space overlay becomes one TextBlock.
 * The frame is computed from the Words' bounding boxes.
 */
export function convertOcrSpaceToTextBlocks(response: OcrSpaceResponse): TextBlock[] {
    const blocks: TextBlock[] = [];

    // Guard: validate ParsedResults exists before processing
    const parsedResults = response.ParsedResults;
    if (!parsedResults || !Array.isArray(parsedResults) || parsedResults.length === 0) {
        LoggingService.warning(TAG, 'convertOcrSpaceToTextBlocks: No ParsedResults in response');
        return blocks;
    }

    for (const result of parsedResults) {
        const lines = result.TextOverlay?.Lines ?? [];
        for (const line of lines) {
            const lineText = line.LineText?.trim();
            if (!lineText) continue;

            // Compute a bounding frame from the words in this line
            const words = line.Words ?? [];
            let frameLeft = Infinity;
            let frameTop = Infinity;
            let frameRight = 0;
            let frameBottom = 0;

            for (const word of words) {
                const left = word.Left ?? 0;
                const top = word.Top ?? 0;
                const width = word.Width ?? 0;
                const height = word.Height ?? 0;
                const right = left + width;
                const bottom = top + height;

                if (left < frameLeft) frameLeft = left;
                if (top < frameTop) frameTop = top;
                if (right > frameRight) frameRight = right;
                if (bottom > frameBottom) frameBottom = bottom;
            }

            // Fallback frame if no words had coordinates
            const frame = {
                top: frameTop === Infinity ? 0 : frameTop,
                left: frameLeft === Infinity ? 0 : frameLeft,
                width: frameRight - frameLeft || 100,
                height: (frameBottom - frameTop) || (line.MaxHeight ?? 20),
            };

            blocks.push({
                text: lineText,
                frame,
                cornerPoints: [
                    { x: frame.left, y: frame.top },
                    { x: frame.left + frame.width, y: frame.top },
                    { x: frame.left + frame.width, y: frame.top + frame.height },
                    { x: frame.left, y: frame.top + frame.height },
                ],
                lines: [],
                recognizedLanguages: [],
            });
        }
    }

    LoggingService.info(TAG, `Converted ocr.space response to ${blocks.length} TextBlocks`);
    return blocks;
}
