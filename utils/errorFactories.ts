// errorFactories.ts — leaf module: AppError creation + logging.
//
// exports: createError
// used_by: utils\errorHandler.ts
//                   utils\AuthErrorHandler.ts
//                   utils\DatabaseErrorHandler.ts
//                   utils\NetworkErrorHandler.ts
// rules:   - Leaf module: must NOT import errorHandler or any specialized handler (avoids runtime import cycles with the facade).
//          - Specialized handlers import createError from here; everything else goes through the errorHandler facade.
// agent:   claude-sonnet-5-5 | 2026-11-12 | extracted from errorHandler.ts

import { LoggingService } from '../services/LoggingService';
import { ErrorCode, getErrorCategory } from '../types/errorCodes';
import { AppError, ErrorConfig } from '../types/errorTypes';

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
