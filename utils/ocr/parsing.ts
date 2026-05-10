// parsing.ts — parsing module.
//
// exports: findAllMatches
// used_by: hooks\usePhotoOCR.ts
// rules:   - OCR parsing module must maintain separation of concerns: preprocessing (text cleanup) and date pattern matching are distinct phases that must execute in sequence, not in parallel or combined.
//          - All date pattern imports from `@/utils/datePatterns` must remain as an independent dependency; no date logic should be duplicated or embedded in this module.
//          - The confidence-based block filtering must occur before any text extraction or pattern matching operations.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { TextBlock } from '@react-native-ml-kit/text-recognition';
import { DateMatch } from './types';
import { cleanBlockText } from './preprocessing';
import { isExpirationAnchor } from '@/utils/ocrKeywords';
import {
    STANDARD_DATE_PATTERNS,
    MONTH_YEAR_PATTERN,
    MONTH_YEAR_SPACE_PATTERN,
    SEQUENCE_PATTERN,
    TEXTUAL_MONTH_PATTERN,
    FUZZY_DATE_PATTERN,
    PARTIAL_DATE_PATTERN,
} from '@/utils/datePatterns';
import { LoggingService } from '@/services/LoggingService';

const removeIgnoredDateContexts = (text: string): string => {
    return text.replace(
        /\b(?:CONF|CONE)\.?\s*[:.]?\s*\d{1,2}\s*[/\\\-.]\s*\d{1,2}(?:\s*[/\\\-.]\s*(?:\d{4}|\d{2}))?/gi,
        ' '
    ).replace(
        // FIX: Expanded to cover LOTTO, LOT, LT, L: and L. with their number values.
        // Handles formats like: "LOTTO: 11.8", "LOTTO 11.8", "LOT: 11.8", "LOT 058", "LT:058", "L. 11.8"
        // MUST run before cleanBlockText which would strip "LOTTO" via its L[A-Z0-9] regex.
        /\b(?:LOTTO[:. ]?|LOT[:. ]?|LT[:. ]?|L[.:])\s*\d{1,4}(?:\s*[/\\\-.]\s*\d{1,4}){0,2}/gi,
        ' '
    );
};

/**
 * Parses OCR blocks to find date matches and expiration anchors.
 */
