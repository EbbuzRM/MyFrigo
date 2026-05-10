// useRegistrationOrchestrator.ts — useRegistrationOrchestrator module.
//
// exports: useRegistrationOrchestrator
// used_by: hooks\useRegistration.ts
// rules:   All state mutations must be delegated to the provided `state` object (of type `UseRegistrationStateReturn`) and must not be performed directly within this orchestrator or its dependencies.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useCallback } from 'react';
import { RegistrationData, RegistrationResult } from './useRegistration.types';
import { useRegistrationState, UseRegistrationStateReturn } from './useRegistrationState';
import { AUTH_CONSTANTS } from '@/constants/auth';
import { LoggingService } from '@/services/LoggingService';

const LOG_TAG = AUTH_CONSTANTS.LOG_TAGS.SIGNUP;

export function useRegistrationOrchestrator(
  checkEmail: (email: string) => Promise<boolean>,
  createAccount: (data: RegistrationData) => Promise<RegistrationResult>,
  state: UseRegistrationStateReturn
) {
  return useCallback(
    async (data: RegistrationData): Promise<RegistrationResult> => {
      state.setLoading(true);
      state.setError(null);
      state.setComplete(false);

      try {
        LoggingService.info(LOG_TAG, 'Starting registration process', { email: data.email });
        const emailExists = await checkEmail(data.email);
        if (emailExists) {
          state.setLoading(false);
          return { success: false, error: AUTH_CONSTANTS.ALERT_MESSAGES.EMAIL_EXISTS };
        }
        return await createAccount(data);
      } catch (err) {
        const errorMessage = state.handleError(err);
        state.setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        state.setLoading(false);
        LoggingService.info(LOG_TAG, 'Registration process completed');
      }
    },
    [checkEmail, createAccount, state]
  );
}
