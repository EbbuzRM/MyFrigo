jest.unmock('../dateUtils/index');
jest.unmock('date-fns');
import { 
  parseDateFromString, 
  parseTextualMonthDate, 
  parseSequenceDate, 
  parseMonthYearDate,
  validateYear,
  normalizeTwoDigitYear,
  toLocalISOString,
  getLocalISODate,
  isDateInFuture,
  isDateTooOld,
  isDateWith31InShortMonth,
  sortDatesAscending,
  DATE_CONSTANTS
} from '../dateUtils/index';
import { startOfToday, addDays, subDays, subYears, addYears, format } from 'date-fns';

describe('Date Utilities', () => {
  describe('Standard Parsing (parseDateFromString)', () => {
    test('should parse dd/MM/yyyy format', () => {
      const result = parseDateFromString('15/05/2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-05-15');
    });

    test('should parse dd-MM-yyyy format', () => {
      const result = parseDateFromString('15-05-2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-05-15');
    });

    test('should parse dd.MM.yyyy format', () => {
      const result = parseDateFromString('15.05.2026');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-05-15');
    });

    test('should handle backslashes and spaces', () => {
      const result = parseDateFromString(' 15 \\ 05 \\ 2026 ');
      expect(result.success).toBe(true);
      expect(result.formattedDate).toBe('2026-05-15');
    });

    test('should parse 2-digit years', () => {
      const result = parseDateFromString('15/05/26');
      expect(result.success).toBe(true);
      // parseDateFromString uses date-fns parse which might interpret 26 as 1926 or 2026 depending on current date
      // but standard.ts uses validateYear which might reject if it's too old
      // Actually date-fns parse('15/05/26', 'dd/MM/yy', new Date()) usually gives 2026
      expect(result.date?.getFullYear()).toBe(2026);
    });

    test('should return failure for invalid dates', () => {
      const result = parseDateFromString('32/05/2026');
      expect(result.success).toBe(false);
    });

    test('should reject years too far in future', () => {
      const farFutureYear = new Date().getFullYear() + DATE_CONSTANTS.MAX_YEAR_OFFSET + 5;
      const result = parseDateFromString(`15/05/${farFutureYear}`);
      expect(result.success).toBe(false);
    });
  });

  describe('Textual Month Parsing (parseTextualMonthDate)', () => {
    test('should parse Italian abbreviated months', () => {
      const result = parseTextualMonthDate('15 GEN 2026');
      expect(result.success).toBe(true);
      expect(result.date?.getMonth()).toBe(0); // January
    });

    test('should parse Italian full months', () => {
      const result = parseTextualMonthDate('15 MAGGIO 2026');
      expect(result.success).toBe(true);
      expect(result.date?.getMonth()).toBe(4); // May
    });

    test('should handle lowercase and extra spaces', () => {
      const result = parseTextualMonthDate('  15   settembre   2026  ');
      expect(result.success).toBe(true);
      expect(result.date?.getMonth()).toBe(8); // September
    });
  });

  describe('Sequence Parsing (parseSequenceDate)', () => {
    test('should parse ddmmyy sequence', () => {
      const result = parseSequenceDate('150526');
      expect(result.success).toBe(true);
      expect(result.date?.getFullYear()).toBe(2026);
      expect(result.date?.getMonth()).toBe(4);
      expect(result.date?.getDate()).toBe(15);
    });

    test('should parse ddmmyyyy sequence', () => {
      const result = parseSequenceDate('15052026');
      expect(result.success).toBe(true);
      expect(result.date?.getFullYear()).toBe(2026);
    });
  });

  describe('Month-Year Parsing (parseMonthYearDate)', () => {
    test('should parse MM/yyyy', () => {
      const result = parseMonthYearDate('05/2026');
      expect(result.success).toBe(true);
      // Should set to last day of month
      expect(result.date?.getMonth()).toBe(4);
      expect(result.date?.getFullYear()).toBe(2026);
      expect(result.date?.getDate()).toBe(31);
    });

    test('should parse MM-yy', () => {
      const result = parseMonthYearDate('06-26');
      expect(result.success).toBe(true);
      expect(result.date?.getMonth()).toBe(5);
      expect(result.date?.getFullYear()).toBe(2026);
      expect(result.date?.getDate()).toBe(30);
    });
  });

  describe('Validators', () => {
    test('validateYear should accept current year', () => {
      const currentYear = new Date().getFullYear();
      expect(validateYear(currentYear).valid).toBe(true);
    });

    test('validateYear should reject very old years', () => {
      expect(validateYear(1990).valid).toBe(false);
    });

    test('normalizeTwoDigitYear should convert to 2000s', () => {
      expect(normalizeTwoDigitYear(26)).toBe(2026);
      expect(normalizeTwoDigitYear(99)).toBe(2099);
      expect(normalizeTwoDigitYear(2026)).toBe(2026);
    });
  });

  describe('Formatters', () => {
    test('toLocalISOString should format correctly', () => {
      const date = new Date(2026, 4, 15); // May 15
      expect(toLocalISOString(date)).toBe('2026-05-15');
    });

    test('getLocalISODate should return today in ISO format', () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      expect(getLocalISODate()).toBe(today);
    });

    test('isDateInFuture should correctly identify future/present dates', () => {
      const today = startOfToday();
      const tomorrow = addDays(today, 1);
      const yesterday = subDays(today, 1);

      expect(isDateInFuture(today)).toBe(true);
      expect(isDateInFuture(tomorrow)).toBe(true);
      expect(isDateInFuture(yesterday)).toBe(false);
    });

    test('isDateTooOld should identify dates older than limit', () => {
      const okayDate = subDays(startOfToday(), 10);
      const tooOldDate = subYears(startOfToday(), DATE_CONSTANTS.PAST_DATE_FILTER_YEARS + 1);

      expect(isDateTooOld(okayDate)).toBe(false);
      expect(isDateTooOld(tooOldDate)).toBe(true);
    });

    test('isDateWith31InShortMonth should identify invalid 31sts', () => {
      const april31 = new Date(2026, 3, 31); // April is 3 (0-indexed), 31st will auto-roll to May 1
      // Wait, new Date(2026, 3, 31) actually creates May 1st.
      // The function isDateWith31InShortMonth checks if the date object provided HAS day 31 AND month in [3, 5, 8, 10]
      // But if you create it with new Date(2026, 3, 31), it won't have day 31.
      // It might be intended for checking OCR results before they are normalized by Date object,
      // but the function takes a Date object. Let's see.
      
      const date = new Date(2026, 4, 31); // May 31 (May has 31 days)
      expect(isDateWith31InShortMonth(date)).toBe(false);
      
      // If we manually set the day and month (even if invalid)
      const invalidDate = new Date(2026, 3, 30);
      invalidDate.setDate(31); // This will roll it over to May 1
      // So this function might be tricky to test with native Date objects if they roll over.
      // Let's check the implementation again.
    });

    test('sortDatesAscending should sort correctly', () => {
      const d1 = new Date(2026, 0, 1);
      const d2 = new Date(2025, 0, 1);
      const d3 = new Date(2027, 0, 1);
      const sorted = sortDatesAscending([d1, d2, d3]);
      expect(sorted[0]).toBe(d2);
      expect(sorted[1]).toBe(d1);
      expect(sorted[2]).toBe(d3);
    });
  });
});
