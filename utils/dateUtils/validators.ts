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
 * Normalizes a 2-digit year to 4-digit year for food expiration dates.
 * All 2-digit years are interpreted as 2000s (26→2026, 99→2099).
 * This is appropriate for food expiration dates which are always in the future.
 *
 * @param year - The 2-digit year (0-99) or already 4-digit year
 * @returns The normalized 4-digit year in 2000s
 *
 * @example
 * ```typescript
 * normalizeTwoDigitYear(25); // Returns 2025
 * normalizeTwoDigitYear(99); // Returns 2099
 * normalizeTwoDigitYear(2024); // Returns 2024 (unchanged)
 * ```
 */
export function normalizeTwoDigitYear(year: number): number {
  if (year < 0 || year > 99) {
    return year; // Already 4-digit or invalid, return as-is
  }
  // For food expiration dates: all 2-digit years are in 2000s
  return year + 2000;
}
