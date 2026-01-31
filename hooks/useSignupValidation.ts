import { useState, useCallback } from 'react';
import { PasswordValidationResult } from '@/utils/authValidation';
import { SignupFormData, ValidationErrors, ValidationState, UseSignupValidationReturn } from './useSignupValidation.types';
import {
  useEmailValidator,
  useNameValidator,
  usePasswordValidator,
  useFormValidator,
  useFormValidityChecker,
  usePasswordValidationChecker,
} from './useSignupValidators';

// Re-export types for convenience
export type { SignupFormData } from './useSignupValidation.types';

export function useSignupValidation(): UseSignupValidationReturn {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult>({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

  const validateEmail = useEmailValidator();
  const validateName = useNameValidator();
  const getPasswordValidation = usePasswordValidator();
  const validateFormFields = useFormValidator(validateEmail, validateName);
  const isFormValid = useFormValidityChecker(validateEmail, validateName);
  const isPasswordValid = usePasswordValidationChecker();

  const validatePasswordField = useCallback((password: string): PasswordValidationResult => {
    const validation = getPasswordValidation(password);
    setPasswordValidation(validation);
    return validation;
  }, [getPasswordValidation]);

  const validateField = useCallback((field: keyof SignupFormData, value: string): string | undefined => {
    switch (field) {
      case 'email':
        return validateEmail(value);
      case 'firstName':
        return validateName(value, 'Nome');
      case 'lastName':
        return validateName(value, 'Cognome');
      case 'password':
        validatePasswordField(value);
        return undefined;
      default:
        return undefined;
    }
  }, [validateEmail, validateName, validatePasswordField]);

  const validateForm = useCallback((data: SignupFormData): ValidationState => {
    const { errors, isValid: fieldsValid } = validateFormFields(data);
    const passValidation = getPasswordValidation(data.password);
    setPasswordValidation(passValidation);
    const passwordValid = isPasswordValid(passValidation);
    if (!passwordValid && data.password) errors.password = 'La password non soddisfa i requisiti';
    setValidationErrors(errors);
    return { errors, passwordValidation: passValidation, isValid: fieldsValid && passwordValid };
  }, [validateFormFields, getPasswordValidation, isPasswordValid]);

  const clearErrors = useCallback(() => {
    setValidationErrors({});
    setPasswordValidation({ minLength: false, hasUpper: false, hasLower: false, hasNumber: false });
  }, []);

  return {
    validateForm,
    validateField,
    validatePasswordField,
    validationErrors,
    passwordValidation,
    isFormValid,
    clearErrors,
  };
}
