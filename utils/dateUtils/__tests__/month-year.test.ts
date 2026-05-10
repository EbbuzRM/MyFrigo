// month-year.test.ts — tests for month/year date parsing.
//
// exports: none
// used_by: none
// rules:   none

/**
 * Tests for dateUtils/parsers/month-year module
 * @module dateUtils/__tests__/month-year
 */

import { parseMonthYearDate } from '../parsers/month-year';

// Mock LoggingService to avoid side effects in tests
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    debug: jest.fn(),
  },
}));

describe('parseMonthYearDate', () => {
  // ─── Slash format (MM/yyyy) ───────────────────────────────────

  describe('Slash format', () => {
    it('should parse "03/2026" and return last day of March', () => {
      const result = parseMonthYearDate('03/2026');
      expect(result.success).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.formattedDate).toBe('2026-03-31');
    });

    it('should parse "01/2026" and return last day of January', () => {
      const result = parseMonthYearDate('01/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-31');
    });

    it('should parse "12/2025" and return last day of December', () => {
      const result = parseMonthYearDate('12/2025');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2025-12-31');
    });

    it('should parse "02/2026" and return last day of February (non-leap)', () => {
      const result = parseMonthYearDate('02/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-02-28');
    });
  });

  // ─── Dash format (MM-yyyy) ────────────────────────────────────

  describe('Dash format', () => {
    it('should parse "03-2026" and return last day of March', () => {
      const result = parseMonthYearDate('03-2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-31');
    });

    it('should parse "11-2025" and return last day of November', () => {
      const result = parseMonthYearDate('11-2025');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2025-11-30');
    });
  });

  // ─── Dot format (MM.yyyy) ────────────────────────────────────

  describe('Dot format', () => {
    it('should parse "03.2026" and return last day of March', () => {
      const result = parseMonthYearDate('03.2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-31');
    });
  });

  // ─── 2-digit year normalization ────────────────────────────────

  describe('2-digit year normalization', () => {
    it('should parse "03/26" and normalize to 2026-03-31', () => {
      const result = parseMonthYearDate('03/26');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-31');
    });

    it('should parse "12/25" and normalize to 2025-12-31', () => {
      const result = parseMonthYearDate('12/25');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2025-12-31');
    });
  });

  // ─── Leap year handling ──────────────────────────────────────

  describe('Leap year handling', () => {
    it('should return Feb 29 for "02/2024" (leap year)', () => {
      const result = parseMonthYearDate('02/2024');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2024-02-29');
    });

    it('should return Feb 28 for "02/2025" (non-leap year)', () => {
      const result = parseMonthYearDate('02/2025');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2025-02-28');
    });

    it('should return Feb 29 for "02/24" (2-digit leap year)', () => {
      const result = parseMonthYearDate('02/24');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2024-02-29');
    });
  });

  // ─── Last day of month correctness ────────────────────────────

  describe('Last day of month correctness', () => {
    it('should return Jan 31 for "01/2026"', () => {
      const result = parseMonthYearDate('01/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-01-31');
    });

    it('should return Apr 30 for "04/2026"', () => {
      const result = parseMonthYearDate('04/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-04-30');
    });

    it('should return May 31 for "05/2026"', () => {
      const result = parseMonthYearDate('05/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-05-31');
    });

    it('should return Jun 30 for "06/2026"', () => {
      const result = parseMonthYearDate('06/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-06-30');
    });

    it('should return Jul 31 for "07/2026"', () => {
      const result = parseMonthYearDate('07/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-07-31');
    });

    it('should return Aug 31 for "08/2026"', () => {
      const result = parseMonthYearDate('08/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-08-31');
    });

    it('should return Sep 30 for "09/2026"', () => {
      const result = parseMonthYearDate('09/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-09-30');
    });

    it('should return Oct 31 for "10/2026"', () => {
      const result = parseMonthYearDate('10/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-10-31');
    });

    it('should return Nov 30 for "11/2026"', () => {
      const result = parseMonthYearDate('11/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-11-30');
    });

    it('should return Dec 31 for "12/2026"', () => {
      const result = parseMonthYearDate('12/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-12-31');
    });
  });

  // ─── Invalid input ────────────────────────────────────────────

  describe('Invalid input', () => {
    it('should reject wrong format (3 parts)', () => {
      const result = parseMonthYearDate('03/15/2026');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid format');
    });

    it('should reject wrong format (1 part)', () => {
      const result = parseMonthYearDate('032026');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid format');
    });

    it('should reject month 0 (invalid)', () => {
      const result = parseMonthYearDate('00/2026');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid month');
    });

    it('should reject month 13 (invalid)', () => {
      const result = parseMonthYearDate('13/2026');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid month');
    });

    it('should reject year below MIN_YEAR (e.g., 1990)', () => {
      const result = parseMonthYearDate('01/1990');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Year too old');
    });

    it('should reject year too far in future', () => {
      const currentYear = new Date().getFullYear();
      const farFuture = currentYear + 25;
      const result = parseMonthYearDate(`01/${farFuture}`);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Year too far in future');
    });

    it('should return null date and formattedDate on failure', () => {
      const result = parseMonthYearDate('invalid');
      expect(result.date).toBeNull();
      expect(result.formattedDate).toBeNull();
    });
  });

  // ─── Separator normalization ──────────────────────────────────

  describe('Separator normalization', () => {
    it('should normalize dot to slash: "03.2026"', () => {
      const result = parseMonthYearDate('03.2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-31');
    });

    it('should normalize dash to slash: "03-2026"', () => {
      const result = parseMonthYearDate('03-2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-31');
    });

    it('should normalize mixed separator: "03/2026" (already slash)', () => {
      const result = parseMonthYearDate('03/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-31');
    });
  });
});
