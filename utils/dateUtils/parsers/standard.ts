/**
 * Standard date parsing from various formats.
 * @module dateUtils/parsers/standard
 */

import { parse, isValid, getYear, format } from 'date-fns';
import { DATE_FORMATS, type DateParseResult } from '../constants';
import { validateYear } from '../validators';

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

  const trimmedInput = dateString.trim();

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
