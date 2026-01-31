/**
 * @fileoverview Type definitions and type guards for application errors.
 * Provides standardized error structures and utilities for type checking.
 */

import { ErrorCode } from './errorCodes';

/**
 * Standardized application error structure.
 * All errors in the application should conform to this interface.
 */
export interface AppError {
  /** Unique error code for programmatic handling */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: Record<string, unknown>;
  /** ISO timestamp when the error occurred */
  timestamp: string;
  /** Optional stack trace for debugging */
  stack?: string;
}

/**
 * Configuration for creating a new error
 */
export interface ErrorConfig {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  originalError?: unknown;
}

/**
 * Type for objects that have a code property
 */
export interface CodeError {
  code: string | number;
}

/**
 * Type for objects that have a message property
 */
export interface MessageError {
  message: string;
}

/**
 * Type for network-specific errors
 */
export interface NetworkError extends CodeError {
  code: 'ERR_NETWORK' | 'ECONNABORTED';
  message?: string;
}

/**
 * Type guard: Checks if value is an object with a code property
 * @param error - Unknown value to check
 * @returns True if error has a code property
 */
export function hasErrorCode(error: unknown): error is CodeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (typeof (error as CodeError).code === 'string' ||
      typeof (error as CodeError).code === 'number')
  );
}

/**
 * Type guard: Checks if value is an object with a message property
 * @param error - Unknown value to check
 * @returns True if error has a message property
 */
export function hasErrorMessage(error: unknown): error is MessageError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as MessageError).message === 'string'
  );
}

/**
 * Type guard: Checks if value is a network error
 * @param error - Unknown value to check
 * @returns True if error is a network error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  if (!hasErrorCode(error)) return false;
  return error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
}

/**
 * Type guard: Checks if value is a standard Error instance
 * @param error - Unknown value to check
 * @returns True if error is an Error instance
 */
export function isStandardError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extracts message from an unknown error value
 * @param error - Unknown error value
 * @param defaultMessage - Default message if extraction fails
 * @returns Extracted or default message
 */
export function extractErrorMessage(error: unknown, defaultMessage: string = 'Errore sconosciuto'): string {
  if (hasErrorMessage(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}

/**
 * Extracts code from an unknown error value
 * @param error - Unknown error value
 * @returns Extracted code or undefined
 */
export function extractErrorCode(error: unknown): string | number | undefined {
  if (hasErrorCode(error)) {
    return error.code;
  }
  return undefined;
}
