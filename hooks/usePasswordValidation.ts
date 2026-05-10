// usePasswordValidation.ts — usePasswordValidation module.
//
// exports: PasswordValidation | usePasswordValidation
// used_by: components\LoginForm.tsx
//         components\PasswordValidationDisplay.tsx
// rules:   This hook's API surface must remain stable as it is consumed by multiple components; do not remove or rename exported properties (`password`, `validation`, `handlePasswordChange`, `isPasswordValid`, `validationProgress`, `setPassword`) without updating all consumers listed in comments.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useState, useCallback } from 'react';
import { validatePassword } from '../utils/authValidation';

/**
 * Interfaccia per lo stato di validazione della password
 */
export interface PasswordValidation {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
}

/**
 * Hook per la gestione della validazione della password
 */
export const usePasswordValidation = () => {
  const [password, setPassword] = useState('');
  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    setValidation(validatePassword(text));
  }, []);

  const isPasswordValid = useCallback((): boolean => {
    return Object.values(validation).every(Boolean);
  }, [validation]);

  const getValidationProgress = useCallback((): number => {
    const validCount = Object.values(validation).filter(Boolean).length;
    return (validCount / Object.keys(validation).length) * 100;
  }, [validation]);

  return {
    password,
    validation,
    handlePasswordChange,
    isPasswordValid: isPasswordValid(),
    validationProgress: getValidationProgress(),
    setPassword,
  };
};