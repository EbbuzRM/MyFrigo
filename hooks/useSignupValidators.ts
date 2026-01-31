import { useCallback } from 'react';
import { AUTH_CONSTANTS } from '@/constants/auth';
import { validatePassword, PasswordValidationResult } from '@/utils/authValidation';
import { SignupFormData, ValidationErrors } from './useSignupValidation.types';

export function useEmailValidator() {
  return useCallback((email: string): string | undefined => {
    if (!email.trim()) return 'Email richiesta';
    if (!AUTH_CONSTANTS.EMAIL_REGEX.test(email)) return 'Formato email non valido';
    return undefined;
  }, []);
}

export function useNameValidator() {
  return useCallback((name: string, fieldName: string): string | undefined => {
    const trimmed = name.trim();
    if (!trimmed) return `${fieldName} richiesto`;
    if (trimmed.length < AUTH_CONSTANTS.NAME_MIN_LENGTH) return `${fieldName} troppo corto`;
    return undefined;
  }, []);
}

export function usePasswordValidator() {
  return useCallback((password: string): PasswordValidationResult => validatePassword(password), []);
}

export function useFormValidator(
  validateEmail: (email: string) => string | undefined,
  validateName: (name: string, fieldName: string) => string | undefined
) {
  return useCallback((data: SignupFormData): { errors: ValidationErrors; isValid: boolean } => {
    const errors: ValidationErrors = {};
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
    const firstNameError = validateName(data.firstName, 'Nome');
    if (firstNameError) errors.firstName = firstNameError;
    const lastNameError = validateName(data.lastName, 'Cognome');
    if (lastNameError) errors.lastName = lastNameError;
    return { errors, isValid: Object.keys(errors).length === 0 };
  }, [validateEmail, validateName]);
}

export function usePasswordValidationChecker() {
  return useCallback((validation: PasswordValidationResult): boolean => {
    return validation.minLength && validation.hasUpper && validation.hasLower && validation.hasNumber;
  }, []);
}

export function useFormValidityChecker(
  validateEmail: (email: string) => string | undefined,
  validateName: (name: string, fieldName: string) => string | undefined
) {
  const isPasswordValid = usePasswordValidationChecker();
  return useCallback((data: SignupFormData): boolean => {
    const emailValid = !validateEmail(data.email);
    const firstNameValid = !validateName(data.firstName, 'Nome');
    const lastNameValid = !validateName(data.lastName, 'Cognome');
    const passwordValid = isPasswordValid(validatePassword(data.password));
    return emailValid && firstNameValid && lastNameValid && passwordValid;
  }, [validateEmail, validateName, isPasswordValid]);
}
