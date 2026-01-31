/**
 * Constants for quantity-related functionality
 * @module constants/quantities
 */

/**
 * Interface for unit option
 */
export interface UnitOption {
  /** Unit identifier */
  id: string;
  /** Human-readable unit name with description */
  name: string;
}

/**
 * Common measurement units used throughout the application
 * Includes standard metric units and packaging types
 */
export const COMMON_UNITS: UnitOption[] = [
  { id: 'pz', name: 'pz (pezzi)' },
  { id: 'kg', name: 'kg (chilogrammi)' },
  { id: 'g', name: 'g (grammi)' },
  { id: 'L', name: 'L (litri)' },
  { id: 'ml', name: 'ml (millilitri)' },
  { id: 'conf', name: 'conf. (confezione)' },
  { id: 'barattolo', name: 'barattolo' },
  { id: 'bottiglia', name: 'bottiglia' },
  { id: 'vasetto', name: 'vasetto' },
];

/**
 * Default quantity value
 */
export const DEFAULT_QUANTITY = '1';

/**
 * Default unit value
 */
export const DEFAULT_UNIT = 'pz';

/**
 * Minimum allowed quantity value
 */
export const MIN_QUANTITY = 0;

/**
 * Maximum allowed quantity value (reasonable upper limit)
 */
export const MAX_QUANTITY = 9999;

/**
 * Increment/decrement step size
 */
export const QUANTITY_STEP = 1;
