/**
 * @fileoverview Error code enum with 18 standardized error codes.
 * Categorized by error type for easy maintenance and filtering.
 */

/**
 * Categories of errors in the application
 */
export type ErrorCategory =
  | 'AUTH'
  | 'VALIDATION'
  | 'DATABASE'
  | 'SYSTEM'
  | 'AUTHORIZATION'
  | 'CONFIGURATION';

/**
 * Standardized error codes for the application.
 * All codes follow CATEGORY_SPECIFIC pattern for consistency.
 */
export enum ErrorCode {
  // Auth errors (AUTH_*)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation errors (VALIDATION_*)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',

  // Database errors (DB_*)
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // System errors (SYSTEM_*)
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // Authorization errors (FORBIDDEN_*)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Configuration errors (CONFIG_*)
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  MISSING_ENVIRONMENT_VARIABLE = 'MISSING_ENVIRONMENT_VARIABLE',
}

/**
 * Maps error codes to their categories for filtering and organization
 */
export const ERROR_CATEGORIES: Record<ErrorCode, ErrorCategory> = {
  // Auth
  [ErrorCode.UNAUTHORIZED]: 'AUTH',
  [ErrorCode.INVALID_CREDENTIALS]: 'AUTH',
  [ErrorCode.EMAIL_NOT_CONFIRMED]: 'AUTH',
  [ErrorCode.SESSION_EXPIRED]: 'AUTH',

  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'VALIDATION',
  [ErrorCode.INVALID_EMAIL_FORMAT]: 'VALIDATION',
  [ErrorCode.INVALID_DATA_FORMAT]: 'VALIDATION',

  // Database
  [ErrorCode.DATABASE_ERROR]: 'DATABASE',
  [ErrorCode.NETWORK_ERROR]: 'DATABASE',
  [ErrorCode.NOT_FOUND]: 'DATABASE',
  [ErrorCode.DUPLICATE_ENTRY]: 'DATABASE',

  // System
  [ErrorCode.SYSTEM_ERROR]: 'SYSTEM',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'SYSTEM',
  [ErrorCode.TIMEOUT_ERROR]: 'SYSTEM',

  // Authorization
  [ErrorCode.FORBIDDEN]: 'AUTHORIZATION',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'AUTHORIZATION',

  // Configuration
  [ErrorCode.CONFIGURATION_ERROR]: 'CONFIGURATION',
  [ErrorCode.MISSING_ENVIRONMENT_VARIABLE]: 'CONFIGURATION',
};

/**
 * Gets the category for a specific error code
 * @param code - The error code to categorize
 * @returns The error category
 */
export function getErrorCategory(code: ErrorCode): ErrorCategory {
  return ERROR_CATEGORIES[code];
}

/**
 * Checks if an error code belongs to a specific category
 * @param code - The error code to check
 * @param category - The category to match against
 * @returns True if the error belongs to the category
 */
export function isErrorCategory(code: ErrorCode, category: ErrorCategory): boolean {
  return ERROR_CATEGORIES[code] === category;
}
