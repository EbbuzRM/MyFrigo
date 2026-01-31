/**
 * @fileoverview Network error handler using Strategy pattern.
 * Handles connection errors, timeouts, and network-related failures.
 */

import { ErrorCode } from '../types/errorCodes';
import {
  AppError,
  isNetworkError,
  hasErrorMessage,
  NetworkError,
} from '../types/errorTypes';
import { createError } from './errorHandler';

/**
 * Checks if an error is a session expired error (PGRST301)
 * @param error - Unknown error to check
 * @returns True if session is expired
 */
export function isSessionExpired(error: unknown): boolean {
  if (hasErrorMessage(error)) {
    const msg = error.message.toLowerCase();
    return (
      (msg.includes('session') && (msg.includes('expired') || msg.includes('invalid'))) ||
      (hasErrorCode(error) && error.code === 'PGRST301')
    );
  }
  return hasErrorCode(error) && error.code === 'PGRST301';
}

/**
 * Checks if an error is an unauthorized error
 * @param error - Unknown error to check
 * @returns True if unauthorized
 */
export function isUnauthorized(error: unknown): boolean {
  if (hasErrorCode(error) && error.code === 'PGRST301') {
    return true;
  }

  if (!hasErrorMessage(error)) {
    return false;
  }

  const msg = error.message.toLowerCase();
  return msg.includes('unauthorized') || msg.includes('jwt') || msg.includes('token');
}

/**
 * Handles network connection errors
 * @param error - The network error to handle
 * @returns Standardized AppError
 */
export function handleNetworkConnectionError(error: NetworkError): AppError {
  const errorMessage = hasErrorMessage(error) ? error.message : 'Errore di rete';

  return createError(
    ErrorCode.NETWORK_ERROR,
    'Errore di connessione. Controlla la tua connessione a internet e riprova.',
    { originalError: errorMessage, networkCode: error.code }
  );
}

/**
 * Handles timeout errors
 * @param error - The timeout error
 * @returns Standardized AppError
 */
export function handleTimeoutError(error: unknown): AppError {
  const errorMessage = hasErrorMessage(error) ? error.message : 'Timeout';

  return createError(
    ErrorCode.TIMEOUT_ERROR,
    'Operazione scaduta. Riprova più tardi.',
    { originalError: errorMessage }
  );
}

/**
 * Handles service unavailable errors
 * @param error - The service error
 * @returns Standardized AppError
 */
export function handleServiceUnavailableError(error: unknown): AppError {
  const errorMessage = hasErrorMessage(error) ? error.message : 'Servizio non disponibile';

  return createError(
    ErrorCode.SERVICE_UNAVAILABLE,
    'Servizio temporaneamente non disponibile. Riprova più tardi.',
    { originalError: errorMessage }
  );
}

/**
 * Main network error handler - routes to specific handlers
 * @param error - Unknown error to handle
 * @returns Standardized AppError
 */
export function handleNetworkError(error: unknown): AppError {
  if (isNetworkError(error)) {
    return handleNetworkConnectionError(error);
  }

  // Check for timeout
  if (hasErrorMessage(error) && error.message.toLowerCase().includes('timeout')) {
    return handleTimeoutError(error);
  }

  // Check for service unavailable
  if (hasErrorMessage(error) && error.message.toLowerCase().includes('unavailable')) {
    return handleServiceUnavailableError(error);
  }

  // Check for session expired
  if (isSessionExpired(error)) {
    return createError(
      ErrorCode.SESSION_EXPIRED,
      'Sessione scaduta. Per favore accedi di nuovo.',
      { originalError: hasErrorMessage(error) ? error.message : String(error) }
    );
  }

  // Check for unauthorized
  if (isUnauthorized(error)) {
    return createError(
      ErrorCode.UNAUTHORIZED,
      'Sessione scaduta. Per favore accedi di nuovo.',
      { originalError: hasErrorMessage(error) ? error.message : String(error) }
    );
  }

  // Generic network error fallback
  return createError(
    ErrorCode.NETWORK_ERROR,
    'Errore di connessione. Controlla la tua connessione a internet e riprova.',
    { originalError: String(error) }
  );
}

// Import needed for hasErrorCode
import { hasErrorCode } from '../types/errorTypes';
