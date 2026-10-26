import type { TextBlock } from '@react-native-ml-kit/text-recognition';
import { findAllMatches } from '../parsing';
import { findSpatiallyAnchoredMatches } from '../spatial';
import { selectBestDate } from '../scoring';
import type { OCRResult } from '../types';

jest.unmock('date-fns');

const createBlock = (text: string, index: number = 0): TextBlock => ({
    text,
    frame: { top: index * 30, left: 0, width: 420, height: 25 },
    cornerPoints: [{ x: 0, y: 0 }, { x: 420, y: 0 }, { x: 420, y: 25 }, { x: 0, y: 25 }],
    lines: [],
    recognizedLanguages: [],
});

const extractDate = (texts: string[]): OCRResult => {
    const blocks = texts.map((text, index) => createBlock(text, index));
    const { matches, anchors } = findAllMatches(blocks);
    return selectBestDate(matches, findSpatiallyAnchoredMatches(matches, anchors), texts.join('\n'));
};

describe('compact expiration dates beside lot numbers', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2026, 9, 26, 12));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it.each(['10112026', '101126', '10/11/2026', 'SCAD: 10112026'])(
        'selects the complete expiration date from %s',
        text => {
            expect(extractDate([text]).extractedDate).toBe('2026-11-10');
        }
    );

    it('preserves all eight digits without adding a truncated six-digit candidate', () => {
        const { matches } = findAllMatches([createBlock('10112026')]);
        expect(matches.some(match => match.isSequence && match.value === '10.11.2026')).toBe(true);
        expect(matches.some(match => match.value === '10.11.20')).toBe(false);
    });

    it('extracts the compact expiration date from the photographed label', () => {
        expect(extractDate([
            'Lotto:/Da consumare entro (in confezione integra):',
            'Lotto: L 20102026',
            'Da consumarsi entro:',
            '10112026',
        ]).extractedDate).toBe('2026-11-10');
    });

    it.each(['LOTTO: L 01112026', 'LOTTO: 01112026', 'L 01112026', 'L01112026', 'L: 01112026'])(
        'excludes the complete numeric lot %s',
        lot => {
            const { matches } = findAllMatches([createBlock(lot)]);
            expect(matches).toEqual([]);
            expect(extractDate([`${lot}\nDa consumarsi entro:\n10112026`]).extractedDate)
                .toBe('2026-11-10');
        }
    );

    it.each(['1011202', '101112026', '1011112026', '8010112026123'])(
        'does not extract a date fragment from the longer or incomplete number %s',
        text => {
            expect(findAllMatches([createBlock(text)]).matches).toEqual([]);
            expect(extractDate([text]).success).toBe(false);
        }
    );
});
