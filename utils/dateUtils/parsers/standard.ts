/**
 * Standard date parsing from various formats.
 * @module dateUtils/parsers/standard
 */

import { parse, isValid, getYear, format } from 'date-fns';
import { DATE_FORMATS, type DateParseResult } from '../constants';
import { validateYear, normalizeTwoDigitYear } from '../validators';

/**
 * Parse date from various standard formats using date-fns.
 * Iterates through all supported DATE_FORMATS.
 *
 * @param dateString - Date string to parse
 * @returns DateParseResult with parsed date or error
 */
export function parseDateFromString(dateString: string): DateParseResult {
  if (!dateString || typeof dateString !== 'string') {
    return { success: false, date: null, formattedDate: null, error: 'Invalid input' };
  }

  // Normalize backslashes to slashes for consistent parsing
  const trimmedInput = dateString.trim().replace(/\\/g, '/');

  // Prioritize DD.MM.YY format for dotted strings to avoid MM.DD.YY confusion
  // This is especially important for European dates (like "06 05 26" normalized to "06.05.26")
  if (trimmedInput.includes('.') && trimmedInput.split('.').length === 3) {
    const parts = trimmedInput.split('.');
    if (parts[2].length === 2 || parts[2].length === 4) {
      const formats = parts[2].length === 2 ? ['dd.MM.yy'] : ['dd.MM.yyyy'];
      for (const dateFormat of formats) {
        // We use a custom parser for dd.MM.yy because date-fns might default to MM.dd.yy
        if (dateFormat === 'dd.MM.yy') {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          let year = parseInt(parts[2], 10);
          year = normalizeTwoDigitYear(year);

          const validation = validateYear(year);
          if (validation.valid) {
            const parsedDate = new Date(year, month, day);
            if (isValid(parsedDate) && parsedDate.getDate() === day && parsedDate.getMonth() === month) {
              return {
                success: true,
                date: parsedDate,
                formattedDate: format(parsedDate, 'yyyy-MM-dd'),
              };
            }
          }
        } else {
          const parsedDate = parse(trimmedInput, dateFormat, new Date());
          if (isValid(parsedDate)) {
            const year = getYear(parsedDate);
            const validation = validateYear(year);
            if (validation.valid) {
              return {
                success: true,
                date: parsedDate,
                formattedDate: format(parsedDate, 'yyyy-MM-dd'),
              };
            }
          }
        }
      }
    }
  }

  for (const dateFormat of DATE_FORMATS) {
    const parsedDate = parse(trimmedInput, dateFormat, new Date());

    if (isValid(parsedDate)) {
      const year = getYear(parsedDate);
      const validation = validateYear(year);
      if (!validation.valid) continue;

      return {
        success: true,
        date: parsedDate,
        formattedDate: format(parsedDate, 'yyyy-MM-dd'),
      };
    }
  }

  return { success: false, date: null, formattedDate: null, error: 'Unable to parse date' };
}
