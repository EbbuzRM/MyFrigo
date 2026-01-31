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
