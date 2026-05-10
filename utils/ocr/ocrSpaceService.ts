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
 * In production, uses a backend proxy to hide the API key.
 * In development, calls the API directly with the env-configured key.
 *
 * @param imageUri Local file URI of the image to process
 * @returns The raw API response, or null on error
 */
export async function ocrSpaceRecognize(imageUri: string): Promise<OcrSpaceResponse | null> {
    const base64Image = await imageToBase64(imageUri);

    LoggingService.info(TAG, 'Calling ocr.space fallback (Engine 2 — dot matrix)');

    try {
        const apiKey = __DEV__ ? process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY : undefined;

        // Development: use direct API call with key from env
        // Production: use backend proxy (no API key needed in client)
        if (__DEV__) {
            if (!apiKey) {
                LoggingService.info(TAG, 'Skipping ocr.space — no API key configured');
                return null;
            }

            const body = new URLSearchParams({
                base64Image,
                language: 'ita',
                OCREngine: '2',       // Dot Matrix OCR engine
                scale: 'true',        // Internal upscaling for low-res images
                isOverlayRequired: 'true', // Bounding boxes for spatial analysis
            });

            const response = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'apikey': apiKey,
                },
                body: body.toString(),
            });

            if (!response.ok) {
                LoggingService.error(TAG, `ocr.space HTTP error: ${response.status} ${response.statusText}`);
                return null;
            }

            const result: OcrSpaceResponse = await response.json();

            if (result.IsErroredOnProcessing) {
                LoggingService.error(TAG, `ocr.space processing error: ${result.ErrorMessage ?? 'unknown'}`);
                return null;
            }

            const textLength = result.ParsedResults?.[0]?.ParsedText?.length ?? 0;
            LoggingService.info(TAG, `ocr.space response received — ${textLength} chars of text`);

            return result;
        } else {
            // Production: use backend proxy that handles ocr.space internally
            // Proxy expects JSON with base64Image, handles URL-encoded format internally
            const response = await fetch(
                'https://tfhjupcybietwzmnpwfh.supabase.co/functions/v1/ocr-proxy',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ base64Image }),
                }
            );

            if (!response.ok) {
                LoggingService.error(TAG, `ocr.space proxy HTTP error: ${response.status} ${response.statusText}`);
                return null;
            }

            const result: OcrSpaceResponse = await response.json();

            if (result.IsErroredOnProcessing) {
                LoggingService.error(TAG, `ocr.space proxy processing error: ${result.ErrorMessage ?? 'unknown'}`);
                return null;
            }

            const textLength = result.ParsedResults?.[0]?.ParsedText?.length ?? 0;
            LoggingService.info(TAG, `ocr.space proxy response received — ${textLength} chars of text`);

            return result;
        }
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
