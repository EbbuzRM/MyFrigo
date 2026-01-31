/**
 * @fileoverview Centralized error handler - Facade pattern.
 * Aggregates specialized error handlers and provides a unified interface.
 * This is the main entry point for error handling in the application.
 */

import { LoggingService } from '../services/LoggingService';
import { ErrorCode, getErrorCategory, ErrorCategory } from '../types/errorCodes';
import {
  AppError,
  ErrorConfig,
  hasErrorCode,
  hasErrorMessage,
  isNetworkError,
  extractErrorMessage,
} from '../types/errorTypes';

// Import specialized handlers
import {
  handleNetworkError,
  isSessionExpired,
  isUnauthorized,
} from './NetworkErrorHandler';
import { handleDatabaseError, isNotFoundError, isDuplicateEntryError } from './DatabaseErrorHandler';
import { handleAuthError, isEmailNotConfirmed, isInvalidCredentials } from './AuthErrorHandler';

// Import formatters
import {
  formatErrorForUI,
  formatErrorForDebug,
  getErrorTitle,
  getErrorSuggestions,
} from './errorFormatters';

// ==================== ERROR CREATION ====================

/**
 * Creates a standardized application error
 * @param config - Error configuration
 * @returns Standardized AppError
 */
export function createError(config: ErrorConfig): AppError;
export function createError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  originalError?: unknown
): AppError;
export function createError(
  codeOrConfig: ErrorCode | ErrorConfig,
  message?: string,
  details?: Record<string, unknown>,
  originalError?: unknown
): AppError {
  // Handle object config
  if (typeof codeOrConfig === 'object') {
    const config = codeOrConfig;
    return createErrorInternal(config.code, config.message, config.details, config.originalError);
  }

  // Handle positional arguments
  return createErrorInternal(codeOrConfig, message || 'Errore', details, originalError);
}

/**
 * Internal error creation with logging
 */
function createErrorInternal(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  originalError?: unknown
): AppError {
  const error: AppError = {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    stack:
      originalError && typeof originalError === 'object' && 'stack' in originalError
        ? (originalError as { stack?: string }).stack
        : undefined,
  };

  logError(error, originalError);
  return error;
}

// ==================== ERROR LOGGING ====================

/**
 * Logs an error with appropriate severity based on error category
 * @param error - The error to log
 * @param originalError - Original error for additional context
 */
function logError(error: AppError, originalError?: unknown): void {
  const logMessage = `[${error.code}] ${error.message}`;
  const category = getErrorCategory(error.code);

  switch (category) {
    case 'AUTH':
    case 'AUTHORIZATION':
      LoggingService.warning('ErrorHandler', logMessage, error.details);
      break;

    case 'VALIDATION':
      LoggingService.info('ErrorHandler', logMessage, error.details);
      break;

    case 'DATABASE':
      if (error.code === ErrorCode.NETWORK_ERROR) {
        LoggingService.warning('ErrorHandler', logMessage, error.details);
      } else {
        LoggingService.error('ErrorHandler', logMessage, originalError || error.details);
      }
      break;

    case 'SYSTEM':
    case 'CONFIGURATION':
    default:
      LoggingService.error('ErrorHandler', logMessage, originalError || error.details);
      break;
  }
}

// ==================== ERROR ROUTING ====================

/**
 * Determines which error handler should handle the error
 * @param error - Unknown error to analyze
 * @returns Category of error for routing
 */
function determineErrorCategory(error: unknown): ErrorCategory {
  // Check for network errors first (includes session/timeout)
  if (isNetworkError(error) || isSessionExpired(error) || isUnauthorized(error)) {
    return 'DATABASE'; // Network errors handled by NetworkErrorHandler
  }

  // Check for auth errors
  if (isEmailNotConfirmed(error) || isInvalidCredentials(error)) {
    return 'AUTH';
  }

  // Check for database errors by code
  if (hasErrorCode(error)) {
    const code = String(error.code);
    // PostgreSQL error codes
    if (/^\d{5}$/.test(code) || code.startsWith('PGRST')) {
      return 'DATABASE';
    }
  }

  // Check by message content
  if (hasErrorMessage(error)) {
    const msg = error.message.toLowerCase();

    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      return 'DATABASE';
    }
    if (
      msg.includes('unauthorized') ||
      msg.includes('jwt') ||
      msg.includes('token') ||
      msg.includes('session')
    ) {
      return 'AUTH';
    }
    if (msg.includes('validation') || msg.includes('invalid format')) {
      return 'VALIDATION';
    }
    if (msg.includes('database') || msg.includes('query') || msg.includes('sql')) {
      return 'DATABASE';
    }
  }

  return 'SYSTEM';
}

/**
 * Main error handler - routes to specialized handlers
 * @param error - Unknown error to handle
 * @returns Standardized AppError
 */
export function handleError(error: unknown): AppError {
  const category = determineErrorCategory(error);

  switch (category) {
    case 'AUTH':
    case 'AUTHORIZATION':
      return handleAuthError(error);

    case 'DATABASE':
      // Network errors go through network handler first
      if (isNetworkError(error) || (hasErrorMessage(error) && error.message.includes('network'))) {
        return handleNetworkError(error);
      }
      return handleDatabaseError(error);

    case 'VALIDATION':
      return handleValidationError(error);

    case 'SYSTEM':
    case 'CONFIGURATION':
    default:
      return normalizeError(error);
  }
}

