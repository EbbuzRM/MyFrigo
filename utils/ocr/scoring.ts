// scoring.ts — scoring module.
//
// exports: selectBestDate
// used_by: hooks\usePhotoOCR.ts
// rules:   - All date parsing and validation logic must be centralized through the dedicated parsers and formatters in `@/utils/dateUtils/`, not duplicated or modified locally in this module.
//          - The scoring module must remain pure with respect to date matching logic, delegating all keyword detection to `@/utils/ocrConfidence` and all logging to `LoggingService`.
//          - Output `OCRResult` objects must be deterministic based solely on input `DateMatch[]`, `Set<string>`, and `rawText` parameters, with no side effects on external state.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { DateMatch, OCRResult, ScoredDate } from './types';
import {
    parseDateFromString,
    parseTextualMonthDate,
    parseSequenceDate,
    parseMonthYearDate,
} from '@/utils/dateUtils/parsers';
import { DateParseResult } from '@/utils/dateUtils/constants';
import {
    isDateInFuture,
    isDateTooOld,
    toLocalISOString,
    isDateWith31InShortMonth,
} from '@/utils/dateUtils/formatters';
import { calculateConfidence, hasExpirationKeyword } from '@/utils/ocrConfidence';
import { LoggingService } from '@/services/LoggingService';

const TAG = 'OCR_Scoring';

/**
 * Priority for representative-match selection.
 * Standard/Textual > Sequence > Derived/MonthYear.
 */
const matchPriority = (match: DateMatch): number => {
    if (match.isMonthYear) return 0;
    if (match.isDerived) return 0;
    if (match.isSequence) return 1;
    return 2; // standard or textual
};

/**
 * Among the matches that normalize to `dateStr`, pick the one with the highest priority
 * (standard/textual > sequence > derived/monthYear) so the correct date anchors the
 * standard match and claims the full score bonus.
 */
const findRepresentativeMatch = (matches: DateMatch[], dateStr: string): DateMatch | undefined => {
    const candidates = matches.filter(m => normalizeDate(m) === dateStr);
    if (candidates.length === 0) return undefined;
    return candidates.reduce((best, current) =>
        matchPriority(current) > matchPriority(best) ? current : best
    );
};

/**
 * Normalizes a match string into a formatted date string.
 */
const normalizeDate = (match: DateMatch): string | null => {
    let result: DateParseResult;

    if (match.isTextual) {
        result = parseTextualMonthDate(match.value);
    } else if (match.isMonthYear) {
        result = parseMonthYearDate(match.value);
    } else if (match.isSequence) {
        result = parseSequenceDate(match.value);
    } else {
        result = parseDateFromString(match.value);
    }

    if (!result.success || !result.date) {
        return null;
    }

    if (isDateTooOld(result.date)) {
        LoggingService.debug(TAG, `Date rejected (too old): ${match.value} -> ${result.formattedDate}`);
        return null;
    }

    return result.formattedDate;
};

/**
 * Selects the best expiration date from a list of matches.
 */
export const selectBestDate = (
    matches: DateMatch[],
    anchoredValues: Set<string>,
    rawText: string
): OCRResult => {
    const validDates: string[] = [];
    const rejectedDates: string[] = [];
    const matchingContexts = new Map<string, boolean>();

    // 1. Normalize and Filter Matches
    for (const match of matches) {
        const normalized = normalizeDate(match);
        if (normalized) {
            validDates.push(normalized);
            if (anchoredValues.has(match.value)) {
                matchingContexts.set(normalized, true);
            }
            LoggingService.debug(TAG, `Valid date found: ${match.value} -> ${normalized}`);
        } else {
            rejectedDates.push(match.value);
        }
    }

    LoggingService.info(TAG, `Found ${validDates.length} valid dates`);

    if (validDates.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data valida trovata' };
    }

    // 2. Filter Future Dates
    const futureDates = validDates
        .map(date => new Date(date))
        .filter(isDateInFuture);

    if (futureDates.length === 0) {
        return { success: false, extractedDate: null, confidence: 0, rawText, error: 'Nessuna data futura trovata' };
    }

    // 3. Filter Invalid Days (e.g. 31st Feb)
    const filteredDates = futureDates.filter(date => !isDateWith31InShortMonth(date));
    const prioritizedDates = filteredDates.length > 0 ? filteredDates : futureDates;

    // 4. Score Dates
    const scoredDates: ScoredDate[] = prioritizedDates.map(date => {
        const dateStr = toLocalISOString(date);
        let score = 0;

        const match = findRepresentativeMatch(matches, dateStr);

        // Spatial Boost
        if (matchingContexts.get(dateStr)) {
            score += 200;
            LoggingService.debug(TAG, `Spatial Boost (+200) for ${dateStr}`);
        }

        if (match) {
            // 4-Digit Year Boost
            if (/\d{4}/.test(match.value) && !match.isDerived) score += 100;

            // Authentic vs Derived
            if (match.isDerived) score -= 100;
            else if (!match.isSequence) score += 50;

            // Textual Month
            if (match.isTextual) score += 30;

            // Month/Year
            if (match.isMonthYear) score -= 10;
        }

        return { date, score, originalMatch: match };
    });

    // 5. Sort and Select
    const finalSorted = scoredDates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.date.getTime() - b.date.getTime();
    });

    const chosenDate = finalSorted[0].date;
    const finalDate = toLocalISOString(chosenDate);
    const finalScore = finalSorted[0].score;

    LoggingService.info(TAG, `Date chosen (score ${finalScore}): ${finalDate}`);

    // 6. Calculate Confidence
    const winningMatch = findRepresentativeMatch(matches, finalDate);

    const dynamicConfidence = calculateConfidence({
        matchType: winningMatch?.isTextual ? 'textual'
            : winningMatch?.isSequence ? 'sequence'
                : winningMatch?.isMonthYear ? 'monthYear'
                    : 'standard',
        validDatesCount: validDates.length,
        rejectedDatesCount: rejectedDates.length,
        wasReconstructed: false, // Simplification
        hasKeywordContext: !!matchingContexts.get(finalDate) || hasExpirationKeyword(rawText),
    });

    return {
        success: true,
        extractedDate: finalDate,
        confidence: Math.min(1, dynamicConfidence + (matchingContexts.get(finalDate) ? 0.1 : 0)),
        rawText,
    };
};