export const findAllMatches = (blocks: TextBlock[]): { matches: DateMatch[], anchors: TextBlock[] } => {
    const TAG = 'OCR_Parsing';
    const MIN_CONFIDENCE_THRESHOLD = 0.5;
    const validBlocks = blocks.filter(block => {
        const confidence = 'confidence' in block && typeof (block as { confidence?: number }).confidence === 'number'
            ? (block as { confidence: number }).confidence
            : undefined;
        const isLowConfidence = confidence !== undefined && confidence < MIN_CONFIDENCE_THRESHOLD;
        return !isLowConfidence;
    });
    const filteredCount = blocks.length - validBlocks.length;
    if (filteredCount > 0) {
        LoggingService.debug(TAG, `OCR: Filtered ${filteredCount} blocks with low confidence`);
    }
    const matches: DateMatch[] = [];
    const anchors: TextBlock[] = [];

    // 1. Join all text from all valid blocks to find dates split across blocks
    const fullText = validBlocks.map(b => b.text).join(' \n ');

    const fullTextUpper = fullText.toUpperCase();

    LoggingService.debug(TAG, `RAW Combined text: "${fullTextUpper.replace(/\n/g, ' ')}"`);

    // FIX: removeIgnoredDateContexts runs BEFORE cleanBlockText so that "LOTTO" is still
    // present in the text when the lot-exclusion regex tries to match it.
    // cleanBlockText strips "LOTTO" via its \bL[A-Z0-9]{2,6}\b regex, which would make
    // the lot filter ineffective and let lot numbers like "11.8" pass as date candidates.
    const fullTextCleaned = cleanBlockText(removeIgnoredDateContexts(fullTextUpper));
    LoggingService.debug(TAG, `CLEANED Combined text: "${fullTextCleaned.replace(/\n/g, ' ')}"`);

    // Helper to add matches from text and optional frame
    const addMatchesFromText = (text: string, frame: TextBlock['frame'] = undefined) => {
        // Textual Matches
        const textualMatches = text.match(new RegExp(TEXTUAL_MONTH_PATTERN.source, TEXTUAL_MONTH_PATTERN.flags));
        if (textualMatches) {
            matches.push(...textualMatches.map(m => ({
                value: m, isSequence: false, isMonthYear: false, isTextual: true, isDerived: false, frame
            })));
        }

        // Standard Patterns
        for (const pattern of STANDARD_DATE_PATTERNS) {
            const regex = new RegExp(pattern.source, pattern.flags);
            const patMatches = text.match(regex);
            if (patMatches) {
                matches.push(...patMatches.map(m => ({
                    value: m, isSequence: false, isMonthYear: false, isTextual: false, isDerived: false, frame
                })));
            }
        }

        // Month/Year Patterns
        const monthYearMatches = text.match(new RegExp(MONTH_YEAR_PATTERN.source, MONTH_YEAR_PATTERN.flags));
        if (monthYearMatches) {
            matches.push(...monthYearMatches.map(m => ({
                value: m, isSequence: false, isMonthYear: true, isTextual: false, isDerived: false, frame
            })));
        }

        // Numeric Sequences
        const spacelessText = text.replace(/[\s.\-/]/g, '');
        const seq6 = spacelessText.match(/(\d{2})(0[1-9]|1[0-2])(\d{2})/g);
        if (seq6) {
            for (const s of seq6) {
                const d = s.substring(0, 2);
                const m = s.substring(2, 4);
                const y = s.substring(4, 6);
                matches.push({
                    value: `${d}.${m}.${y}`, isSequence: true, isMonthYear: false, isTextual: false, isDerived: false, frame
                });
            }
        }
    };

    // Process the full combined text first (frame = undefined for combined text)
    addMatchesFromText(fullTextCleaned, undefined);
    LoggingService.debug(TAG, `Matches after combined text: ${matches.length}`);

    // Process individual valid blocks as before
    for (const block of validBlocks) {

        const blockText = block.text.replace(/\n/g, ' ');
        const blockUpper = blockText.toUpperCase();

        // 1. Check for Anchors
        if (isExpirationAnchor(blockUpper)) {
            anchors.push(block);
            LoggingService.debug(TAG, `Anchor found: "${blockText}"`);
        }

        // 2. Clean Text — removeIgnoredDateContexts BEFORE cleanBlockText (same reason as fullText)
        const cleanedText = cleanBlockText(removeIgnoredDateContexts(blockUpper));

        // 3. Extract Dates from individual blocks
        addMatchesFromText(cleanedText, block.frame);

        // Month/Year Space (special case because of normalization)
        const monthYearSpaceMatches = cleanedText.match(new RegExp(MONTH_YEAR_SPACE_PATTERN.source, MONTH_YEAR_SPACE_PATTERN.flags));
        if (monthYearSpaceMatches) {
            const normalizedMatches = monthYearSpaceMatches.map(m => {
                const parts = m.replace(/FINE[:\s]*/gi, '').trim().split(/\s+/);
                return parts.length === 2 ? `${parts[0]}/${parts[1]}` : m;
            });
            matches.push(...normalizedMatches.map(m => ({
                value: m, isSequence: false, isMonthYear: true, isTextual: false, isDerived: false, frame: block.frame
            })));
        }

        // Fuzzy Dates (special case because of normalization)
        const fuzzyMatches = cleanedText.match(new RegExp(FUZZY_DATE_PATTERN.source, FUZZY_DATE_PATTERN.flags));
        if (fuzzyMatches) {
            for (const match of fuzzyMatches) {
                const fuzzyRegex = /(\d{1,2})[./-](\d{1,2})(\d{4})/;
                const fuzzyResult = match.match(fuzzyRegex);
                if (fuzzyResult) {
                    const [, day, month, year] = fuzzyResult;
                    matches.push({
                        value: `${day}.${month}.${year}`, isSequence: false, isMonthYear: false, isTextual: false, isDerived: true, frame: block.frame
                    });
                }
            }
        }

        // Partial Dates (special case because of year guessing)
        const partialMatches = cleanedText.match(new RegExp(PARTIAL_DATE_PATTERN.source, PARTIAL_DATE_PATTERN.flags));
        if (partialMatches) {
            const currentYear = new Date().getFullYear();
            for (const match of partialMatches) {
                const partialRegex = /(\d{1,2})\s*[/\\\-.]\s*(1[0-2]|0?[1-9])/i;
                const partialResult = match.match(partialRegex);
                if (partialResult) {
                    const [, dayStr, monthStr] = partialResult;
                    const day = parseInt(dayStr, 10);
                    const month = parseInt(monthStr, 10);
                    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                        for (const year of [currentYear, currentYear + 1]) {
                            const testDate = `${day}.${month.toString().padStart(2, '0')}.${year}`;
                            matches.push({
                                value: testDate, isSequence: false, isMonthYear: false, isTextual: false, isDerived: true, frame: block.frame
                            });
                        }
                    }
                }
            }
        }
    }

    return { matches, anchors };
};

