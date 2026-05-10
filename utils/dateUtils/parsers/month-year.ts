// month-year.ts — month-year module.
//
// exports: parseMonthYearDate
// used_by: none
// rules:   - All date parsers in this module MUST return `DateParseResult` objects with consistent structure and the same success/error handling pattern
//          - Parser functions MUST use `validateYear()` and `normalizeTwoDigitYear()` for year validation before creating Date objects
//          - Date formats and outputs MUST remain compatible with `date-fns` formatting functions, particularly `yyyy-MM-dd`
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Month/year date parsing (e.g., "12/2024").
 * @module dateUtils/parsers/month-year
 */

import { isValid, format } from 'date-fns';
import { LoggingService } from '@/services/LoggingService';
import { type DateParseResult } from '../constants';
import { validateYear, normalizeTwoDigitYear } from '../validators';

const TAG = 'DateUtils';

/**
 * Parse month/year date. Returns the last day of the month.
 * @param dateString - Month/year string
 * @returns DateParseResult with parsed date or error
 */
export function parseMonthYearDate(dateString: string): DateParseResult {
  const cleaned = dateString.replace(/[/.-]/g, '/');
  const parts = cleaned.split('/');

  if (parts.length !== 2) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid format' };
  }

  const month = parseInt(parts[0], 10) - 1;
  let year = parseInt(parts[1], 10);

  if (month < 0 || month > 11) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid month' };
  }

  year = normalizeTwoDigitYear(year);
  const validation = validateYear(year);
  if (!validation.valid) {
    LoggingService.debug(TAG, `Month/year date rejected: ${validation.error}`);
    return { success: false, date: null, formattedDate: null, error: validation.error };
  }

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const parsedDate = new Date(year, month, lastDayOfMonth);

  if (!isValid(parsedDate)) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid date' };
  }

  return {
    success: true,
    date: parsedDate,
    formattedDate: format(parsedDate, 'yyyy-MM-dd'),
  };
}
