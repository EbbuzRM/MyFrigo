/**
 * Date parser registry core class.
 * @module dateUtils/registry/core
 */

import type { DateParseResult, DateParser, ParserConfig } from '../constants';
import { createDateParser } from './factory';

/**
 * Registry for managing date parsers.
 * Automatically registers parsers and provides lookup capabilities.
 *
 * @example
 * ```typescript
 * const registry = new DateParserRegistry();
 * registry.register({ name: 'custom', parseFn: customParser });
 * const result = registry.parse('2024-01-01');
 * ```
 */
export class DateParserRegistry {
  private parsers: Map<string, DateParser> = new Map();

  /**
   * Register a parser with the registry.
   * @param config - Parser configuration
   * @returns The registered parser function
   */
  register(config: ParserConfig): DateParser {
    const parser = createDateParser(config.parseFn, config.validator);
    this.parsers.set(config.name, parser);
    return parser;
  }

  /** Get a parser by name. */
  get(name: string): DateParser | undefined {
    return this.parsers.get(name);
  }

  /**
   * Parse input using all registered parsers.
   * Returns the first successful result.
   */
  parse(input: string): DateParseResult {
    for (const [name, parser] of this.parsers) {
      const result = parser(input);
      if (result.success) return result;
    }
    return { success: false, date: null, formattedDate: null, error: 'Unable to parse date' };
  }

  /** Get all registered parser names. */
  getRegisteredParsers(): string[] {
    return Array.from(this.parsers.keys());
  }
}