/**
 * Handles validation errors
 * @param error - Validation error or field info
 * @returns Standardized AppError
 */
export function handleValidationError(
  error: unknown,
  field?: string,
  rule?: string
): AppError {
  // If called with field and rule, create validation error
  if (field && rule) {
    return createError(
      ErrorCode.VALIDATION_ERROR,
      `Campo "${field}" non valido: ${rule}`,
      { field, rule, value: error }
    );
  }

  // Otherwise normalize the error
  if (hasErrorMessage(error)) {
    return createError(
      ErrorCode.VALIDATION_ERROR,
      error.message,
      hasErrorCode(error) ? { originalCode: error.code } : undefined,
      error
    );
  }

  return createError(
    ErrorCode.VALIDATION_ERROR,
    'Dati inseriti non validi.',
    { originalError: String(error) },
    error
  );
}

/**
 * Normalizes any error to AppError format
 * @param error - Unknown error to normalize
 * @returns Standardized AppError
 */
export function normalizeError(error: unknown): AppError {
  let code = ErrorCode.SYSTEM_ERROR;
  let message = extractErrorMessage(error, 'Errore sconosciuto');
  let details: Record<string, unknown> | undefined;

  if (error instanceof Error) {
    details = {
      originalMessage: error.message,
      stack: error.stack,
    };

    // Analyze message for specific error types
    const msg = error.message.toLowerCase();
    if (msg.includes('unauthorized') || msg.includes('jwt')) {
      code = ErrorCode.UNAUTHORIZED;
    } else if (msg.includes('email') && msg.includes('confirm')) {
      code = ErrorCode.EMAIL_NOT_CONFIRMED;
    } else if (msg.includes('validation') || msg.includes('invalid')) {
      code = ErrorCode.VALIDATION_ERROR;
    } else if (msg.includes('network') || msg.includes('fetch')) {
      code = ErrorCode.NETWORK_ERROR;
    } else if (msg.includes('not found')) {
      code = ErrorCode.NOT_FOUND;
    } else if (msg.includes('duplicate') || msg.includes('unique')) {
      code = ErrorCode.DUPLICATE_ENTRY;
    }
  } else if (typeof error === 'object' && error !== null) {
    details = error as Record<string, unknown>;

    if (hasErrorCode(error)) {
      const errorCode = String(error.code).toUpperCase();
      if (Object.values(ErrorCode).includes(errorCode as ErrorCode)) {
        code = errorCode as ErrorCode;
      }
    }
  }

  return createError(code, message, details, error);
}

// ==================== BACKWARD COMPATIBILITY ====================

/**
 * @deprecated Use handleError() instead
 * Handles network errors - delegates to NetworkErrorHandler
 */
export function handleNetworkErrorCompat(error: unknown): AppError {
  return handleNetworkError(error);
}

/**
 * @deprecated Use handleError() instead
 * Handles database errors - delegates to DatabaseErrorHandler
 */
export function handleDatabaseErrorCompat(error: unknown): AppError {
  return handleDatabaseError(error);
}

/**
 * @deprecated Use handleAuthError() from AuthErrorHandler instead
 * Handles auth errors - delegates to AuthErrorHandler
 */
export function handleAuthErrorCompat(error: unknown): AppError {
  return handleAuthError(error);
}

// ==================== EXPORTS ====================

// Re-export all types for convenience
export { ErrorCode, getErrorCategory, isErrorCategory } from '../types/errorCodes';
export type { ErrorCategory } from '../types/errorCodes';
export type { AppError, ErrorConfig } from '../types/errorTypes';
export {
  hasErrorCode,
  hasErrorMessage,
  isNetworkError,
  isStandardError,
  extractErrorMessage,
  extractErrorCode,
} from '../types/errorTypes';

// Re-export specialized handlers
export { handleNetworkError, isSessionExpired, isUnauthorized } from './NetworkErrorHandler';
export {
  handleDatabaseError,
  isNotFoundError,
  isDuplicateEntryError,
  isForeignKeyError,
} from './DatabaseErrorHandler';
export {
  handleAuthError,
  isEmailNotConfirmed,
  isInvalidCredentials,
  isAuthSessionExpired,
  isForbidden,
  isInsufficientPermissions,
} from './AuthErrorHandler';

// Re-export formatters
export {
  formatErrorForUI,
  formatErrorForDebug,
  getErrorTitle,
  getErrorSuggestions,
  formatErrorCode,
} from './errorFormatters';

// Legacy class for backward compatibility
/**
 * @deprecated Use the exported functions directly instead
 * Legacy ErrorHandler class maintained for backward compatibility
 */
export class ErrorHandler {
  static createError = createError;
  static normalizeError = normalizeError;
  static handleNetworkError = handleNetworkError;
  static handleDatabaseError = handleDatabaseError;
  static handleAuthError = handleAuthError;
  static handleValidationError = handleValidationError;
  static isSessionExpired = isSessionExpired;
  static isUnauthorized = isUnauthorized;
  static formatForUI = formatErrorForUI;
}

// Default export for backward compatibility
export default ErrorHandler;
