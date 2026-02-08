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
