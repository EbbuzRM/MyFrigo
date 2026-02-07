/**
 * OCR Confidence calculation utilities.
 * @module utils/ocrConfidence
 */

import { MATCH_CONFIDENCE_WEIGHTS, type MatchType } from './datePatterns';

/**
 * Factors affecting OCR confidence score.
 */
export interface ConfidenceFactors {
    /** Type of date match (affects base confidence) */
    matchType: MatchType;
    /** Number of valid dates found */
    validDatesCount: number;
    /** Number of rejected dates */
    rejectedDatesCount: number;
    /** Whether date required reconstruction */
    wasReconstructed: boolean;
    /** Whether a keyword like "SCAD" was found near the date */
    hasKeywordContext: boolean;
}

/**
 * Calculate dynamic confidence score based on match quality.
 * 
 * @param factors - Factors affecting confidence
 * @returns Confidence score between 0 and 1
 * 
 * @example
 * ```typescript
 * const confidence = calculateConfidence({
 *   matchType: 'standard',
 *   validDatesCount: 1,
 *   rejectedDatesCount: 0,
 *   wasReconstructed: false,
 *   hasKeywordContext: true,
 * });
 * // Returns: ~0.98
 * ```
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
    // Start with base confidence from match type
    let confidence = MATCH_CONFIDENCE_WEIGHTS[factors.matchType];

    // Boost if expiration keyword was found nearby
    if (factors.hasKeywordContext) {
        confidence = Math.min(1, confidence + 0.05);
    }

    // Reduce confidence if date was reconstructed
    if (factors.wasReconstructed) {
        confidence *= 0.9;
    }

    // Reduce confidence if many dates were rejected (noisy OCR)
    if (factors.rejectedDatesCount > factors.validDatesCount * 2) {
        confidence *= 0.85;
    }

    // Increase confidence slightly if only one valid date found (unambiguous)
    if (factors.validDatesCount === 1) {
        confidence = Math.min(1, confidence + 0.03);
    }

    // Round to 2 decimal places
    return Math.round(confidence * 100) / 100;
}

/**
 * Keywords that typically precede expiration dates.
 */
export const EXPIRATION_KEYWORDS = [
    'SCAD', 'SCADENZA', 'EXP', 'EXPIRES', 'EXPIRY',
    'BEST BEFORE', 'USE BY', 'VALIDO FINO', 'DA CONSUMARE',
    'BB', 'BBE', 'TMC'
] as const;

/**
 * Check if text contains expiration keywords.
 */
export function hasExpirationKeyword(text: string): boolean {
    const upperText = text.toUpperCase();
    return EXPIRATION_KEYWORDS.some(keyword => upperText.includes(keyword));
}
