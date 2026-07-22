// useRegistrationState.ts — useRegistrationState module.
//
// exports: UseRegistrationStateReturn | useRegistrationState
// used_by: hooks\useRegistration.ts
//                   hooks\useRegistrationOrchestrator.ts
// rules:   - The `useRegistrationState` hook must remain a pure state management unit with no business logic, accepting only state mutations through its exposed setters.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useCallback } from 'react';
import { RegistrationData, RegistrationResult } from './useRegistration.types';

export interface UseRegistrationStateReturn {
  isLoading: boolean;
  error: string | null;
  registrationComplete: boolean;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  setComplete: (value: boolean) => void;
  reset: () => void;
  handleError: (err: unknown) => string;
}

import { useState } from 'react';
import { LoggingService } from '@/services/LoggingService';
import { AUTH_CONSTANTS } from '@/constants/auth';

const LOG_TAG = AUTH_CONSTANTS.LOG_TAGS.SIGNUP;

export function useRegistrationState(): UseRegistrationStateReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setRegistrationComplete(false);
  }, []);

  const handleError = useCallback((err: unknown): string => {
    const errorMessage = err instanceof Error ? err.message : AUTH_CONSTANTS.ERRORS.UNKNOWN_ERROR;
    LoggingService.error(LOG_TAG, 'Registration failed', { error: err, errorMessage });
    return errorMessage;
  }, []);

  return {
    isLoading,
    error,
    registrationComplete,
    setLoading: setIsLoading,
    setError,
    setComplete: setRegistrationComplete,
    reset,
    handleError,
  };
}
