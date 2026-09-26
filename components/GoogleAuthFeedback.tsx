// GoogleAuthFeedback.tsx — GoogleAuthFeedback module.
//
// exports: GoogleAuthFeedback | useGoogleAuthFeedback
// used_by: hooks\__tests__\useGoogleAuth.test.ts
//                   hooks\useGoogleAuth.ts
// rules:   The `AuthUIFeedback` interface must be fully implemented without altering its contract, and all UI feedback must use only React Native `Alert` dialogs with no external UI dependencies.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import i18next from 'i18next';
import { Alert } from 'react-native';
import { AuthUIFeedback } from '@/types/auth';

/**
 * UI feedback component for Google Auth retry operations
 * @module components/GoogleAuthFeedback
 */

/**
 * Implementation of AuthUIFeedback using React Native Alert
 */
export class GoogleAuthFeedback implements AuthUIFeedback {
  /**
   * Shows retry feedback to the user
   */
  showRetryFeedback(attemptNumber: number, maxAttempts: number, _message: string): void {
    if (attemptNumber > 1) {
      Alert.alert(
        i18next.t('auth.googleProfileRecovery'),
        i18next.t('auth.googleRetryMessage', { attempt: attemptNumber, max: maxAttempts }),
        [{ text: i18next.t('common.ok') }],
        { cancelable: true }
      );
    }
  }

  /**
   * Shows error when max attempts reached
   */
  showMaxAttemptsError(): void {
    Alert.alert(
      i18next.t('auth.googleAuthProblem'),
      i18next.t('auth.googleMaxAttemptsMessage'),
      [
        { text: i18next.t('auth.googleTryLater'), style: 'default' },
        { text: i18next.t('common.ok'), style: 'cancel' }
      ]
    );
  }

  /**
   * Shows a generic error message
   */
  showError(_message: string): void {
    Alert.alert(i18next.t('common.error'), i18next.t('auth.errors_googleLoginFailed'), [{ text: i18next.t('common.ok') }], { cancelable: true });
  }
}

/**
 * React component wrapper for GoogleAuthFeedback
 */
export const useGoogleAuthFeedback = (): AuthUIFeedback => {
  return React.useMemo(() => new GoogleAuthFeedback(), []);
};
