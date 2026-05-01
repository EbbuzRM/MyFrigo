/**
 * Tests for date parsing utilities
 * @module dateUtils/__tests__/dateParsing
 */

import { parseDateFromString } from '../parsers/standard';

describe('Date Parsing', () => {
  describe('Dot format (European style)', () => {
    it('should parse 17.03.2026 (dot format with 4-digit year)', () => {
      const result = parseDateFromString('17.03.2026');
      expect(result.success).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.formattedDate).toBe('2026-03-17');
    });

    it('should parse 01.12.2025 (dot format)', () => {
      const result = parseDateFromString('01.12.2025');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2025-12-01');
    });

    // Note: 2-digit year formats (e.g., 17.03.26) have known issues with date-fns
    // century interpretation and are not consistently supported
  });

  describe('Backslash format', () => {
    it('should parse 12\\02\\2026 (backslash format with 4-digit year)', () => {
      const input = String.raw`12\02\2026`;
      const result = parseDateFromString(input);
      console.log('12\\02\\2026 result:', result);
      expect(result.success).toBe(true);
      expect(result.date).not.toBeNull();
      expect(result.formattedDate).toBe('2026-02-12');
    });

    it('should parse 17\\03\\2026 (backslash format DD\\MM\\YYYY)', () => {
      const input = String.raw`17\03\2026`;
      const result = parseDateFromString(input);
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-17');
    });

    // Note: 2-digit year formats have known century interpretation issues with date-fns
    // Month-year only formats require specialized parsers not yet implemented
  });

  describe('Slash format (existing functionality)', () => {
    it('should parse 17/03/2026 (slash format)', () => {
      const result = parseDateFromString('17/03/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-03-17');
    });

    it('should parse 01/12/2025 (slash format)', () => {
      const result = parseDateFromString('01/12/2025');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2025-12-01');
    });
  });

  describe('Invalid dates', () => {
    it('should reject invalid date strings', () => {
      const result = parseDateFromString('invalid-date');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unable to parse date');
    });

    it('should reject empty strings', () => {
      const result = parseDateFromString('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input');
    });

    it('should reject dates outside valid year range', () => {
      const result = parseDateFromString('01/01/1990');
      expect(result.success).toBe(false);
    });
  });
});
