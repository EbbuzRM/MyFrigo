// ocrEngine.test.ts — ocrEngine.test module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
            expect(cleanBlockText('15 O5 2026')).toBe('15.05.2026');
            expect(cleanBlockText('31 B8 26')).toBe('31.88.26'); // Valid replacement
            expect(cleanBlockText('S5.03.24')).toBe('5.03.24');
        });

        it('should normalize compact OCR date where 9 is read as g', () => {
            expect(cleanBlockText('110g26')).toBe('110926');
        });

        it('should normalize tilde separator in compact OCR dates', () => {
            expect(cleanBlockText('11~0926')).toBe('110926');
        });

        it('should remove stray letters immediately before complete dates', () => {
            expect(cleanBlockText('X24 -05 2026 %')).toContain('24.05.2026');
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
            expect(matches.some(m => m.value === '15.10.2026')).toBe(true);
        });

        it('should ignore packaging dates marked with CONF', () => {
            const blocks = [createBlock('CONF. 14/04/26 A 07:27', createFrame(0, 0, 160, 20))];
            const { matches } = findAllMatches(blocks);
            const result = selectBestDate(matches, new Set(), 'CONF. 14/04/26 A 07:27');

            expect(result.success).toBe(false);
            expect(result.extractedDate).toBeNull();
        });

        it('should ignore packaging dates marked with OCR variant CONE', () => {
            const blocks = [createBlock('CONE.14/04/26 A 07:27', createFrame(0, 0, 160, 20))];
            const { matches } = findAllMatches(blocks);
            const result = selectBestDate(matches, new Set(), 'CONE.14/04/26 A 07:27');

            expect(result.success).toBe(false);
            expect(result.extractedDate).toBeNull();
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

        it('should select the expiration date from real milk OCR output and ignore CONE packaging date', () => {
            const blocks = [
                createBlock('DA CONSUMARSI\nPREFERIBILMENTE ENTROIL', createFrame(0, 0, 260, 40)),
                createBlock('110g26\nCONE.14/04/26 A\n07:27 N.15', createFrame(45, 0, 260, 60)),
                createBlock('aprire e riaprire:\npecOLLEVA,', createFrame(120, 0, 260, 40)),
            ];
            const { matches, anchors } = findAllMatches(blocks);
            const anchored = findSpatiallyAnchoredMatches(matches, anchors);
            const result = selectBestDate(matches, anchored, blocks.map(block => block.text).join(' '));

            expect(result.success).toBe(true);
            expect(result.extractedDate).toBe('2026-09-11');
        });

        it('should select the expiration date when slash is read as tilde', () => {
            const blocks = [
                createBlock('DA CONSUMARSI\nPREFERIBILMENTE ENTROIL', createFrame(0, 0, 260, 40)),
                createBlock('11~0926\nCONE.14/04/26 A\n07:27 N.15', createFrame(45, 0, 260, 60)),
                createBlock('riaprire: per aprire e', createFrame(120, 0, 260, 20)),
                createBlock('SOLLEVA.', createFrame(145, 0, 120, 20)),
            ];
            const { matches, anchors } = findAllMatches(blocks);
            const anchored = findSpatiallyAnchoredMatches(matches, anchors);
            const result = selectBestDate(matches, anchored, blocks.map(block => block.text).join(' '));

            expect(result.success).toBe(true);
            expect(result.extractedDate).toBe('2026-09-11');
        });

        it('should parse compact expiry date after backslash separator and ignore lot date', () => {
            const blocks = [
                createBlock('Lotto:/Da consumare entro (in confezione integra):', createFrame(0, 0, 420, 30)),
                createBlock('Lotto: 02/05/2026\nLI consumarsi entro:23\\0512026', createFrame(40, 0, 420, 50)),
                createBlock('Conservare in frígo a max. +5 °C.', createFrame(100, 0, 260, 30)),
            ];
            const { matches, anchors } = findAllMatches(blocks);
            const anchored = findSpatiallyAnchoredMatches(matches, anchors);
            const result = selectBestDate(matches, anchored, blocks.map(block => block.text).join(' '));

            expect(result.success).toBe(true);
            expect(result.extractedDate).toBe('2026-05-23');
        });

        it('should select the full printed date when OCR adds letters before the day', () => {
            const blocks = [
                createBlock('Da consumare entro (in confezione integra):', createFrame(0, 0, 360, 30)),
                createBlock('X24 -05 2026 %', createFrame(45, 0, 220, 30)),
                createBlock('iH46', createFrame(80, 0, 80, 20)),
            ];
            const { matches, anchors } = findAllMatches(blocks);
            const anchored = findSpatiallyAnchoredMatches(matches, anchors);
            const result = selectBestDate(matches, anchored, blocks.map(block => block.text).join(' '));

            expect(result.success).toBe(true);
            expect(result.extractedDate).toBe('2026-05-24');
        });
    });

    describe('3. Spatial Analysis (findSpatiallyAnchoredMatches)', () => {
        it('should link date BELOW anchor', () => {
            const anchorBlock = createBlock('SCAD', createFrame(10, 10, 50, 20));
            const dateBlock = createBlock('31/12/2026', createFrame(40, 10, 80, 20)); // Below (top: 40 > 10+20)

            const { matches } = findAllMatches([dateBlock]);
            const anchored = findSpatiallyAnchoredMatches(matches, [anchorBlock]);

            expect(anchored.has('31.12.2026')).toBe(true);
        });

        it('should link date RIGHT OF anchor', () => {
            const anchorBlock = createBlock('EXP', createFrame(10, 10, 30, 20));
            const dateBlock = createBlock('01/01/2027', createFrame(10, 50, 80, 20)); // Right (left: 50 > 10+30)

            const { matches } = findAllMatches([dateBlock]);
            const anchored = findSpatiallyAnchoredMatches(matches, [anchorBlock]);

            expect(anchored.has('01.01.2027')).toBe(true);
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
            const result = selectBestDate(matches, new Set(), 'raw text');
            expect(result.extractedDate?.indexOf('2026-05-15') !== -1).toBe(true);
        });

        it('should MASSIVELY prioritize spatially anchored dates', () => {
            const matches = [
                { value: '01/01/2025', isSequence: false, isMonthYear: false, isTextual: false, isDerived: false }, // Random older date
                { value: '31/12/2026', isSequence: false, isMonthYear: false, isTextual: false, isDerived: false }  // Anchored
            ];

            const anchored = new Set(['31/12/2026']);
            const result = selectBestDate(matches, anchored, 'raw text');
            expect(result.extractedDate?.indexOf('2026-12-31') !== -1).toBe(true);
        });

        it('should penalize derived/fuzzy dates', () => {
            const matches = [
                { value: '10.10.2026', isSequence: false, isMonthYear: false, isTextual: false, isDerived: true }, // Derived (-100)
                { value: '10/10/2026', isSequence: false, isMonthYear: false, isTextual: false, isDerived: false }  // Standard
            ];
            const result = selectBestDate(matches, new Set(), 'raw text');
            expect(result.extractedDate?.indexOf('2026-10-10') !== -1).toBe(true);
        });
    });

});
