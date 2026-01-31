import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoggingService } from '@/services/LoggingService';
import { AuthStorage, GoogleAuthAttempt } from '@/types/auth';

/**
 * Storage operations for Google authentication attempts
 * @module utils/GoogleAuthStorage
 */

const STORAGE_KEY_PREFIX = 'google_auth_retry_';

/**
 * Storage implementation using AsyncStorage
 */
export class GoogleAuthStorage implements AuthStorage {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

/**
 * Manages persistence of authentication attempts
 */
export class AuthAttemptRepository {
  private storage: AuthStorage;
  private retryWindowMs: number;

  constructor(storage: AuthStorage, retryWindowMs: number) {
    this.storage = storage;
    this.retryWindowMs = retryWindowMs;
  }

  private getKey(userId: string): string {
    return `${STORAGE_KEY_PREFIX}${userId}`;
  }

  /**
   * Saves an authentication attempt
   */
  async saveAttempt(attempt: GoogleAuthAttempt): Promise<void> {
    try {
      const key = this.getKey(attempt.userId);
      await this.storage.setItem(key, JSON.stringify(attempt));
      LoggingService.info('AuthAttemptRepository', 'Authentication attempt saved', {
        userId: attempt.userId,
        attemptNumber: attempt.attemptNumber,
        isDefaultProfile: attempt.isDefaultProfile
      });
    } catch (error) {
      LoggingService.error('AuthAttemptRepository', 'Error saving attempt', error);
    }
  }

  /**
   * Retrieves the last valid authentication attempt for a user
   */
  async getLastAttempt(userId: string): Promise<GoogleAuthAttempt | null> {
    try {
      const key = this.getKey(userId);
      const data = await this.storage.getItem(key);
      if (data) {
        const attempt = JSON.parse(data) as GoogleAuthAttempt;
        const isWithinWindow = Date.now() - attempt.timestamp < this.retryWindowMs;
        if (isWithinWindow) {
          return attempt;
        } else {
          await this.storage.removeItem(key);
        }
      }
    } catch (error) {
      LoggingService.error('AuthAttemptRepository', 'Error retrieving attempt', error);
    }
    return null;
  }

  /**
   * Clears authentication attempts for a user
   */
  async clearAttempts(userId: string): Promise<void> {
    try {
      const key = this.getKey(userId);
      await this.storage.removeItem(key);
      LoggingService.info('AuthAttemptRepository', 'Authentication attempts cleared', { userId });
    } catch (error) {
      LoggingService.error('AuthAttemptRepository', 'Error clearing attempts', error);
    }
  }
}
