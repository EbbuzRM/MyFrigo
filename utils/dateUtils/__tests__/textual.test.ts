// textual.test.ts — tests for textual month date parsing.
//
// exports: none
// used_by: none
// rules:   none

/**
 * Tests for dateUtils/parsers/textual module
 * @module dateUtils/__tests__/textual
 */

import { parseTextualMonthDate } from '../parsers/textual';
import { MONTH_MAP } from '../constants';

// Mock LoggingService to avoid side effects in tests
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    debug: jest.fn(),
  },
}));

describe('parseTextualMonthDate', () => {
  // ─── Happy path: Italian abbreviated months ───────────────────

  describe('Italian abbreviated months', () => {
    it('should parse "15 GEN 2026" correctly', () => {
      const result = parseTextualMonthDate('15 GEN 2026');
      expect(result.success).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.formattedDate).toBe('2026-01-15');
    });

    it('should parse "28 FEB 2025" correctly', () => {
      const result = parseTextualMonthDate('28 FEB 2025');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2025-02-28');
    });

    it('should parse "31 DIC 2026" correctly', () => {
      const result = parseTextualMonthDate('31 DIC 2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-12-31');
    });

    it('should parse "01 LUG 2026" correctly', () => {
      const result = parseTextualMonthDate('01 LUG 2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-07-01');
    });
  });

  // ─── Happy path: Italian full months ──────────────────────────

  describe('Italian full month names', () => {
    it('should parse "15 GENNAIO 2026" correctly', () => {
      const result = parseTextualMonthDate('15 GENNAIO 2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-15');
    });

    it('should parse "10 SETTEMBRE 2025" correctly', () => {
      const result = parseTextualMonthDate('10 SETTEMBRE 2025');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2025-09-10');
    });
  });

  // ─── Happy path: English abbreviated months ────────────────────

  describe('English abbreviated months', () => {
    it('should parse "15 JAN 2026" correctly', () => {
      const result = parseTextualMonthDate('15 JAN 2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-15');
    });

    it('should parse "25 DEC 2026" correctly', () => {
      const result = parseTextualMonthDate('25 DEC 2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-12-25');
    });
  });

  // ─── Case insensitivity ──────────────────────────────────────

  describe('Case insensitivity', () => {
    it('should parse lowercase "15 gen 2026"', () => {
      const result = parseTextualMonthDate('15 gen 2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-15');
    });

    it('should parse mixed case "15 Gen 2026"', () => {
      const result = parseTextualMonthDate('15 Gen 2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-15');
    });
  });

  // ─── 2-digit year normalization ────────────────────────────────

  describe('2-digit year normalization', () => {
    it('should parse "15 GEN 26" as 2026-01-15', () => {
      const result = parseTextualMonthDate('15 GEN 26');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-15');
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle leading/trailing whitespace', () => {
      const result = parseTextualMonthDate('  15 GEN 2026  ');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-15');
    });

    it('should handle multiple spaces between parts', () => {
      const result = parseTextualMonthDate('15  GEN  2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-15');
    });
  });

  // ─── Invalid input ────────────────────────────────────────────

  describe('Invalid input', () => {
    it('should reject strings with wrong number of parts (2 parts)', () => {
      const result = parseTextualMonthDate('15 GEN');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid format');
      expect(result.date).toBeNull();
    });

    it('should reject strings with wrong number of parts (4 parts)', () => {
      const result = parseTextualMonthDate('15 GEN 2026 extra');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid format');
    });

    it('should reject unknown month abbreviation', () => {
      const result = parseTextualMonthDate('15 XYZ 2026');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown month');
    });

    it('should reject invalid day (0)', () => {
      const result = parseTextualMonthDate('0 GEN 2026');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid day');
    });

    it('should reject invalid day (32)', () => {
      const result = parseTextualMonthDate('32 GEN 2026');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid day');
    });

    it('should reject non-numeric day', () => {
      const result = parseTextualMonthDate('AB GEN 2026');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid day');
    });

    it('should reject impossible date (30 FEB)', () => {
      const result = parseTextualMonthDate('30 FEB 2026');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date');
    });

    it('should reject year outside valid range (too old)', () => {
      const result = parseTextualMonthDate('15 GEN 1990');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Year too old');
    });

    it('should reject year outside valid range (too far future)', () => {
      const currentYear = new Date().getFullYear();
      const farFuture = currentYear + 25;
      const result = parseTextualMonthDate(`15 GEN ${farFuture}`);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Year too far in future');
    });

    it('should return null date and formattedDate on failure', () => {
      const result = parseTextualMonthDate('invalid');
      expect(result.date).toBeNull();
      expect(result.formattedDate).toBeNull();
    });
  });

  // ─── Leap year handling ──────────────────────────────────────

  describe('Leap year handling', () => {
    it('should accept 29 FEB on leap year 2024', () => {
      const result = parseTextualMonthDate('29 FEB 2024');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2024-02-29');
    });

    it('should reject 29 FEB on non-leap year 2025', () => {
      const result = parseTextualMonthDate('29 FEB 2025');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date');
    });
  });
});
