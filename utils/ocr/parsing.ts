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

/**
 * Parses OCR blocks to find date matches and expiration anchors.
 */
export const findAllMatches = (blocks: TextBlock[]): { matches: DateMatch[], anchors: TextBlock[] } => {
    const matches: DateMatch[] = [];
    const anchors: TextBlock[] = [];
    const TAG = 'OCR_Parsing';

    for (const block of blocks) {
        const blockText = block.text.replace(/\n/g, ' ');
        const blockUpper = blockText.toUpperCase();

        // 1. Check for Anchors
        if (isExpirationAnchor(blockUpper)) {
            anchors.push(block);
            LoggingService.debug(TAG, `Anchor found: "${blockText}"`);
        }

        // 2. Clean Text
        const cleanedText = cleanBlockText(blockUpper);

        // 3. Extract Dates

        // Textual Matches
        const textualMatches = cleanedText.match(new RegExp(TEXTUAL_MONTH_PATTERN.source, TEXTUAL_MONTH_PATTERN.flags));
        if (textualMatches) {
            matches.push(...textualMatches.map(m => ({
                value: m, isSequence: false, isMonthYear: false, isTextual: true, isDerived: false, frame: block.frame
            })));
        }

        // Standard Patterns
        for (const pattern of STANDARD_DATE_PATTERNS) {
            const regex = new RegExp(pattern.source, pattern.flags);
            const patMatches = cleanedText.match(regex);
            if (patMatches) {
                matches.push(...patMatches.map(m => ({
                    value: m, isSequence: false, isMonthYear: false, isTextual: false, isDerived: false, frame: block.frame
                })));
            }
        }

        // Month/Year Patterns
        const monthYearMatches = cleanedText.match(new RegExp(MONTH_YEAR_PATTERN.source, MONTH_YEAR_PATTERN.flags));
        if (monthYearMatches) {
            matches.push(...monthYearMatches.map(m => ({
                value: m, isSequence: false, isMonthYear: true, isTextual: false, isDerived: false, frame: block.frame
            })));
        }

        // Month/Year Space
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

        // Fuzzy Dates
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

        // Partial Dates
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

        // Numeric Sequences
        const spacelessText = cleanedText.replace(/[\s.\-/]/g, '');
        let seqMatch;
        const seqPattern = new RegExp(SEQUENCE_PATTERN.source, SEQUENCE_PATTERN.flags);
        while ((seqMatch = seqPattern.exec(spacelessText)) !== null) {
            const [full, d, m, y] = seqMatch;
            matches.push({
                value: `${d}.${m}.${y}`, isSequence: true, isMonthYear: false, isTextual: false, isDerived: false, frame: block.frame
            });
        }
    }

    return { matches, anchors };
};
