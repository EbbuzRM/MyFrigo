// expirationDateFix.test.ts — regression tests for OCR date selection bug
// (15/08/26 + lotto L32762 + 10:63 selecting 2026-08-31 instead of 2026-08-15).
//
// exports: none
// used_by: none
// rules:   none

import { findAllMatches } from '../parsing';
import { selectBestDate } from '../scoring';
import { TextBlock, Frame } from '@react-native-ml-kit/text-recognition';
import { DateMatch } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

const createFrame = (top: number, left: number, width: number, height: number): Frame => ({
    top, left, width, height,
});

const createBlock = (text: string, frame?: Frame, confidence?: number): TextBlock => ({
    text,
    frame: frame ?? createFrame(0, 0, 100, 20),
    cornerPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
    lines: [],
    recognizedLanguages: [],
    ...(confidence !== undefined ? { confidence } : {}),
});

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

// ── Regression tests ─────────────────────────────────────────────────

describe('OCR expiration date fix (Bug A + Bug B)', () => {

    // BUG A: inner month-year inside a complete standard date must not win.
    it('should extract 2026-08-15 (not 2026-08-31) from "15/08/26 L32762 10:63"', () => {
        const blocks = [createBlock('15/08/26 L32762 10:63')];
        const { matches } = findAllMatches(blocks);
        // month-year "08/26" must NOT be present as a separate inner match
        const innerMonthYear = matches.find(m => m.isMonthYear && m.value.replace(/[\s.\-\/\\]/g, '') === '0826');
        expect(innerMonthYear).toBeUndefined();

        const anchored = new Set<string>();
        const result = selectBestDate(matches, anchored, '15/08/26 L32762 10:63');
        expect(result.success).toBe(true);
        expect(result.extractedDate).toBe('2026-08-15');
    });

    // Legitimate month/year only → last day of month (preserved behaviour).
    it('should resolve standalone "SCAD 08/26" to 2026-08-31', () => {
        const blocks = [createBlock('SCAD 08/26')];
        const { matches } = findAllMatches(blocks);
        const anchored = new Set<string>();
        const result = selectBestDate(matches, anchored, 'SCAD 08/26');
        expect(result.success).toBe(true);
        expect(result.extractedDate).toBe('2026-08-31');
    });

    it('should resolve standalone "FINE: 08/26" to 2026-08-31', () => {
        const blocks = [createBlock('FINE: 08/26')];
        const { matches } = findAllMatches(blocks);
        const anchored = new Set<string>();
        const result = selectBestDate(matches, anchored, 'FINE: 08/26');
        expect(result.success).toBe(true);
        expect(result.extractedDate).toBe('2026-08-31');
    });

    // BUG A: per-block filter — a separate "08/26" in another block must not be
    // cancelled by the complete date in the first block.
    it('should keep main date 2026-08-15 when another block has "SCAFFALE 08/26"', () => {
        const blocks = [
            createBlock('15/08/26'),
            createBlock('SCAFFALE 08/26'),
        ];
        const { matches } = findAllMatches(blocks);
        // Both a standard "15/08/26" and a legitimate month-year "08/26" should exist.
        const hasStandard = matches.some(m => !m.isMonthYear && m.value.replace(/[\s.\-\/\\]/g, '') === '150826');
        const hasShelfMonthYear = matches.some(m => m.isMonthYear && m.value.replace(/[\s.\-\/\\]/g, '') === '0826');
        expect(hasStandard).toBe(true);
        expect(hasShelfMonthYear).toBe(true);

        const anchored = new Set<string>();
        const result = selectBestDate(matches, anchored, '15/08/26 SCAFFALE 08/26');
        expect(result.success).toBe(true);
        expect(result.extractedDate).toBe('2026-08-15');
    });

    // BUG B: priority lookup — the standard match must be the representative so it
    // claims the +50 bonus and beats a competing month-year candidate.
    it('should pick 2026-08-15 via priority lookup when 150826 + 08/26 are present', () => {
        const matches: DateMatch[] = [
            createMatch('15.08.26', { isSequence: false, isMonthYear: false }),   // standard → +50
            createMatch('08/26', { isMonthYear: true }),                         // monthYear → -10, last day
        ];
        const anchored = new Set<string>();
        const result = selectBestDate(matches, anchored, '150826 08/26');
        expect(result.success).toBe(true);
        expect(result.extractedDate).toBe('2026-08-15');
    });
});
