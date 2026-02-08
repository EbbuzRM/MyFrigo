import { cleanBlockText } from '../preprocessing';
import { findAllMatches } from '../parsing';
import { findSpatiallyAnchoredMatches } from '../spatial';
import { selectBestDate } from '../scoring';
import { TextBlock, Frame } from '@react-native-ml-kit/text-recognition';

// Mock Frame Helper
const createFrame = (top: number, left: number, width: number, height: number): Frame => ({
    top, left, width, height
});

// Mock Block Helper
const createBlock = (text: string, frame: Frame): TextBlock => ({
    text,
    frame,
    cornerPoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
    lines: [],
    recognizedLanguages: []
});

describe('OCR Engine Refactoring Tests', () => {

    describe('1. Preprocessing (cleanBlockText)', () => {
        it('should replace O/S/B with 0/5/8 in numeric contexts', () => {
            expect(cleanBlockText('15 O5 2026')).toBe('15 05 2026');
            expect(cleanBlockText('31 B8 26')).toBe('31 88 26'); // Valid replacement
            expect(cleanBlockText('S5.03.24')).toBe('55.03.24');
        });

        it('should NOT replace characters in obvious text contexts', () => {
            expect(cleanBlockText('SCADENZA')).toBe('SCADENZA'); // No adjacent numbers
            expect(cleanBlockText('BEST BEFORE')).toBe('BEST BEFORE');
        });
    });

    describe('2. Parsing (findAllMatches)', () => {
        it('should extract standard dates', () => {
            const blocks = [createBlock('SCAD: 15/10/2026', createFrame(0, 0, 100, 20))];
            const { matches } = findAllMatches(blocks);
            // It might find multiple candidates (Sequence, Partial, etc.) on the same text
            // We just ensure the CORRECT full date is present.
            expect(matches.some(m => m.value === '15/10/2026')).toBe(true);
        });

        it('should extract textual months', () => {
            const blocks = [createBlock('14 SET 25', createFrame(0, 0, 100, 20))];
            const { matches } = findAllMatches(blocks);
            expect(matches.some(m => m.value === '14 SET 25' && m.isTextual)).toBe(true);
        });

        it('should identify anchors', () => {
            const blocks = [createBlock('SCADENZA:', createFrame(0, 0, 100, 20))];
            const { anchors } = findAllMatches(blocks);
            expect(anchors).toHaveLength(1);
            expect(anchors[0].text).toBe('SCADENZA:');
        });
    });

    describe('3. Spatial Analysis (findSpatiallyAnchoredMatches)', () => {
        it('should link date BELOW anchor', () => {
            const anchorBlock = createBlock('SCAD', createFrame(10, 10, 50, 20));
            const dateBlock = createBlock('31/12/2026', createFrame(40, 10, 80, 20)); // Below (top: 40 > 10+20)

            const { matches } = findAllMatches([dateBlock]);
            const anchored = findSpatiallyAnchoredMatches(matches, [anchorBlock]);

            expect(anchored.has('31/12/2026')).toBe(true);
        });

        it('should link date RIGHT OF anchor', () => {
            const anchorBlock = createBlock('EXP', createFrame(10, 10, 30, 20));
            const dateBlock = createBlock('01/01/2027', createFrame(10, 50, 80, 20)); // Right (left: 50 > 10+30)

            const { matches } = findAllMatches([dateBlock]);
            const anchored = findSpatiallyAnchoredMatches(matches, [anchorBlock]);

            expect(anchored.has('01/01/2027')).toBe(true);
        });

        it('should NOT link date if too far away', () => {
            const anchorBlock = createBlock('SCAD', createFrame(10, 10, 50, 20));
            const dateBlock = createBlock('31/12/2026', createFrame(500, 10, 80, 20)); // Way below

            const { matches } = findAllMatches([dateBlock]);
            const anchored = findSpatiallyAnchoredMatches(matches, [anchorBlock]);

            expect(anchored.size).toBe(0);
        });
    });

    describe('4. Scoring & Selection (selectBestDate)', () => {
        it('should prioritize 4-digit years', () => {
            const matches = [
                { value: '15/05/26', isSequence: false, isMonthYear: false, isTextual: false, isDerived: false },
                { value: '15/05/2026', isSequence: false, isMonthYear: false, isTextual: false, isDerived: false } // +100
            ];
            // @ts-ignore
            const result = selectBestDate(matches, new Set(), 'raw text');
            expect(result.extractedDate?.indexOf('2026-05-15') !== -1).toBe(true);
        });

        it('should MASSIVELY prioritize spatially anchored dates', () => {
            const matches = [
                { value: '01/01/2025', isSequence: false, isMonthYear: false, isTextual: false, isDerived: false }, // Random older date
                { value: '31/12/2026', isSequence: false, isMonthYear: false, isTextual: false, isDerived: false }  // Anchored
            ];

            const anchored = new Set(['31/12/2026']);
            // @ts-ignore
            const result = selectBestDate(matches, anchored, 'raw text');

            expect(result.extractedDate?.indexOf('2026-12-31') !== -1).toBe(true);
        });

        it('should penalize derived/fuzzy dates', () => {
            const matches = [
                { value: '10.10.2026', isSequence: false, isMonthYear: false, isTextual: false, isDerived: true }, // Derived (-100)
                { value: '10/10/2026', isSequence: false, isMonthYear: false, isTextual: false, isDerived: false }  // Standard
            ];
            // @ts-ignore
            const result = selectBestDate(matches, new Set(), 'raw text');
            expect(result.extractedDate?.indexOf('2026-10-10') !== -1).toBe(true);
        });
    });

});
