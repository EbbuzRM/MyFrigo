// index.ts — index module.
//
// exports: DATE_CONSTANTS | DATE_FORMATS | MONTH_MAP | DateParseResult | DateParser | DateValidator | ParserConfig | validateYear | createDateValidator | normalizeTwoDigitYear | parseDateFromString | parseTextualMonthDate | parseSequenceDate | parseMonthYearDate | isDateInFuture | isDateTooOld | toLocalISOString | getLocalISODate | isDateWith31InShortMonth | sortDatesAscending
// used_by: none
// rules:   - Maintain the barrel export pattern: all public APIs must be re-exported from `index.ts` only, with no direct exports from submodules
//          - All date parsing functions must return `DateParseResult` objects (with `success`, `date`, and `error` properties) rather than throwing exceptions or returning null
//          - Locale-aware formatting and date input parsing must be handled at the application layer, not within this utility module
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Date utility functions - Barrel export.
 * @module dateUtils
 *
 * This module provides comprehensive date parsing, validation, and formatting utilities.
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

// Re-export formatters
export {
  isDateInFuture,
  isDateTooOld,
  toLocalISOString,
  getLocalISODate,
  isDateWith31InShortMonth,
  sortDatesAscending,
} from './formatters';

