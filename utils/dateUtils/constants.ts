/**
 * Date constants used across the date utilities module.
 * @module dateUtils/constants
 */

/**
 * Core date configuration constants
 */
export const DATE_CONSTANTS = {
  MIN_YEAR: 2020,
  MAX_YEAR_OFFSET: 20,
  TIMEOUT_MS: 15000,
  MIN_CONFIDENCE: 0.9,
  PAST_DATE_FILTER_YEARS: 1,
} as const;

/**
 * Standard date format strings for parsing
 */
export const DATE_FORMATS = [
  'dd/MM/yyyy',
  'dd-MM-yyyy',
  'dd.MM.yyyy',
  'dd MM yyyy',
  'dd/MM/yy',
  'dd-MM-yy',
  'dd.MM.yy',
  'dd MM yy',
  'MM/yyyy',
  'MM-yyyy',
  'MM.yyyy',
  'MM/yy',
  'MM-yy',
  'MM.yy',
] as const;

/**
 * Month name mappings (Italian and English)
 */
export const MONTH_MAP: Record<string, number> = {
  GEN: 0, FEB: 1, MAR: 2, APR: 3, MAG: 4, GIU: 5,
  LUG: 6, AGO: 7, SET: 8, OTT: 9, NOV: 10, DIC: 11,
  JAN: 0, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, DEC: 11
} as const;

/**
 * Result type for date parsing operations
 */
export interface DateParseResult {
  success: boolean;
  date: Date | null;
  formattedDate: string | null;
  error?: string;
}

/**
 * Function signature for date parsers
 */
export type DateParser = (input: string) => DateParseResult;

/**
 * Function signature for date validators
 */
export type DateValidator = (year: number) => { valid: boolean; error?: string };

/**
 * Configuration for creating a date parser
 */
export interface ParserConfig {
  name: string;
  parseFn: (input: string) => Date | null;
  validator?: DateValidator;
}
