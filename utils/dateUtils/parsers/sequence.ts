/**
 * Sequence date parsing (e.g., "150124" or "15012024").
 * @module dateUtils/parsers/sequence
 */

import { isValid, format } from 'date-fns';
import { LoggingService } from '@/services/LoggingService';
import { type DateParseResult } from '../constants';
import { validateYear, normalizeTwoDigitYear } from '../validators';

const TAG = 'DateUtils';

/**
 * Parse date from numeric sequence (6 or 8 digits).
 * @param sequence - Numeric sequence representing date
 * @returns DateParseResult with parsed date or error
 */
export function parseSequenceDate(sequence: string): DateParseResult {
  if (!/^\d{6}$|^\d{8}$/.test(sequence)) {
    return { success: false, date: null, formattedDate: null, error: 'Invalid sequence format' };
  }

  let day: number, month: number, year: number;

  if (sequence.length === 8) {
    day = parseInt(sequence.substring(0, 2), 10);
    month = parseInt(sequence.substring(2, 4), 10) - 1;
    year = parseInt(sequence.substring(4, 8), 10);
  } else {
    day = parseInt(sequence.substring(0, 2), 10);
    month = parseInt(sequence.substring(2, 4), 10) - 1;
    year = parseInt(sequence.substring(4, 6), 10);
    year = normalizeTwoDigitYear(year);
  }

  const validation = validateYear(year);
  if (!validation.valid) {
    LoggingService.debug(TAG, `Sequence date rejected: ${validation.error}`);
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
