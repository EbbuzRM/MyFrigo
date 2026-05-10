// usePostRegistration.ts — usePostRegistration module.
//
// exports: PostRegistrationCallbacks | usePostRegistration
// used_by: hooks\useRegistration.ts
// rules:   - This module is a pure side-effect hook that must not contain business logic or state management; it only orchestrates UI alerts and callback delegation based on RegistrationResult.
//          - All user-facing strings and alert configurations must be sourced exclusively from AUTH_CONSTANTS, never hardcoded.
//          - The callbacks parameter must remain immutable and provided externally; this module must not create or modify callbacks internally.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { LoggingService } from '@/services/LoggingService';
import { AUTH_CONSTANTS } from '@/constants/auth';
import { RegistrationResult } from './useRegistration.types';

const LOG_TAG = AUTH_CONSTANTS.LOG_TAGS.SIGNUP;

export interface PostRegistrationCallbacks {
  onSuccess: () => void;
  onNeedsConfirmation: (email: string) => void;
}

export function usePostRegistration(callbacks: PostRegistrationCallbacks) {
  return useCallback(
    (result: RegistrationResult, email: string) => {
      if (!result.success) {
        const errorMsg = result.error || AUTH_CONSTANTS.ERRORS.UNKNOWN_ERROR;
        Alert.alert(AUTH_CONSTANTS.ALERT_TITLES.REGISTRATION_ERROR, errorMsg, [
          { text: AUTH_CONSTANTS.ALERT_MESSAGES.OK_BUTTON },
        ]);
        return { error: errorMsg };
      }

      if (result.emailConfirmed) {
        Alert.alert(
          AUTH_CONSTANTS.ALERT_TITLES.REGISTRATION_COMPLETE,
          AUTH_CONSTANTS.ALERT_MESSAGES.REGISTRATION_SUCCESS,
          [
            {
              text: AUTH_CONSTANTS.ALERT_MESSAGES.OK_BUTTON,
              onPress: () => {
                LoggingService.info(LOG_TAG, 'User with confirmed email redirected to login', {
                  userId: result.userId,
                });
                callbacks.onSuccess();
              },
            },
          ]
        );
      } else {
        LoggingService.info(LOG_TAG, 'User redirected to email confirmation', { email });
        callbacks.onNeedsConfirmation(email);
      }

      return { success: true };
    },
    [callbacks]
  );
}
