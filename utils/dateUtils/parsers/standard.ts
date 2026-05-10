// standard.ts — standard module.
//
// exports: parseDateFromString
// used_by: none
// rules:   - All date parsing functions must return `DateParseResult` objects with consistent `success`, `date`, `formattedDate`, and `error` properties
//          - Input normalization (backslash to slash, spacing cleanup) must occur before any format parsing
//          - Parsed dates must pass through `validateYear` before being returned as successful results
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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

  // Normalize backslashes to slashes for consistent parsing
  // Also remove extra spaces around separators (e.g., "12 / 05 / 2026" -> "12/05/2026")
  const trimmedInput = dateString.trim()
    .replace(/\\/g, '/')
    .replace(/\s*([/.-])\s*/g, '$1');

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
