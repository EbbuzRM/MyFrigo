import { LoggingService } from '@/services/LoggingService';
import { 
  GoogleAuthAttempt, 
  GoogleAuthRetryResult, 
  RetryStrategyConfig, 
  DEFAULT_RETRY_CONFIG,
  ProfileData 
} from '@/types/auth';
import { AuthAttemptRepository } from '@/utils/GoogleAuthStorage';
import { isDefaultProfile } from '@/utils/ProfileValidator';

/**
 * Core retry logic for Google authentication
 * @module utils/GoogleAuthRetryManager
 */

export interface RetryManagerDependencies {
  repository: AuthAttemptRepository;
  config: RetryStrategyConfig;
}

/**
 * Manages retry logic for Google authentication
 */
export class GoogleAuthRetryManager {
  private repository: AuthAttemptRepository;
  private config: RetryStrategyConfig;

  constructor(dependencies: RetryManagerDependencies) {
    this.repository = dependencies.repository;
    this.config = dependencies.config;
  }

  /**
   * Calculates delay for the next retry attempt using exponential backoff
   */
  calculateRetryDelay(attemptNumber: number): number {
    const delay = this.config.baseDelayMs * Math.pow(this.config.backoffMultiplier, attemptNumber - 1);
    return Math.min(delay, this.config.maxDelayMs);
  }

  /**
   * Analyzes whether a retry is needed based on current profile state
   */
  async analyzeRetryNeed(
    userId: string,
    email: string,
    currentProfile: ProfileData
  ): Promise<GoogleAuthRetryResult> {
    const lastAttempt = await this.repository.getLastAttempt(userId);
    const isCurrentProfileDefault = isDefaultProfile(currentProfile.first_name, currentProfile.last_name);

    LoggingService.info('GoogleAuthRetryManager', 'Retry analysis', {
      userId,
      email,
      hasLastAttempt: !!lastAttempt,
      isCurrentProfileDefault,
      currentProfile
    });

    if (!isCurrentProfileDefault) {
      if (lastAttempt) {
        await this.repository.clearAttempts(userId);
      }
      return {
        shouldRetry: false,
        shouldShowError: false,
        attemptNumber: 0,
        isExistingUser: true
      };
    }

    if (!lastAttempt) {
      return this.createFirstAttempt(userId, email, currentProfile, isCurrentProfileDefault);
    }

    return this.handleExistingAttempt(lastAttempt, userId, currentProfile, isCurrentProfileDefault);
  }

  private async createFirstAttempt(
    userId: string,
    email: string,
    profile: ProfileData,
    isDefault: boolean
  ): Promise<GoogleAuthRetryResult> {
    const newAttempt: GoogleAuthAttempt = {
      userId,
      email,
      attemptNumber: 1,
      timestamp: Date.now(),
      profileData: profile,
      isDefaultProfile: isDefault
    };

    await this.repository.saveAttempt(newAttempt);

    return {
      shouldRetry: true,
      shouldShowError: false,
      attemptNumber: 1,
      isExistingUser: true,
      message: 'Primo tentativo con profilo incompleto, riprovando...'
    };
  }

  private async handleExistingAttempt(
    lastAttempt: GoogleAuthAttempt,
    userId: string,
    profile: ProfileData,
    isDefault: boolean
  ): Promise<GoogleAuthRetryResult> {
    const nextAttemptNumber = lastAttempt.attemptNumber + 1;

    if (nextAttemptNumber <= this.config.maxRetryAttempts) {
      const updatedAttempt: GoogleAuthAttempt = {
        ...lastAttempt,
        attemptNumber: nextAttemptNumber,
        timestamp: Date.now(),
        profileData: profile,
        isDefaultProfile: isDefault
      };

      await this.repository.saveAttempt(updatedAttempt);

      return {
        shouldRetry: true,
        shouldShowError: false,
        attemptNumber: nextAttemptNumber,
        isExistingUser: true,
        message: `Tentativo ${nextAttemptNumber}/${this.config.maxRetryAttempts} con profilo incompleto, riprovando...`
      };
    }

    await this.repository.clearAttempts(userId);

    return {
      shouldRetry: false,
      shouldShowError: true,
      attemptNumber: nextAttemptNumber,
      isExistingUser: true,
      message: 'Raggiunto il numero massimo di tentativi. Riprova più tardi.'
    };
  }

  /**
   * Determines if user is likely new based on attempt history
   */
  async isLikelyNewUser(userId: string): Promise<boolean> {
    const lastAttempt = await this.repository.getLastAttempt(userId);
    return !lastAttempt;
  }

  /**
   * Clears all attempts for a user
   */
  async clearAttempts(userId: string): Promise<void> {
    await this.repository.clearAttempts(userId);
  }
}

/**
 * Factory function to create a configured retry manager
 */
export function createGoogleAuthRetryManager(
  repository: AuthAttemptRepository,
  config: RetryStrategyConfig = DEFAULT_RETRY_CONFIG
): GoogleAuthRetryManager {
  return new GoogleAuthRetryManager({ repository, config });
}
