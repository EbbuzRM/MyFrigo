/**
 * @fileoverview Database error handler using Strategy pattern.
 * Handles PostgreSQL/Supabase specific error codes and database failures.
 */

import { ErrorCode } from '../types/errorCodes';
import { AppError, hasErrorCode, hasErrorMessage } from '../types/errorTypes';
import { createError } from './errorHandler';

/**
 * PostgreSQL error codes mapping
 */
const PG_ERROR_CODES: Record<string, { code: ErrorCode; message: string }> = {
  '23505': {
    code: ErrorCode.DUPLICATE_ENTRY,
    message: 'Dati duplicati. Questo valore esiste già.',
  },
  '23503': {
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Riferimento a dati non esistenti.',
  },
  'PGRST116': {
    code: ErrorCode.NOT_FOUND,
    message: 'Dati non trovati.',
  },
  'PGRST301': {
    code: ErrorCode.UNAUTHORIZED,
    message: 'Sessione scaduta. Per favore accedi di nuovo.',
  },
  '28P01': {
    code: ErrorCode.INVALID_CREDENTIALS,
    message: 'Credenziali database non valide.',
  },
  '3D000': {
    code: ErrorCode.DATABASE_ERROR,
    message: 'Database non trovato.',
  },
  '08006': {
    code: ErrorCode.NETWORK_ERROR,
    message: 'Errore di connessione al database.',
  },
  '08001': {
    code: ErrorCode.NETWORK_ERROR,
    message: 'Impossibile connettersi al database.',
  },
  '53300': {
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: 'Troppe connessioni al database. Riprova più tardi.',
  },
};

/**
 * Checks if an error is a PostgreSQL unique violation
 * @param error - Error to check
 * @returns True if unique violation
 */
export function isDuplicateEntryError(error: unknown): boolean {
  return hasErrorCode(error) && error.code === '23505';
}

/**
 * Checks if an error is a foreign key violation
 * @param error - Error to check
 * @returns True if foreign key violation
 */
export function isForeignKeyError(error: unknown): boolean {
  return hasErrorCode(error) && error.code === '23503';
}

/**
 * Checks if an error is a "not found" database error
 * @param error - Error to check
 * @returns True if not found
 */
export function isNotFoundError(error: unknown): boolean {
  return hasErrorCode(error) && error.code === 'PGRST116';
}

/**
 * Gets error info from PostgreSQL error code
 * @param pgCode - PostgreSQL error code
 * @returns Error info or null if unknown
 */
export function getPostgresErrorInfo(
  pgCode: string
): { code: ErrorCode; message: string } | null {
  return PG_ERROR_CODES[pgCode] || null;
}

/**
 * Handles unique constraint violations (duplicate entries)
 * @param error - The duplicate error
 * @returns Standardized AppError
 */
export function handleDuplicateEntryError(error: unknown): AppError {
  const originalMessage = hasErrorMessage(error) ? error.message : String(error);

  return createError(
    ErrorCode.DUPLICATE_ENTRY,
    'Dati duplicati. Questo valore esiste già.',
    { originalError: originalMessage, constraint: 'unique' }
  );
}

/**
 * Handles foreign key constraint violations
 * @param error - The foreign key error
 * @returns Standardized AppError
 */
export function handleForeignKeyError(error: unknown): AppError {
  const originalMessage = hasErrorMessage(error) ? error.message : String(error);

  return createError(
    ErrorCode.VALIDATION_ERROR,
    'Riferimento a dati non esistenti.',
    { originalError: originalMessage, constraint: 'foreign_key' }
  );
}

/**
 * Handles database "not found" errors
 * @param error - The not found error
 * @returns Standardized AppError
 */
export function handleNotFoundError(error: unknown): AppError {
  const originalMessage = hasErrorMessage(error) ? error.message : String(error);

  return createError(ErrorCode.NOT_FOUND, 'Dati non trovati.', {
    originalError: originalMessage,
  });
}

/**
 * Handles generic database errors
 * @param error - The database error
 * @returns Standardized AppError
 */
export function handleGenericDatabaseError(error: unknown): AppError {
  let message = "Errore durante l'operazione sul database.";
  let code = ErrorCode.DATABASE_ERROR;
  let details: Record<string, unknown> = {};

  // Check for PostgreSQL specific error
  if (hasErrorCode(error)) {
    const pgCode = String(error.code);
    const pgError = getPostgresErrorInfo(pgCode);

    if (pgError) {
      code = pgError.code;
      message = pgError.message;
      details.pgCode = pgCode;
    } else {
      details.errorCode = pgCode;
    }
  }

  if (hasErrorMessage(error)) {
    details.originalMessage = error.message;
    details.stack = isStandardError(error) ? error.stack : undefined;
  }

  return createError(code, message, details);
}

/**
 * Main database error handler - routes to specific handlers
 * @param error - Unknown error to handle
 * @returns Standardized AppError
 */
export function handleDatabaseError(error: unknown): AppError {
  if (isDuplicateEntryError(error)) {
    return handleDuplicateEntryError(error);
  }

  if (isForeignKeyError(error)) {
    return handleForeignKeyError(error);
  }

  if (isNotFoundError(error)) {
    return handleNotFoundError(error);
  }

  return handleGenericDatabaseError(error);
}

// Helper import
function isStandardError(error: unknown): error is Error {
  return error instanceof Error;
}
