// spatial.test.ts — tests for OCR spatial analysis module.
//
// exports: none
// used_by: none
// rules:   none

import { findSpatiallyAnchoredMatches } from '../spatial';
import { TextBlock, Frame } from '@react-native-ml-kit/text-recognition';
import { DateMatch } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

const createFrame = (top: number, left: number, width: number, height: number): Frame => ({
    top, left, width, height,
});

const createBlock = (text: string, frame: Frame): TextBlock => ({
    text,
    frame,
    cornerPoints: [{ x: frame.left, y: frame.top }, { x: frame.left + frame.width, y: frame.top }, { x: frame.left + frame.width, y: frame.top + frame.height }, { x: frame.left, y: frame.top + frame.height }],
    lines: [],
    recognizedLanguages: [],
});

const createDateMatch = (value: string, frame?: Frame): DateMatch => ({
    value,
    isSequence: false,
    isMonthYear: false,
    isTextual: false,
    isDerived: false,
    frame,
});

// ── Tests ────────────────────────────────────────────────────────────

describe('findSpatiallyAnchoredMatches', () => {

    it('should link a date that is below and near an anchor', () => {
        const anchor = createBlock('SCAD', createFrame(10, 10, 50, 20));
        const dateFrame = createFrame(40, 10, 80, 20); // Below anchor, same x area

        const matches = [createDateMatch('15.10.2026', dateFrame)];
        const anchored = findSpatiallyAnchoredMatches(matches, [anchor]);

        expect(anchored.has('15.10.2026')).toBe(true);
    });

    it('should link a date that is right of an anchor', () => {
        const anchor = createBlock('EXP', createFrame(10, 10, 30, 20));
        const dateFrame = createFrame(10, 50, 80, 20); // Same y, to the right

        const matches = [createDateMatch('01.01.2027', dateFrame)];
        const anchored = findSpatiallyAnchoredMatches(matches, [anchor]);

        expect(anchored.has('01.01.2027')).toBe(true);
    });

    it('should link a date that is above an anchor', () => {
        const anchor = createBlock('SCAD', createFrame(50, 10, 50, 20));
        const dateFrame = createFrame(10, 10, 80, 20); // Above anchor, same x area

        const matches = [createDateMatch('15.10.2026', dateFrame)];
        const anchored = findSpatiallyAnchoredMatches(matches, [anchor]);

        expect(anchored.has('15.10.2026')).toBe(true);
    });

    it('should NOT link a date that is far from the anchor (>200px)', () => {
        const anchor = createBlock('SCAD', createFrame(10, 10, 50, 20));
        const dateFrame = createFrame(500, 10, 80, 20); // Way below

        const matches = [createDateMatch('31.12.2026', dateFrame)];
        const anchored = findSpatiallyAnchoredMatches(matches, [anchor]);

        expect(anchored.size).toBe(0);
    });

    it('should skip matches without frame data', () => {
        const anchor = createBlock('SCAD', createFrame(10, 10, 50, 20));
        const matches = [createDateMatch('15.10.2026')]; // No frame

        const anchored = findSpatiallyAnchoredMatches(matches, [anchor]);

        expect(anchored.size).toBe(0);
    });

    it('should skip anchors without frame data', () => {
        const anchorNoFrame: TextBlock = {
            text: 'SCAD',
            frame: undefined,
            cornerPoints: [
                { x: 0, y: 0 },
                { x: 0, y: 0 },
                { x: 0, y: 0 },
                { x: 0, y: 0 },
            ],
            lines: [],
            recognizedLanguages: [],
        };
        const dateFrame = createFrame(40, 10, 80, 20);
        const matches = [createDateMatch('15.10.2026', dateFrame)];

        const anchored = findSpatiallyAnchoredMatches(matches, [anchorNoFrame]);

        expect(anchored.size).toBe(0);
    });

    it('should handle multiple matches and multiple anchors', () => {
        const anchor1 = createBlock('SCAD', createFrame(10, 10, 50, 20));
        const anchor2 = createBlock('EXP', createFrame(10, 200, 50, 20));

        const dateFrame1 = createFrame(40, 10, 80, 20);  // Near anchor1
        const dateFrame2 = createFrame(40, 200, 80, 20); // Near anchor2

        const matches = [
            createDateMatch('15.10.2026', dateFrame1),
            createDateMatch('01.01.2027', dateFrame2),
        ];

        const anchored = findSpatiallyAnchoredMatches(matches, [anchor1, anchor2]);

        expect(anchored.has('15.10.2026')).toBe(true);
        expect(anchored.has('01.01.2027')).toBe(true);
    });

    it('should return empty set when no matches are provided', () => {
        const anchor = createBlock('SCAD', createFrame(10, 10, 50, 20));
        const anchored = findSpatiallyAnchoredMatches([], [anchor]);

        expect(anchored.size).toBe(0);
    });

    it('should return empty set when no anchors are provided', () => {
        const dateFrame = createFrame(40, 10, 80, 20);
        const matches = [createDateMatch('15.10.2026', dateFrame)];
        const anchored = findSpatiallyAnchoredMatches(matches, []);

        expect(anchored.size).toBe(0);
    });

    it('should deduplicate match values in the result set', () => {
        const anchor1 = createBlock('SCAD', createFrame(10, 10, 50, 20));
        const anchor2 = createBlock('EXP', createFrame(15, 10, 50, 20)); // Very close to anchor1

        const dateFrame = createFrame(40, 10, 80, 20);
        const matches = [createDateMatch('15.10.2026', dateFrame)];

        const anchored = findSpatiallyAnchoredMatches(matches, [anchor1, anchor2]);

        // Same value added twice to Set → still just one entry
        expect(anchored.size).toBe(1);
        expect(anchored.has('15.10.2026')).toBe(true);
    });
});
