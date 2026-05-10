// types.ts — types module.
//
// exports: OCRResult | OCRProgress | DateMatch | ScoredDate
// used_by: hooks\usePhotoOCR.ts
//         utils\ocr\parsing.ts
//         utils\ocr\scoring.ts
//         utils\ocr\spatial.ts
// rules:   - Types importing from `@react-native-ml-kit/text-recognition` must not create runtime dependencies on native modules in non-mobile environments
//          - All date-related interfaces must maintain compatibility with the `MatchType` enum from `@/utils/datePatterns` without circular dependencies
//          - The `DateMatch` interface serves as the shared contract between OCR processing and date pattern matching modules
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { TextBlock } from '@react-native-ml-kit/text-recognition';
import { MatchType } from '@/utils/datePatterns';

export interface OCRResult {
    success: boolean;
    extractedDate: string | null;
    confidence: number;
    rawText: string;
    error?: string;
}

export interface OCRProgress {
    isProcessing: boolean;
    progress: number;
    currentStep: string;
}

export interface DateMatch {
    value: string;
    isSequence: boolean;
    isMonthYear: boolean;
    isTextual: boolean;
    isDerived: boolean;
    frame?: TextBlock['frame'];
    type?: MatchType; // Optional, mapping to existing MatchType
}

export interface ScoredDate {
    date: Date;
    score: number;
    originalMatch?: DateMatch;
}
