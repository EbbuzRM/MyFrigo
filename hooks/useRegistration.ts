// useRegistration.ts — useRegistration module.
//
// exports: useRegistration | RegistrationData | RegistrationResult | UseRegistrationReturn
// used_by: app\signup.tsx
// rules:   This module's state management, orchestration, and side-effect hooks must remain separate and composable; do not merge state logic into the main `useRegistration` hook or inline orchestration steps into individual action hooks.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useCallback } from 'react';
import { RegistrationData, RegistrationResult, UseRegistrationReturn } from './useRegistration.types';
import { useRegistrationState } from './useRegistrationState';
import { usePostRegistration } from './usePostRegistration';
import { useRegistrationOrchestrator } from './useRegistrationOrchestrator';
import { useEmailCheck, useUserProfileCreation, useAccountCreation } from './useRegistrationActions';

export function useRegistration(
  onSuccess: () => void,
  onEmailNeedsConfirmation: () => void
): UseRegistrationReturn {
  const state = useRegistrationState();
  const checkEmailExists = useEmailCheck();
  const createProfile = useUserProfileCreation();
  const createUserAccount = useAccountCreation(createProfile);

  const handleSuccess = useCallback(() => onSuccess(), [onSuccess]);
  const handleNeedsConfirmation = useCallback((_email: string) => onEmailNeedsConfirmation(), [onEmailNeedsConfirmation]);

  const handlePostRegistration = usePostRegistration({
    onSuccess: handleSuccess,
    onNeedsConfirmation: handleNeedsConfirmation,
  });

  const register = useRegistrationOrchestrator(checkEmailExists, createUserAccount, state);

  return {
    register,
    checkEmailExists,
    createUserAccount,
    handlePostRegistration,
    isLoading: state.isLoading,
    error: state.error,
    registrationComplete: state.registrationComplete,
    resetError: () => state.setError(null),
  };
}

export type { RegistrationData, RegistrationResult, UseRegistrationReturn } from './useRegistration.types';
