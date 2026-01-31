/**
 * Registry module - Barrel export.
 * @module dateUtils/registry
 */

export { DateParserRegistry } from './core';
export { createDateParser } from './factory';

import { DateParserRegistry } from './core';

/** Global registry instance for shared use. */
export const globalParserRegistry = new DateParserRegistry();
