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

        const match = matches.find(m => {
            const norm = normalizeDate(m);
            return norm === dateStr;
        });

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
    const winningMatch = matches.find(m => {
        const norm = normalizeDate(m);
        return norm === finalDate;
    });

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
