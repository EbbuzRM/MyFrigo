/**
 * Textual month date parsing.
 * @module dateUtils/parsers/textual
 */

import { isValid, format } from 'date-fns';
import { LoggingService } from '@/services/LoggingService';
import { MONTH_MAP, type DateParseResult } from '../constants';
import { validateYear, normalizeTwoDigitYear } from '../validators';

const TAG = 'DateUtils';

/**
 * Parse date with textual month names (e.g., "15 GEN 2024").
 * @param dateString - Date string with textual month
 * @returns DateParseResult with parsed date or error
 */
export function parseTextualMonthDate(dateString: string): DateParseResult {
  const parts = dateString.toUpperCase().trim().split(/\s+/);
  if (parts.length !== 3) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid format' };
  }

  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  let year = parseInt(parts[2], 10);

  const month = MONTH_MAP[monthStr];
  if (month === undefined) {
    return { success: false, date: null, formattedDate: null, error: 'Unknown month' };
  }

  if (isNaN(day) || day < 1 || day > 31) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid day' };
  }

  year = normalizeTwoDigitYear(year);
  const validation = validateYear(year);
  if (!validation.valid) {
    LoggingService.debug(TAG, `Textual date rejected: ${validation.error}`);
    return { success: false, date: null, formattedDate: null, error: validation.error };
  }

  const parsedDate = new Date(year, month, day);
  if (!isValid(parsedDate) || parsedDate.getDate() !== day || parsedDate.getMonth() !== month) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid date' };
  }

  return {
    success: true,
    date: parsedDate,
    formattedDate: format(parsedDate, 'yyyy-MM-dd'),
  };
}
