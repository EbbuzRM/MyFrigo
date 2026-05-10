// sequence.test.ts — tests for sequence date parsing.
//
// exports: none
// used_by: none
// rules:   none

/**
 * Tests for dateUtils/parsers/sequence module
 * @module dateUtils/__tests__/sequence
 */

import { parseSequenceDate } from '../parsers/sequence';

// Mock LoggingService to avoid side effects in tests
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    debug: jest.fn(),
  },
}));

describe('parseSequenceDate', () => {
  // ─── 8-digit sequences (DDMMYYYY) ─────────────────────────────

  describe('8-digit sequences', () => {
    it('should parse "17032026" as 2026-03-17', () => {
      const result = parseSequenceDate('17032026');
      expect(result.success).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.formattedDate).toBe('2026-03-17');
    });

    it('should parse "01122025" as 2025-12-01', () => {
      const result = parseSequenceDate('01122025');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2025-12-01');
    });

    it('should parse "31012026" as 2026-01-31', () => {
      const result = parseSequenceDate('31012026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-31');
    });

    it('should parse "01012026" as 2026-01-01 (first day of year)', () => {
      const result = parseSequenceDate('01012026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-01');
    });
  });

  // ─── 6-digit sequences (DDMMYY) ──────────────────────────────

  describe('6-digit sequences', () => {
    it('should parse "170326" as 2026-03-17', () => {
      const result = parseSequenceDate('170326');
      expect(result.success).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.formattedDate).toBe('2026-03-17');
    });

    it('should parse "011225" as 2025-12-01', () => {
      const result = parseSequenceDate('011225');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2025-12-01');
    });

    it('should parse "010126" as 2026-01-01', () => {
      const result = parseSequenceDate('010126');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-01');
    });

    it('should normalize 2-digit year 99 to 2099 (rejected by validateYear as too far future)', () => {
      const result = parseSequenceDate('010199');
      // 2099 is beyond currentYear + MAX_YEAR_OFFSET, so it gets rejected
      expect(result.success).toBe(false);
      expect(result.error).toBe('Year too far in future');
    });

    it('should normalize 2-digit year 26 to 2026', () => {
      const result = parseSequenceDate('010126');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-01');
    });
  });

  // ─── Sequences with separators (normalization) ────────────────

  describe('Separator normalization', () => {
    it('should strip dots: "17.03.26" → "170326"', () => {
      const result = parseSequenceDate('17.03.26');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-17');
    });

    it('should strip slashes: "17/03/26" → "170326"', () => {
      const result = parseSequenceDate('17/03/26');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-17');
    });

    it('should strip spaces: "17 03 26" → "170326"', () => {
      const result = parseSequenceDate('17 03 26');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-17');
    });

    it('should strip backslashes: "17\\03\\26" → "170326"', () => {
      const result = parseSequenceDate('17\\03\\26');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-17');
    });

    it('should strip dashes: "17-03-26" → "170326"', () => {
      const result = parseSequenceDate('17-03-26');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-17');
    });

    it('should strip mixed separators from 8-digit: "17.03.2026" → "17032026"', () => {
      const result = parseSequenceDate('17.03.2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-17');
    });

    it('should strip separators from "11.09.26" → "110926"', () => {
      const result = parseSequenceDate('11.09.26');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-09-11');
    });
  });

  // ─── Invalid sequences ────────────────────────────────────────

  describe('Invalid input', () => {
    it('should reject non-numeric characters after normalization', () => {
      const result = parseSequenceDate('17A0326');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid sequence format');
    });

    it('should reject empty string', () => {
      const result = parseSequenceDate('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid sequence format');
    });

    it('should reject 4-digit sequence (too short)', () => {
      const result = parseSequenceDate('1703');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid sequence format');
    });

    it('should reject 10-digit sequence (too long)', () => {
      const result = parseSequenceDate('1703202600');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid sequence format');
    });

    it('should reject impossible date (30 Feb)', () => {
      const result = parseSequenceDate('300226');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date');
    });

    it('should reject impossible date (31 Apr)', () => {
      const result = parseSequenceDate('310426');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date');
    });

    it('should reject year below MIN_YEAR in 8-digit format', () => {
      const result = parseSequenceDate('01011990');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Year too old');
    });

    it('should reject year too far in future in 8-digit format', () => {
      const result = parseSequenceDate('01012100');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Year too far in future');
    });

    it('should return null date and formattedDate on failure', () => {
      const result = parseSequenceDate('invalid');
      expect(result.date).toBeNull();
      expect(result.formattedDate).toBeNull();
    });
  });

  // ─── Leap year handling ──────────────────────────────────────

  describe('Leap year handling', () => {
    it('should accept 29 Feb on leap year 2024 (8-digit)', () => {
      const result = parseSequenceDate('29022024');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2024-02-29');
    });

    it('should reject 29 Feb on non-leap year 2025 (8-digit)', () => {
      const result = parseSequenceDate('29022025');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date');
    });

    it('should accept 29 Feb on leap year via 6-digit "290224"', () => {
      const result = parseSequenceDate('290224');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2024-02-29');
    });

    it('should reject 29 Feb on non-leap year via 6-digit "290225"', () => {
      const result = parseSequenceDate('290225');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date');
    });
  });

  // ─── Month boundary validation ────────────────────────────────

  describe('Month boundary validation', () => {
    it('should accept 31 Jan (31-day month)', () => {
      const result = parseSequenceDate('310126');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-31');
    });

    it('should accept 30 Nov (30-day month)', () => {
      const result = parseSequenceDate('301126');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-11-30');
    });

    it('should reject 31 Nov (30-day month)', () => {
      const result = parseSequenceDate('311126');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date');
    });

    it('should reject month 13 (invalid month)', () => {
      const result = parseSequenceDate('011326');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date');
    });

    it('should reject month 00 (invalid month)', () => {
      const result = parseSequenceDate('010026');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date');
    });
  });
});
