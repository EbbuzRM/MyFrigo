// ocrConfidence.test.ts — tests for OCR confidence calculation.
//
// exports: none
// used_by: none
// rules:   none

import {
    calculateConfidence,
    hasExpirationKeyword,
    EXPIRATION_KEYWORDS,
    ConfidenceFactors,
} from '@/utils/ocrConfidence';

// ── Tests ────────────────────────────────────────────────────────────

describe('ocrConfidence', () => {

    // ── calculateConfidence ──────────────────────────────────────────

    describe('calculateConfidence', () => {

        it('should return high confidence for standard match with keyword', () => {
            const factors: ConfidenceFactors = {
                matchType: 'standard',
                validDatesCount: 1,
                rejectedDatesCount: 0,
                wasReconstructed: false,
                hasKeywordContext: true,
            };
            const result = calculateConfidence(factors);
            // Base: 0.95 + 0.05 (keyword) + 0.03 (single date) = 1.03 → capped at 1
            // Actually: min(1, 0.95 + 0.05) + 0.03 = 1.0 + 0.03 → but min(1, 1.03) = 1
            expect(result).toBe(1);
        });

        it('should return base confidence for standard match without keyword', () => {
            const factors: ConfidenceFactors = {
                matchType: 'standard',
                validDatesCount: 2,
                rejectedDatesCount: 0,
                wasReconstructed: false,
                hasKeywordContext: false,
            };
            const result = calculateConfidence(factors);
            // Base: 0.95 + 0.03 (single date? No, validDatesCount=2)
            // Just 0.95
            expect(result).toBe(0.95);
        });

        it('should boost confidence when single valid date found', () => {
            const factors: ConfidenceFactors = {
                matchType: 'standard',
                validDatesCount: 1,
                rejectedDatesCount: 0,
                wasReconstructed: false,
                hasKeywordContext: false,
            };
            const result = calculateConfidence(factors);
            // Base: 0.95 + 0.03 = 0.98
            expect(result).toBe(0.98);
        });

        it('should reduce confidence for reconstructed dates', () => {
            const factors: ConfidenceFactors = {
                matchType: 'standard',
                validDatesCount: 2,
                rejectedDatesCount: 0,
                wasReconstructed: true,
                hasKeywordContext: false,
            };
            const result = calculateConfidence(factors);
            // Base: 0.95 * 0.9 = 0.855 → rounded to 0.86
            expect(result).toBe(0.86);
        });

        it('should reduce confidence when many dates are rejected', () => {
            const factors: ConfidenceFactors = {
                matchType: 'standard',
                validDatesCount: 1,
                rejectedDatesCount: 5, // 5 > 1 * 2 = 2
                wasReconstructed: false,
                hasKeywordContext: false,
            };
            const result = calculateConfidence(factors);
            // Base: 0.95 + 0.03 (single) = 0.98
            // Noisy: 0.98 * 0.85 = 0.833 → rounded to 0.84
            expect(result).toBe(0.84);
        });

        it('should return lower base confidence for sequence match type', () => {
            const factors: ConfidenceFactors = {
                matchType: 'sequence',
                validDatesCount: 2,
                rejectedDatesCount: 0,
                wasReconstructed: false,
                hasKeywordContext: false,
            };
            const result = calculateConfidence(factors);
            // Base: 0.75
            expect(result).toBe(0.75);
        });

        it('should return lower base confidence for partial match type', () => {
            const factors: ConfidenceFactors = {
                matchType: 'partial',
                validDatesCount: 2,
                rejectedDatesCount: 0,
                wasReconstructed: false,
                hasKeywordContext: false,
            };
            const result = calculateConfidence(factors);
            // Base: 0.6
            expect(result).toBe(0.6);
        });

        it('should apply keyword boost for textual match', () => {
            const factors: ConfidenceFactors = {
                matchType: 'textual',
                validDatesCount: 2,
                rejectedDatesCount: 0,
                wasReconstructed: false,
                hasKeywordContext: true,
            };
            const result = calculateConfidence(factors);
            // Base: 0.90 + 0.05 = 0.95
            expect(result).toBe(0.95);
        });

        it('should apply monthYear base confidence', () => {
            const factors: ConfidenceFactors = {
                matchType: 'monthYear',
                validDatesCount: 2,
                rejectedDatesCount: 0,
                wasReconstructed: false,
                hasKeywordContext: false,
            };
            const result = calculateConfidence(factors);
            expect(result).toBe(0.8);
        });

        it('should apply fuzzy base confidence', () => {
            const factors: ConfidenceFactors = {
                matchType: 'fuzzy',
                validDatesCount: 2,
                rejectedDatesCount: 0,
                wasReconstructed: false,
                hasKeywordContext: false,
            };
            const result = calculateConfidence(factors);
            expect(result).toBe(0.7);
        });

        it('should combine all factors correctly', () => {
            const factors: ConfidenceFactors = {
                matchType: 'sequence',
                validDatesCount: 1,
                rejectedDatesCount: 5, // noisy
                wasReconstructed: true,
                hasKeywordContext: true,
            };
            const result = calculateConfidence(factors);
            // Base: 0.75 + 0.05 (keyword) = 0.80
            // Reconstructed: 0.80 * 0.9 = 0.72
            // Single date: min(1, 0.72 + 0.03) = 0.75
            // Noisy: 0.75 * 0.85 = 0.6375 → rounded to 0.64
            expect(result).toBe(0.64);
        });

        it('should always return a value between 0 and 1', () => {
            const testCases: ConfidenceFactors[] = [
                { matchType: 'standard', validDatesCount: 1, rejectedDatesCount: 0, wasReconstructed: false, hasKeywordContext: true },
                { matchType: 'partial', validDatesCount: 10, rejectedDatesCount: 100, wasReconstructed: true, hasKeywordContext: false },
                { matchType: 'fuzzy', validDatesCount: 5, rejectedDatesCount: 15, wasReconstructed: true, hasKeywordContext: false },
            ];

            for (const factors of testCases) {
                const result = calculateConfidence(factors);
                expect(result).toBeGreaterThanOrEqual(0);
                expect(result).toBeLessThanOrEqual(1);
            }
        });
    });

    // ── hasExpirationKeyword ─────────────────────────────────────────

    describe('hasExpirationKeyword', () => {
        it('should detect SCAD keyword', () => {
            expect(hasExpirationKeyword('SCAD: 15/10/2026')).toBe(true);
        });

        it('should detect SCADENZA keyword', () => {
            expect(hasExpirationKeyword('SCADENZA 15 OTT')).toBe(true);
        });

        it('should detect EXP keyword', () => {
            expect(hasExpirationKeyword('EXP 2026')).toBe(true);
        });

        it('should detect BEST BEFORE keyword', () => {
            expect(hasExpirationKeyword('BEST BEFORE 01/01/27')).toBe(true);
        });

        it('should detect USE BY keyword', () => {
            expect(hasExpirationKeyword('USE BY 15/11')).toBe(true);
        });

        it('should be case-insensitive', () => {
            expect(hasExpirationKeyword('scad: 15/10')).toBe(true);
            expect(hasExpirationKeyword('exp 2026')).toBe(true);
        });

        it('should return false for text without expiration keywords', () => {
            expect(hasExpirationKeyword('INGREDIENTI: ACQUA')).toBe(false);
            expect(hasExpirationKeyword('PRODOTTO IN ITALIA')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(hasExpirationKeyword('')).toBe(false);
        });
    });

    // ── EXPIRATION_KEYWORDS constant ─────────────────────────────────

    describe('EXPIRATION_KEYWORDS', () => {
        it('should be a non-empty array', () => {
            expect(EXPIRATION_KEYWORDS.length).toBeGreaterThan(0);
        });

        it('should contain common Italian keywords', () => {
            expect(EXPIRATION_KEYWORDS).toContain('SCAD');
            expect(EXPIRATION_KEYWORDS).toContain('SCADENZA');
        });

        it('should contain common English keywords', () => {
            expect(EXPIRATION_KEYWORDS).toContain('EXP');
            expect(EXPIRATION_KEYWORDS).toContain('BEST BEFORE');
        });
    });
});
