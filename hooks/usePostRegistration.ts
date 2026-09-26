// usePostRegistration.ts — usePostRegistration module.
//
// exports: PostRegistrationCallbacks | usePostRegistration
// used_by: hooks\useRegistration.ts
// rules:   - This module is a pure side-effect hook that must not contain business logic or state management; it only orchestrates UI alerts and callback delegation based on RegistrationResult.
//          - All user-facing strings come from the `auth` i18n catalog via `useTranslation` at call time (never hardcoded, never resolved at module scope). The hook receives stable error codes (see REGISTRATION_ERROR_CODES) and maps code -> catalog text at this UI boundary.
//          - The callbacks parameter must remain immutable and provided externally; this module must not create or modify callbacks internally.
// agent:   executor | 2026-09-23 | Fase B i18n | gruppo 2 auth: CHIUSURA (consumer mapping)

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LoggingService } from '@/services/LoggingService';
import { AUTH_CONSTANTS } from '@/constants/auth';
import {
  RegistrationResult,
  REGISTRATION_ERROR_I18N_KEYS,
  isRegistrationErrorCode,
} from './useRegistration.types';

const LOG_TAG = AUTH_CONSTANTS.LOG_TAGS.SIGNUP;

export interface PostRegistrationCallbacks {
  onSuccess: () => void;
  onNeedsConfirmation: (email: string) => void;
  onLogin: () => void;
  onPasswordRecovery: () => void;
}

export function usePostRegistration(callbacks: PostRegistrationCallbacks) {
  const { t } = useTranslation();
  return useCallback(
    (result: RegistrationResult, email: string) => {
      if (!result.success) {
        const message =
          result.error && isRegistrationErrorCode(result.error)
            ? t(REGISTRATION_ERROR_I18N_KEYS[result.error])
            : t('auth.errors_unknownError');
        Alert.alert(t('auth.alertTitles_registrationError'), message, [
          { text: t('auth.ok') },
        ]);
        return { error: message };
      }

      if (result.emailConfirmed) {
        Alert.alert(
          t('auth.alertTitles_registrationComplete'),
          t('auth.postRegistration_registrationSuccess'),
          [
            {
              text: t('auth.ok'),
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
        Alert.alert(
          t('auth.alertTitles_checkEmail'),
          t('auth.postRegistration_checkEmailNeutral'),
          [
            {
              text: t('auth.postRegistration_recoverPasswordButton'),
              onPress: callbacks.onPasswordRecovery,
            },
            {
              text: t('auth.postRegistration_loginButton'),
              onPress: callbacks.onLogin,
            },
            {
              text: t('auth.postRegistration_enterCodeButton'),
              onPress: () => callbacks.onNeedsConfirmation(email),
            },
          ]
        );
      }

      return { success: true };
    },
    [callbacks, t]
  );
}
