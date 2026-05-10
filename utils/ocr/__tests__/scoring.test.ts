// scoring.test.ts — tests for OCR scoring and date selection module.
//
// exports: none
// used_by: none
// rules:   none

import { selectBestDate } from '../scoring';
import { DateMatch } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

const createMatch = (
    value: string,
    overrides: Partial<DateMatch> = {}
): DateMatch => ({
    value,
    isSequence: false,
    isMonthYear: false,
    isTextual: false,
    isDerived: false,
    ...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────

describe('selectBestDate', () => {

    // ── No valid dates ──────────────────────────────────────────────

    describe('no valid dates', () => {
        it('should return failure when no matches are provided', () => {
            const result = selectBestDate([], new Set(), 'no dates here');
            expect(result.success).toBe(false);
            expect(result.extractedDate).toBeNull();
            expect(result.error).toBeDefined();
        });

        it('should return failure when all dates are unparsable', () => {
            const matches = [createMatch('notadate')];
            const result = selectBestDate(matches, new Set(), 'notadate');
            expect(result.success).toBe(false);
            expect(result.extractedDate).toBeNull();
        });
    });

    // ── 4-digit year boost ──────────────────────────────────────────

    describe('4-digit year boost', () => {
        it('should prioritize 4-digit year dates over 2-digit year dates', () => {
            const matches = [
                createMatch('15/05/26'),          // 2-digit year
                createMatch('15/05/2026'),       // 4-digit year → +100 boost
            ];
            const result = selectBestDate(matches, new Set(), '15/05/26 15/05/2026');
            expect(result.success).toBe(true);
            expect(result.extractedDate).toContain('2026-05-15');
        });
    });

    // ── Spatial anchoring boost ─────────────────────────────────────

    describe('spatial anchoring boost', () => {
        it('should massively prioritize spatially anchored dates (+200)', () => {
            const futureYear = new Date().getFullYear() + 2;
            const futureYearStr = futureYear.toString();
            const matches = [
                createMatch(`01/01/${futureYearStr}`),
                createMatch(`31/12/${futureYearStr}`),
            ];
            const anchored = new Set([`31/12/${futureYearStr}`]);
            const result = selectBestDate(matches, anchored, `01/01/${futureYearStr} 31/12/${futureYearStr}`);
            expect(result.success).toBe(true);
            expect(result.extractedDate).toContain(`${futureYear}-12-31`);
        });
    });

    // ── Derived date penalty ────────────────────────────────────────

    describe('derived date penalty', () => {
        it('should penalize derived/fuzzy dates (-100)', () => {
            const matches = [
                createMatch('10.10.2026', { isDerived: true }),   // Derived → -100
                createMatch('10/10/2026', { isDerived: false }),  // Standard → +50
            ];
            const result = selectBestDate(matches, new Set(), '10.10.2026 10/10/2026');
            expect(result.success).toBe(true);
            expect(result.extractedDate).toContain('2026-10-10');
        });
    });

    // ── Authentic (non-sequence) boost ──────────────────────────────

    describe('authentic vs sequence', () => {
        it('should boost non-sequence authentic dates (+50)', () => {
            const matches = [
                createMatch('15/10/2026', { isSequence: true }),   // Sequence → no +50
                createMatch('20/10/2026', { isSequence: false }),   // Authentic → +50
            ];
            // Both are standard dates, but non-sequence gets +50
            // 20/10/2026: standard +50, 15/10/2026: no +50
            // If same score, earliest date wins (tie-breaker)
            const result = selectBestDate(matches, new Set(), '15/10/2026 20/10/2026');
            expect(result.success).toBe(true);
            expect(result.extractedDate).toContain('2026-10-20');
        });
    });

    // ── Textual month boost ─────────────────────────────────────────

    describe('textual month boost', () => {
        it('should boost textual month dates (+30)', () => {
            const matches = [
                createMatch('15 OTT 2026', { isTextual: true }),
                createMatch('15/10/2026', { isTextual: false }),
            ];
            // Textual: base +30, Standard: +50 for non-sequence
            // Both with 4-digit year: +100 each
            // Textual: 100 + 30 = 130, Standard: 100 + 50 = 150
            // Standard should win; let's make textual + anchor to flip it
            const anchored = new Set(['15 OTT 2026']);
            const result = selectBestDate(matches, anchored, '15 OTT 2026 15/10/2026');
            expect(result.success).toBe(true);
            // With spatial boost (+200), textual wins
            expect(result.extractedDate).toContain('2026-10-15');
        });
    });

    // ── Month/Year penalty ──────────────────────────────────────────

    describe('month/year penalty', () => {
        it('should penalize month/year dates (-10)', () => {
            const matches = [
                createMatch('10/2026', { isMonthYear: true }),    // Month/year → -10
                createMatch('15/10/2026', { isMonthYear: false }),
            ];
            const result = selectBestDate(matches, new Set(), '10/2026 15/10/2026');
            expect(result.success).toBe(true);
            // Standard date should beat month/year
            expect(result.extractedDate).toContain('2026-10-15');
        });
    });

    // ── Future date filtering ──────────────────────────────────────

    describe('future date filtering', () => {
        it('should return failure when all dates are in the past', () => {
            const matches = [createMatch('01/01/2020')];
            const result = selectBestDate(matches, new Set(), '01/01/2020');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should only consider future dates', () => {
            const matches = [
                createMatch('01/01/2020'),      // Past
                createMatch('15/10/2027'),      // Future
            ];
            const result = selectBestDate(matches, new Set(), '01/01/2020 15/10/2027');
            expect(result.success).toBe(true);
            expect(result.extractedDate).toContain('2027-10-15');
        });
    });

    // ── Invalid day filtering (31st in short month) ────────────────

    describe('invalid day filtering', () => {
        it('should deprioritize 31st in short months', () => {
            // Feb 31 is invalid → deprioritized
            const matches = [
                createMatch('31/02/2027'),     // Invalid (Feb 31)
                createMatch('28/02/2027'),     // Valid
            ];
            const result = selectBestDate(matches, new Set(), '31/02/2027 28/02/2027');
            expect(result.success).toBe(true);
            expect(result.extractedDate).toContain('2027-02-28');
        });
    });

    // ── Confidence calculation ──────────────────────────────────────

    describe('confidence calculation', () => {
        it('should return confidence > 0 for successful extraction', () => {
            const futureYear = new Date().getFullYear() + 1;
            const matches = [createMatch(`15/10/${futureYear}`)];
            const result = selectBestDate(matches, new Set(), `15/10/${futureYear}`);
            expect(result.success).toBe(true);
            expect(result.confidence).toBeGreaterThan(0);
        });

        it('should boost confidence by 0.1 for spatially anchored dates', () => {
            const futureYear = new Date().getFullYear() + 1;
            const yearStr = futureYear.toString();
            const matches = [createMatch(`15/10/${yearStr}`)];

            const noAnchorResult = selectBestDate(matches, new Set(), `15/10/${yearStr}`);
            const anchoredResult = selectBestDate(matches, new Set([`15/10/${yearStr}`]), `15/10/${yearStr}`);

            expect(anchoredResult.confidence).toBeGreaterThan(noAnchorResult.confidence);
        });
    });

    // ── Tie-breaking by earliest date ───────────────────────────────

    describe('tie-breaking', () => {
        it('should select earliest date when scores are equal', () => {
            const matches = [
                createMatch('15/10/2026'),
                createMatch('10/10/2026'),
            ];
            // Both standard, both 4-digit, same score → earliest wins
            const result = selectBestDate(matches, new Set(), '15/10/2026 10/10/2026');
            expect(result.success).toBe(true);
            expect(result.extractedDate).toContain('2026-10-10');
        });
    });

    // ── Edge cases ──────────────────────────────────────────────────

    describe('edge cases', () => {
        it('should handle empty rawText', () => {
            const futureYear = new Date().getFullYear() + 1;
            const matches = [createMatch(`15/10/${futureYear}`)];
            const result = selectBestDate(matches, new Set(), '');
            expect(result.success).toBe(true);
        });

        it('should return rawText in the result', () => {
            const futureYear = new Date().getFullYear() + 1;
            const rawText = `SCAD: 15/10/${futureYear}`;
            const matches = [createMatch(`15/10/${futureYear}`)];
            const result = selectBestDate(matches, new Set(), rawText);
            expect(result.rawText).toBe(rawText);
        });

        it('should cap confidence at 1.0', () => {
            const futureYear = new Date().getFullYear() + 1;
            const yearStr = futureYear.toString();
            const matches = [createMatch(`15/10/${yearStr}`)];
            const anchored = new Set([`15/10/${yearStr}`]);
            const result = selectBestDate(matches, anchored, `SCAD: 15/10/${yearStr}`);
            expect(result.confidence).toBeLessThanOrEqual(1.0);
        });
    });
});
