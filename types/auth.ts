/**
 * Authentication type definitions
 * @module types/auth
 */

/**
 * Represents a single Google authentication attempt
 */
export interface GoogleAuthAttempt {
  userId: string;
  email: string;
  attemptNumber: number;
  timestamp: number;
  profileData: {
    first_name: string | null;
    last_name: string | null;
  };
  /** True if using "Utente" and "Anonimo" defaults */
  isDefaultProfile: boolean;
}

/**
 * Result of analyzing whether a retry is needed
 */
export interface GoogleAuthRetryResult {
  shouldRetry: boolean;
  shouldShowError: boolean;
  attemptNumber: number;
  isExistingUser: boolean;
  message?: string;
}

/**
 * Configuration options for retry strategies
 */
export interface RetryStrategyConfig {
  maxRetryAttempts: number;
  retryWindowMs: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry strategy configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryStrategyConfig = {
  maxRetryAttempts: 3,
  retryWindowMs: 30 * 60 * 1000, // 30 minutes
  baseDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Profile data structure
 */
export interface ProfileData {
  first_name: string | null;
  last_name: string | null;
}

/**
 * Storage interface for dependency injection
 */
export interface AuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * UI callback interface for dependency injection
 */
export interface AuthUIFeedback {
  showRetryFeedback(attemptNumber: number, maxAttempts: number, message: string): void;
  showMaxAttemptsError(): void;
  showError(message: string): void;
}
