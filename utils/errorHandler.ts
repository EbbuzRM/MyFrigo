// errorHandler.ts — errorHandler module.
//
// exports: createError | handleError | handleValidationError | normalizeError | ErrorCode | getErrorCategory | isErrorCategory | ErrorCategory | AppError | ErrorConfig | hasErrorCode | hasErrorMessage | isNetworkError | isStandardError | extractErrorMessage | extractErrorCode | handleNetworkError | (+16 more)
// used_by: utils\AuthErrorHandler.ts
//                   utils\DatabaseErrorHandler.ts
//                   utils\NetworkErrorHandler.ts
//                   utils\errorFormatters.ts
// rules:   - All error handling must go through this module as the single facade entry point; specialized handlers (NetworkErrorHandler, DatabaseErrorHandler, AuthErrorHandler) must not be imported directly by other modules.
//          - The ErrorCode enum and ErrorCategory types are defined externally in '../types/errorCodes' and must remain in sync with this module's error creation and categorization logic.
//          - Every public export function must have a corresponding import from a specialized handler or formatter; the facade pattern must be consistently maintained.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * @fileoverview Centralized error handler — Facade pattern.
 *
 * `errorHandler.ts` is the **single entry point** for all error handling in
 * the application. It implements the **Facade pattern** by aggregating
 * specialized handler modules (`NetworkErrorHandler`, `DatabaseErrorHandler`,
 * `AuthErrorHandler`) and exposing a unified interface (`handleError`,
 * `normalizeError`, `handleValidationError`, etc.).
 *
 * ## When to use it
 *
 * Use this module whenever you need to convert a raw `unknown` error into a
 * structured, application-level `AppError`. Typical scenarios:
 *
 * - Inside `catch` blocks in service methods (before wrapping in
 *   `ServiceResult<T>` via `createErrorResult`).
 * - In React component error boundaries or top-level promise rejection
 *   handlers.
 * - Anywhere an error originates from an external boundary (Supabase,
 *   fetch, native modules) and needs normalization.
 *
 * ## Relationship with ServiceResult<T>
 *
 * `errorHandler.ts` and `ServiceResult<T>` (defined in
 * `types/ServiceResult.ts`) are **complementary, not alternative** error
 * mechanisms:
 *
 * 1. `errorHandler` converts `unknown` → `AppError` (structured, with code,
 *    category, timestamp, stack).
 * 2. `ServiceResult<T>` wraps the *outcome* of a service call, carrying
 *    either typed data or a string error message.
 *
 * The typical flow inside a service method is:
 * ```typescript
 * try {
 *   const { data, error } = await supabase.from('products').select();
 *   if (error) {
 *     const appError = handleError(error);         // ← errorHandler
 *     return createErrorResult<Product[]>(appError.message);  // ← ServiceResult
 *   }
 *   return createSuccessResult(data);              // ← ServiceResult
 * } catch (e) {
 *   return createErrorResult<Product[]>(handleError(e).message);
 * }
 * ```
 *
 * ## Specialized handlers — Strategy pattern
 *
 * The facade delegates to specialized handler modules based on the error
 * category determined by `determineErrorCategory()`:
 *
 * | Category    | Handler module        | Responsibility                          |
 * |-------------|-----------------------|-----------------------------------------|
 * | `DATABASE`  | `DatabaseErrorHandler`| Supabase / PostgreSQL errors            |
 * | `AUTH`      | `AuthErrorHandler`    | JWT, session, credential errors         |
 * | `VALIDATION`| `handleValidationError` | Input validation failures             |
 * | `SYSTEM`    | `normalizeError`      | Fallback for unrecognized errors        |
 *
 * Network errors are routed through `NetworkErrorHandler` first (even though
 * they fall under the `DATABASE` category) because they require distinct
 * retry / offline-handling logic.
 *
 * **Rule:** Other modules must import from this facade only — never import
 * the specialized handlers directly.
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
      return 'DATABASE'; // Will be routed to handleNetworkError
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
 * Main error handler — routes an unknown error to the appropriate
 * specialized handler based on its category.
 *
 * This is the **primary public entry point** of the Facade. Callers pass any
 * `unknown` error (from a `catch` block, Supabase response, etc.) and
 * receive a structured `AppError` in return.
 *
 * Internally, `determineErrorCategory()` inspects the error and the
 * appropriate Strategy handler is invoked:
 * - `AUTH` / `AUTHORIZATION` → `handleAuthError`
 * - `DATABASE` → `handleNetworkError` (if network-related) or
 *   `handleDatabaseError`
 * - `VALIDATION` → `handleValidationError`
 * - `SYSTEM` / `CONFIGURATION` → `normalizeError` (fallback)
 *
 * @param error - Unknown error to handle (from catch blocks, Supabase, etc.)
 * @returns A standardized `AppError` with `code`, `message`, `details`,
 *          `timestamp`, and optional `stack`
 *
 * @example
 * ```typescript
 * try {
 *   await supabase.from('products').insert(newProduct);
 * } catch (e) {
 *   const appError = handleError(e);
 *   // appError.code === ErrorCode.DUPLICATE_ENTRY
 *   // appError.message === 'A product with this barcode already exists'
 * }
 * ```
 */
export function handleError(error: unknown): AppError {
  const category = determineErrorCategory(error);

  switch (category) {
    case 'AUTH':
    case 'AUTHORIZATION':
      return handleAuthError(error);

    case 'DATABASE':
      // Network errors go through network handler first
      if (
        isNetworkError(error) ||
        isSessionExpired(error) ||
        isUnauthorized(error) ||
        (hasErrorMessage(error) &&
          (error.message.toLowerCase().includes('network') ||
            error.message.toLowerCase().includes('fetch') ||
            error.message.toLowerCase().includes('connection')))
      ) {
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
 * Handles validation errors — either creates a new validation `AppError`
 * from field/rule info, or normalizes an existing validation error.
 *
 * **Two calling conventions:**
 *
 * 1. **Create** — pass `field` and `rule` to generate a validation error
 *    from scratch (useful for form validation in components/hooks):
 *    ```typescript
 *    return handleValidationError(inputValue, 'email', 'required');
 *    ```
 *
 * 2. **Normalize** — pass only an `error` to convert a raw validation error
 *    (e.g., from Yup, Zod, or a backend 400 response) into a standardized
 *    `AppError`:
 *    ```typescript
 *    return handleValidationError(rawValidationError);
 *    ```
 *
 * @param error - Validation error object, or the invalid value when
 *                creating a new error
 * @param field - (optional) Field name that failed validation
 * @param rule - (optional) Validation rule that was violated
 * @returns A standardized `AppError` with `ErrorCode.VALIDATION_ERROR`
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
 * Fallback error normalizer — converts any `unknown` value into a
 * standardized `AppError`.
 *
 * This is the **last-resort Strategy** invoked by `handleError()` when the
 * error does not match any specialized handler (network, auth, database,
 * validation). It performs heuristic analysis on the error message to
 * assign the most appropriate `ErrorCode`, then delegates to
 * `createError()` for logging.
 *
 * @param error - Unknown error to normalize
 * @returns A standardized `AppError` (never throws)
 *
 * @example
 * ```typescript
 * const appError = normalizeError('something went wrong');
 * // appError.code === ErrorCode.SYSTEM_ERROR
 * // appError.message === 'something went wrong'
 * ```
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
} from './errorFormatters';
