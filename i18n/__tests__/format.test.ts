import { formatDisplayDate, formatDisplayNumber } from '../format';

describe('localized display formats', () => {
  it('keeps date-only values on the same calendar day', () => {
    expect(formatDisplayDate('2026-12-25', 'it')).toBe('25/12/2026');
    expect(formatDisplayDate('2026-12-25', 'en')).toBe('25/12/2026');
  });

  it('uses localized month names and rejects invalid dates', () => {
    expect(formatDisplayDate('2026-12-25', 'it', 'd MMMM yyyy')).toBe('25 dicembre 2026');
    expect(formatDisplayDate('2026-12-25', 'en', 'd MMMM yyyy')).toBe('25 December 2026');
    expect(formatDisplayDate('not-a-date', 'en')).toBeNull();
  });

  it('formats metric quantities using the selected locale', () => {
    expect(formatDisplayNumber(1.5, 'it')).toBe('1,5');
    expect(formatDisplayNumber(1.5, 'en')).toBe('1.5');
  });
});
