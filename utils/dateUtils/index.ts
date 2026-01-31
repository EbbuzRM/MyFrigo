/**
 * Date utility functions - Barrel export.
 * @module dateUtils
 *
 * This module provides comprehensive date parsing, validation, and formatting utilities.
 * The implementation has been refactored from a single monolithic file (247 lines)
 * into focused modules for better maintainability.
 *
 * @example
 * ```typescript
 * import {
 *   parseDateFromString,
 *   validateYear,
 *   toLocalISOString,
 *   DATE_CONSTANTS
 * } from '@/utils/dateUtils';
 *
 * const result = parseDateFromString('15/01/2024');
 * if (result.success) {
 *   console.log(toLocalISOString(result.date!));
 * }
 * ```
 */

// Re-export constants and types
export {
  DATE_CONSTANTS,
  DATE_FORMATS,
  MONTH_MAP,
  type DateParseResult,
  type DateParser,
  type DateValidator,
  type ParserConfig,
} from './constants';

// Re-export validators
export {
  validateYear,
  createDateValidator,
  normalizeTwoDigitYear,
} from './validators';

// Re-export parsers
export {
  parseDateFromString,
  parseTextualMonthDate,
  parseSequenceDate,
  parseMonthYearDate,
} from './parsers';

// Re-export registry parsers
export {
  parseWithRegistry,
  parserRegistry,
} from './registry-parsers';

// Re-export registry utilities
export {
  DateParserRegistry,
  createDateParser,
  globalParserRegistry,
} from './registry/index';

// Re-export formatters
export {
  isDateInFuture,
  isDateTooOld,
  toLocalISOString,
  isDateWith31InShortMonth,
  sortDatesAscending,
} from './formatters';
