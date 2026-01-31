/**
 * @fileoverview Authentication error handler using Strategy pattern.
 * Handles login failures, session issues, and authorization errors.
 */

import { ErrorCode } from '../types/errorCodes';
import { AppError, hasErrorMessage, hasErrorCode } from '../types/errorTypes';
import { createError } from './errorHandler';

/**
 * Checks if error indicates email not confirmed
 * @param error - Error to check
 * @returns True if email not confirmed
 */
export function isEmailNotConfirmed(error: unknown): boolean {
  if (!hasErrorMessage(error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('email') && msg.includes('confirm');
}

/**
 * Checks if error indicates invalid credentials
 * @param error - Error to check
 * @returns True if invalid credentials
 */
export function isInvalidCredentials(error: unknown): boolean {
  if (!hasErrorMessage(error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('invalid') && (msg.includes('credentials') || msg.includes('login'));
}

/**
 * Checks if error indicates session expired
 * @param error - Error to check
 * @returns True if session expired
 */
export function isAuthSessionExpired(error: unknown): boolean {
  if (hasErrorCode(error) && error.code === 'PGRST301') {
    return true;
  }

  if (!hasErrorMessage(error)) return false;

  const msg = error.message.toLowerCase();
  return (
    msg.includes('session') && (msg.includes('expired') || msg.includes('invalid'))
  );
}

/**
 * Checks if error indicates forbidden access
 * @param error - Error to check
 * @returns True if forbidden
 */
export function isForbidden(error: unknown): boolean {
  if (hasErrorCode(error)) {
    return error.code === '403' || error.code === 'FORBIDDEN';
  }

  if (!hasErrorMessage(error)) return false;

  const msg = error.message.toLowerCase();
  return msg.includes('forbidden') || msg.includes('access denied');
}

/**
 * Checks if error indicates insufficient permissions
 * @param error - Error to check
 * @returns True if insufficient permissions
 */
export function isInsufficientPermissions(error: unknown): boolean {
  if (hasErrorCode(error)) {
    return error.code === '403' || error.code === 'PGRST301';
  }

  if (!hasErrorMessage(error)) return false;

  const msg = error.message.toLowerCase();
  return msg.includes('permission') || msg.includes('unauthorized');
}

/**
 * Handles email not confirmed error
 * @param error - The email confirmation error
 * @returns Standardized AppError
 */
export function handleEmailNotConfirmedError(error: unknown): AppError {
  const originalMessage = hasErrorMessage(error) ? error.message : String(error);

  return createError(
    ErrorCode.EMAIL_NOT_CONFIRMED,
    'Email non confermata. Controlla la tua email e clicca sul link di conferma.',
    { originalError: originalMessage }
  );
}

/**
 * Handles invalid credentials error
 * @param error - The invalid credentials error
 * @returns Standardized AppError
 */
export function handleInvalidCredentialsError(error: unknown): AppError {
  const originalMessage = hasErrorMessage(error) ? error.message : String(error);

  return createError(
    ErrorCode.INVALID_CREDENTIALS,
    'Email o password non validi.',
    { originalError: originalMessage }
  );
}

/**
 * Handles session expired error
 * @param error - The session expired error
 * @returns Standardized AppError
 */
export function handleSessionExpiredError(error: unknown): AppError {
  const originalMessage = hasErrorMessage(error) ? error.message : String(error);

  return createError(
    ErrorCode.SESSION_EXPIRED,
    'Sessione scaduta. Per favore accedi di nuovo.',
    { originalError: originalMessage }
  );
}

/**
 * Handles forbidden access error
 * @param error - The forbidden error
 * @returns Standardized AppError
 */
export function handleForbiddenError(error: unknown): AppError {
  const originalMessage = hasErrorMessage(error) ? error.message : String(error);

  return createError(
    ErrorCode.FORBIDDEN,
    'Accesso negato. Non hai i permessi necessari.',
    { originalError: originalMessage }
  );
}

/**
 * Handles insufficient permissions error
 * @param error - The permissions error
 * @returns Standardized AppError
 */
export function handleInsufficientPermissionsError(error: unknown): AppError {
  const originalMessage = hasErrorMessage(error) ? error.message : String(error);

  return createError(
    ErrorCode.INSUFFICIENT_PERMISSIONS,
    'Permessi insufficienti per questa operazione.',
    { originalError: originalMessage }
  );
}

/**
 * Handles generic authentication errors
 * @param error - The auth error
 * @returns Standardized AppError
 */
export function handleGenericAuthError(error: unknown): AppError {
  const originalMessage = hasErrorMessage(error) ? error.message : String(error);

  return createError(
    ErrorCode.UNAUTHORIZED,
    'Errore di autenticazione. Per favore accedi di nuovo.',
    { originalError: originalMessage }
  );
}

/**
 * Main authentication error handler - routes to specific handlers
 * @param error - Unknown error to handle
 * @returns Standardized AppError
 */
export function handleAuthError(error: unknown): AppError {
  if (isEmailNotConfirmed(error)) {
    return handleEmailNotConfirmedError(error);
  }

  if (isInvalidCredentials(error)) {
    return handleInvalidCredentialsError(error);
  }

  if (isAuthSessionExpired(error)) {
    return handleSessionExpiredError(error);
  }

  if (isForbidden(error)) {
    return handleForbiddenError(error);
  }

  if (isInsufficientPermissions(error)) {
    return handleInsufficientPermissionsError(error);
  }

  return handleGenericAuthError(error);
}
