// validators.test.ts — tests for date validation utilities.
//
// exports: none
// used_by: none
// rules:   none

/**
 * Tests for dateUtils/validators module
 * @module dateUtils/__tests__/validators
 */

import { validateYear, createDateValidator, normalizeTwoDigitYear } from '../validators';
import { DATE_CONSTANTS } from '../constants';

// Mock LoggingService to avoid side effects in tests
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    debug: jest.fn(),
  },
}));

describe('validators', () => {
  const currentYear = new Date().getFullYear();

  // ─── validateYear ──────────────────────────────────────────────

  describe('validateYear', () => {
    it('should accept a year within the valid range', () => {
      const result = validateYear(currentYear);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept the minimum allowed year', () => {
      const result = validateYear(DATE_CONSTANTS.MIN_YEAR);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept the maximum allowed year (current + offset)', () => {
      const maxAllowed = currentYear + DATE_CONSTANTS.MAX_YEAR_OFFSET;
      const result = validateYear(maxAllowed);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject a year below MIN_YEAR', () => {
      const result = validateYear(DATE_CONSTANTS.MIN_YEAR - 1);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Year too old');
    });

    it('should reject a year above current + MAX_YEAR_OFFSET', () => {
      const tooFar = currentYear + DATE_CONSTANTS.MAX_YEAR_OFFSET + 1;
      const result = validateYear(tooFar);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Year too far in future');
    });

    it('should reject year 1990 as too old', () => {
      const result = validateYear(1990);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Year too old');
    });

    it('should reject year 2100 as too far in future', () => {
      const result = validateYear(2100);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Year too far in future');
    });
  });

  // ─── createDateValidator ──────────────────────────────────────

  describe('createDateValidator', () => {
    it('should create a validator that accepts years within custom range', () => {
      const validator = createDateValidator(2000, 30);
      const result = validator(currentYear);
      expect(result.valid).toBe(true);
    });

    it('should create a validator that rejects years below custom minYear', () => {
      const validator = createDateValidator(2000, 30);
      const result = validator(1999);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Year too old');
    });

    it('should create a validator that rejects years above custom maxYearOffset', () => {
      const validator = createDateValidator(2000, 30);
      const tooFar = currentYear + 31;
      const result = validator(tooFar);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Year too far in future');
    });

    it('should use default DATE_CONSTANTS when no arguments provided', () => {
      const validator = createDateValidator();
      // Should behave identically to validateYear
      const result = validator(currentYear);
      expect(result.valid).toBe(true);
    });

    it('should accept year at custom boundary (minYear exactly)', () => {
      const validator = createDateValidator(2015, 10);
      const result = validator(2015);
      expect(result.valid).toBe(true);
    });

    it('should accept year at custom boundary (current + maxYearOffset exactly)', () => {
      const validator = createDateValidator(2015, 10);
      const result = validator(currentYear + 10);
      expect(result.valid).toBe(true);
    });
  });

  // ─── normalizeTwoDigitYear ────────────────────────────────────

  describe('normalizeTwoDigitYear', () => {
    it('should convert 2-digit year 26 to 2026', () => {
      expect(normalizeTwoDigitYear(26)).toBe(2026);
    });

    it('should convert 2-digit year 0 to 2000', () => {
      expect(normalizeTwoDigitYear(0)).toBe(2000);
    });

    it('should convert 2-digit year 99 to 2099', () => {
      expect(normalizeTwoDigitYear(99)).toBe(2099);
    });

    it('should convert 2-digit year 1 to 2001', () => {
      expect(normalizeTwoDigitYear(1)).toBe(2001);
    });

    it('should return 4-digit year unchanged (e.g., 2024)', () => {
      expect(normalizeTwoDigitYear(2024)).toBe(2024);
    });

    it('should return negative year unchanged (out of 0-99 range)', () => {
      expect(normalizeTwoDigitYear(-1)).toBe(-1);
    });

    it('should return 3-digit year unchanged (out of 0-99 range)', () => {
      expect(normalizeTwoDigitYear(100)).toBe(100);
    });

    it('should return large year unchanged', () => {
      expect(normalizeTwoDigitYear(2050)).toBe(2050);
    });
  });
});
