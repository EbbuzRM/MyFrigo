/**
 * Date validation utilities.
 * @module dateUtils/validators
 */

import { getYear } from 'date-fns';
import { LoggingService } from '@/services/LoggingService';
import { DATE_CONSTANTS, type DateValidator } from './constants';

const TAG = 'DateUtils';

/**
 * Validates a year value against configured constraints.
 * Checks if year is within acceptable range (MIN_YEAR to current + MAX_YEAR_OFFSET).
 *
 * @param year - The year value to validate
 * @returns Object containing valid flag and optional error message
 *
 * @example
 * ```typescript
 * const result = validateYear(2024);
 * if (result.valid) {
 *   console.log('Year is valid');
 * } else {
 *   console.log('Error:', result.error);
 * }
 * ```
 */
export function validateYear(year: number): { valid: boolean; error?: string } {
  const currentYear = getYear(new Date());
  const maxAllowedYear = currentYear + DATE_CONSTANTS.MAX_YEAR_OFFSET;

  if (year < DATE_CONSTANTS.MIN_YEAR) {
    LoggingService.debug(TAG, `Date rejected: year ${year} is before ${DATE_CONSTANTS.MIN_YEAR}`);
    return { valid: false, error: 'Year too old' };
  }

  if (year > maxAllowedYear) {
    return { valid: false, error: 'Year too far in future' };
  }

  return { valid: true };
}

/**
 * Creates a standardized date validator with custom constraints.
 *
 * @param minYear - Minimum allowed year
 * @param maxYearOffset - Maximum year offset from current year
 * @returns DateValidator function
 *
 * @example
 * ```typescript
 * const customValidator = createDateValidator(2000, 30);
 * const result = customValidator(2024);
 * ```
 */
export function createDateValidator(
  minYear: number = DATE_CONSTANTS.MIN_YEAR,
  maxYearOffset: number = DATE_CONSTANTS.MAX_YEAR_OFFSET
): DateValidator {
  return (year: number): { valid: boolean; error?: string } => {
    const currentYear = getYear(new Date());
    const maxAllowedYear = currentYear + maxYearOffset;

    if (year < minYear) {
      LoggingService.debug(TAG, `Date rejected: year ${year} is before ${minYear}`);
      return { valid: false, error: 'Year too old' };
    }

    if (year > maxAllowedYear) {
      return { valid: false, error: 'Year too far in future' };
    }

    return { valid: true };
  };
}

/**
 * Validates that a year is a 2-digit year and normalizes it.
 * Applies 2000/1900 century logic based on year value.
 *
 * @param year - The 2-digit year (0-99)
 * @returns The normalized 4-digit year
 *
 * @example
 * ```typescript
 * normalizeTwoDigitYear(25); // Returns 2025
 * normalizeTwoDigitYear(80); // Returns 1980
 * ```
 */
export function normalizeTwoDigitYear(year: number): number {
  if (year < 0 || year > 99) {
    return year;
  }
  return year < 50 ? year + 2000 : year + 1900;
}
