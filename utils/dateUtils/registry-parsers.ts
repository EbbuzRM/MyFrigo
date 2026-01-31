/**
 * Registry-based date parser implementations.
 * @module dateUtils/registry-parsers
 */

import { parse, isValid } from 'date-fns';
import { DATE_FORMATS, MONTH_MAP } from './constants';
import { validateYear, normalizeTwoDigitYear } from './validators';
import { createDateParser, DateParserRegistry } from './registry';

/**
 * Auto-initialized registry with all built-in parsers.
 * New formats can be added without modifying iteration logic.
 */
export const parserRegistry = new DateParserRegistry();

// Register standard format parsers (uses date-fns)
parserRegistry.register({
  name: 'standard',
  parseFn: (input) => {
    for (const fmt of DATE_FORMATS) {
      const parsed = parse(input, fmt, new Date());
      if (isValid(parsed)) return parsed;
    }
    return null;
  },
  validator: validateYear
});

// Register textual month parsers (e.g., "15 GEN 2024")
parserRegistry.register({
  name: 'textualMonth',
  parseFn: (input) => {
    const parts = input.toUpperCase().trim().split(/\s+/);
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = MONTH_MAP[parts[1]];
    let year = parseInt(parts[2], 10);
    if (month === undefined || isNaN(day)) return null;
    year = normalizeTwoDigitYear(year);
    const parsed = new Date(year, month, day);
    return isValid(parsed) && parsed.getDate() === day ? parsed : null;
  },
  validator: validateYear
});

// Register sequence parsers (e.g., "150124" or "15012024")
parserRegistry.register({
  name: 'sequence',
  parseFn: (input) => {
    if (!/^\d{6}$|^\d{8}$/.test(input)) return null;
    const day = parseInt(input.substring(0, 2), 10);
    const month = parseInt(input.substring(2, 4), 10) - 1;
    let year = parseInt(input.substring(4, input.length), 10);
    if (input.length === 6) year = normalizeTwoDigitYear(year);
    const parsed = new Date(year, month, day);
    return isValid(parsed) && parsed.getDate() === day ? parsed : null;
  },
  validator: validateYear
});

// Register month/year parsers (returns last day of month)
parserRegistry.register({
  name: 'monthYear',
  parseFn: (input) => {
    const cleaned = input.replace(/[/.-]/g, '/');
    const parts = cleaned.split('/');
    if (parts.length !== 2) return null;
    const month = parseInt(parts[0], 10) - 1;
    let year = parseInt(parts[1], 10);
    year = normalizeTwoDigitYear(year);
    const lastDay = new Date(year, month + 1, 0).getDate();
    const parsed = new Date(year, month, lastDay);
    return isValid(parsed) ? parsed : null;
  },
  validator: validateYear
});

/**
 * Parse date using the registry (tries all registered parsers).
 * Returns the first successful result.
 *
 * @param input - Date string to parse
 * @returns DateParseResult from the first successful parser
 */
export function parseWithRegistry(input: string) {
  return parserRegistry.parse(input);
}
