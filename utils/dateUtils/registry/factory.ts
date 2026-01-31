/**
 * Date parser factory function.
 * @module dateUtils/registry/factory
 */

import { format } from 'date-fns';
import type { DateParseResult, DateParser, DateValidator } from '../constants';

/**
 * Factory for creating standardized date parsers.
 * Wraps parse function with validation and result formatting.
 *
 * @param parseFn - Function that attempts to parse string into Date
 * @param validator - Optional year validator
 * @returns Standardized DateParser function
 */
export function createDateParser(
  parseFn: (input: string) => Date | null,
  validator?: DateValidator
): DateParser {
  return (input: string): DateParseResult => {
    if (!input || typeof input !== 'string') {
      return { success: false, date: null, formattedDate: null, error: 'Invalid input' };
    }

    try {
      const parsedDate = parseFn(input.trim());

      if (!parsedDate || isNaN(parsedDate.getTime())) {
        return { success: false, date: null, formattedDate: null, error: 'Invalid date' };
      }

      if (validator) {
        const yearValidation = validator(parsedDate.getFullYear());
        if (!yearValidation.valid) {
          return {
            success: false,
            date: null,
            formattedDate: null,
            error: yearValidation.error
          };
        }
      }

      return {
        success: true,
        date: parsedDate,
        formattedDate: format(parsedDate, 'yyyy-MM-dd'),
      };
    } catch (error) {
      return { success: false, date: null, formattedDate: null, error: 'Parse error' };
    }
  };
}
