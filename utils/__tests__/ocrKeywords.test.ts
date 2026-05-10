// ocrKeywords.test.ts — ocrKeywords test module.
//
// exports: none
// used_by: none
// rules:   none

import { EXPIRATION_ANCHORS, isExpirationAnchor } from '../ocrKeywords';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('EXPIRATION_ANCHORS', () => {
    it('should be a readonly array (as const)', () => {
        // TypeScript enforces `as const` at compile time. At runtime we verify
        // the array is non-empty and contains only strings.
        expect(Array.isArray(EXPIRATION_ANCHORS)).toBe(true);
        expect(EXPIRATION_ANCHORS.length).toBeGreaterThan(0);
        EXPIRATION_ANCHORS.forEach((kw) => {
            expect(typeof kw).toBe('string');
        });
    });

    it('should contain expected keywords', () => {
        const expected = [
            'SCAD',
            'SCADENZA',
            'EXP',
            'EXPIRES',
            'EXPIRY',
            'BEST BEFORE',
            'USE BY',
            'BBE',
            'BB',
            'ENTRO',
            'CONSUMARSI',
            'PREFERIBILMENTE',
            'VALIDO',
            'FINO',
            'VAL',
            'DA CONSUMARE',
            'DATA',
            'LOTTO/SCAD',
            'TMC',
        ];
        expected.forEach((kw) => {
            expect(EXPIRATION_ANCHORS).toContain(kw);
        });
    });

    it('should not be empty', () => {
        expect(EXPIRATION_ANCHORS.length).toBeGreaterThan(0);
    });
});

describe('isExpirationAnchor', () => {
    describe('Positive — exact keyword match', () => {
        const positiveCases = [
            'SCAD',
            'SCADENZA',
            'EXP',
            'EXPIRES',
            'EXPIRY',
            'BEST BEFORE',
            'USE BY',
            'BBE',
            'BB',
            'ENTRO',
            'CONSUMARSI',
            'PREFERIBILMENTE',
            'VALIDO',
            'FINO',
            'VAL',
            'DA CONSUMARE',
            'DATA',
            'LOTTO/SCAD',
            'TMC',
        ];

        positiveCases.forEach((kw) => {
            it(`should return true for '${kw}'`, () => {
                expect(isExpirationAnchor(kw)).toBe(true);
            });
        });
    });

    describe('Positive — contained in text', () => {
        it("should return true for 'Data di scadenza: 15/11/26'", () => {
            expect(isExpirationAnchor('Data di scadenza: 15/11/26')).toBe(true);
        });

        it("should return true for 'Scadenza prodotto'", () => {
            expect(isExpirationAnchor('Scadenza prodotto')).toBe(true);
        });

        it("should return true for 'Best Before 2026'", () => {
            expect(isExpirationAnchor('Best Before 2026')).toBe(true);
        });
    });

    describe('Negative', () => {
        it('should return false for empty string', () => {
            expect(isExpirationAnchor('')).toBe(false);
        });

        // @ts-expect-error — intentional null/undefined test
        it('should return false for null', () => {
            expect(isExpirationAnchor(null)).toBe(false);
        });

        // @ts-expect-error — intentional null/undefined test
        it('should return false for undefined', () => {
            expect(isExpirationAnchor(undefined)).toBe(false);
        });

        it("should return false for 'A' (less than 2 chars)", () => {
            expect(isExpirationAnchor('A')).toBe(false);
        });

        it("should return false for 'abc123'", () => {
            expect(isExpirationAnchor('abc123')).toBe(false);
        });

        it("should return false for 'LOTTO' (not an expiration anchor)", () => {
            expect(isExpirationAnchor('LOTTO')).toBe(false);
        });

        it("should return false for 'LOTE' (partial)", () => {
            expect(isExpirationAnchor('LOTE')).toBe(false);
        });

        it("should return false for 'DAT' (too short partial)", () => {
            expect(isExpirationAnchor('DAT')).toBe(false);
        });
    });

    describe('Case insensitivity', () => {
        it("should return true for lowercase 'scadenza'", () => {
            expect(isExpirationAnchor('scadenza')).toBe(true);
        });

        it("should return true for mixed case 'ScAdEnZa'", () => {
            expect(isExpirationAnchor('ScAdEnZa')).toBe(true);
        });

        it("should return true for lowercase 'expires'", () => {
            expect(isExpirationAnchor('expires')).toBe(true);
        });
    });
});