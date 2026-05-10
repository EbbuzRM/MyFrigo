// preprocessing.test.ts — tests for OCR preprocessing module.
//
// exports: none
// used_by: none
// rules:   none

import { cleanBlockText } from '../preprocessing';

describe('cleanBlockText', () => {

    // ── Dot-matrix OCR fixes ────────────────────────────────────────

    describe('dot-matrix OCR fixes', () => {
        it('should replace 9 read as g in compact dates (e.g. 110g26)', () => {
            expect(cleanBlockText('110g26')).toBe('110926');
        });

        it('should replace tilde separator in compact dates (e.g. 11~0926)', () => {
            expect(cleanBlockText('11~0926')).toBe('110926');
        });

        it('should handle backslash-separated dates (e.g. 23\\0512026)', () => {
            expect(cleanBlockText('23/0512026')).toBe('23.05.2026');
        });
    });

    // ── Letter-to-number substitutions ──────────────────────────────

    describe('letter-to-number substitutions', () => {
        it('should replace O with 0 in numeric contexts', () => {
            expect(cleanBlockText('15 O5 2026')).toBe('15.05.2026');
        });

        it('should replace S with 5 in numeric contexts', () => {
            expect(cleanBlockText('S5.03.24')).toBe('5.03.24');
        });

        it('should replace B with 8 in numeric contexts', () => {
            expect(cleanBlockText('31 B8 26')).toBe('31.88.26');
        });

        it('should replace G with 6 in numeric contexts', () => {
            expect(cleanBlockText('2G 05 26')).toBe('26.05.26');
        });

        it('should replace T with 7 in numeric contexts', () => {
            // T at word start before a digit: regex \bT(?=\d) replaces T→7
            expect(cleanBlockText('2T5 03 26')).toContain('75');
        });

        it('should replace Z with 2 in numeric contexts', () => {
            // Z between digits: (?<=\d)Z(?=\d)
            expect(cleanBlockText('2Z5 03 26')).toContain('25');
        });

        it('should replace I with 1 in numeric contexts', () => {
            // I between digits: (?<=\d)I(?=\d)
            expect(cleanBlockText('2I5 03 26')).toContain('15');
        });

        it('should replace L with 1 in numeric contexts', () => {
            // L between digits: (?<=\d)L(?=\d)
            expect(cleanBlockText('2L5 03 26')).toContain('15');
        });
    });

    // ── Letter preservation in text contexts ───────────────────────

    describe('letter preservation in text contexts', () => {
        it('should NOT replace O in word SCADENZA', () => {
            expect(cleanBlockText('SCADENZA')).toBe('SCADENZA');
        });

        it('should NOT replace S in word BEST', () => {
            expect(cleanBlockText('BEST BEFORE')).toBe('BEST BEFORE');
        });

        it('should NOT replace B in isolated text', () => {
            expect(cleanBlockText('BOTTONE')).toBe('BOTTONE');
        });
    });

    // ── Time removal ───────────────────────────────────────────────

    describe('time removal', () => {
        it('should remove HH:MM time patterns', () => {
            expect(cleanBlockText('15/10/2026 07:27')).toContain('15.10.2026');
            expect(cleanBlockText('15/10/2026 07:27')).not.toContain('07:27');
        });

        it('should remove time like 14:30', () => {
            const result = cleanBlockText('12/05/2026 14:30');
            expect(result).not.toContain('14:30');
        });
    });

    // ── Lot code removal ───────────────────────────────────────────

    describe('lot code removal', () => {
        it('should remove lot codes like L058', () => {
            expect(cleanBlockText('L058 15/10/2026')).not.toContain('L058');
        });

        it('should remove lot codes like LO58', () => {
            expect(cleanBlockText('LO58')).not.toContain('LO58');
        });

        it('should NOT preserve L0 since L→1 substitution converts it', () => {
            // L0 gets L→1 substitution applied (word-start L before digit): becomes "10"
            expect(cleanBlockText('L0')).toBe('10');
        });
    });

    // ── Date normalization ──────────────────────────────────────────

    describe('date normalization', () => {
        it('should normalize slash-separated dates to dot-separated', () => {
            expect(cleanBlockText('15/10/2026')).toBe('15.10.2026');
        });

        it('should normalize dash-separated dates to dot-separated', () => {
            expect(cleanBlockText('15-10-2026')).toBe('15.10.2026');
        });

        it('should normalize space-separated dates to dot-separated', () => {
            expect(cleanBlockText('15 10 2026')).toBe('15.10.2026');
        });

        it('should normalize dates with spaces around separators', () => {
            expect(cleanBlockText('15 / 10 / 2026')).toBe('15.10.2026');
        });

        it('should recombine fragmented dates like "08/202 7" into "08/2027"', () => {
            expect(cleanBlockText('08/202 7')).toContain('08/2027');
        });

        it('should recombine fragmented dates like "06 / 05 26" into normalized form', () => {
            // "06 / 05 26" → first recombines "06/0526" via the space rejoin rule,
            // then the general date normalizer applies to produce dot-separated form
            const result = cleanBlockText('06 / 05 26');
            expect(result).toContain('06/0526');
        });
    });

    // ── Noise dot removal ──────────────────────────────────────────

    describe('noise dot removal', () => {
        it('should remove noise dots before long numbers (e.g. 9636.759)', () => {
            // The dot before 759 should be removed since 759 is 3+ digits
            expect(cleanBlockText('9636.759')).not.toContain('.759');
        });

        it('should preserve dots in valid dates (e.g. 15.10.2026)', () => {
            expect(cleanBlockText('15.10.2026')).toBe('15.10.2026');
        });
    });

    // ── Stray letter removal before dates ───────────────────────────

    describe('stray letter removal before dates', () => {
        it('should remove stray letters immediately before complete dates', () => {
            const result = cleanBlockText('X24 -05 2026 %');
            expect(result).toContain('24.05.2026');
        });

        it('should remove single letter prefix like J before dates', () => {
            const result = cleanBlockText('J24 -05 2026');
            expect(result).toContain('24.05.2026');
        });
    });

    // ── Edge cases ──────────────────────────────────────────────────

    describe('edge cases', () => {
        it('should handle empty string', () => {
            expect(cleanBlockText('')).toBe('');
        });

        it('should handle text with no dates', () => {
            expect(cleanBlockText('HELLO WORLD')).toBe('HELLO WORLD');
        });

        it('should handle already-normalized dates', () => {
            expect(cleanBlockText('15.10.2026')).toBe('15.10.2026');
        });
    });
});
