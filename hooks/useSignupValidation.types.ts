// useSignupValidation.types.ts — useSignupValidation.types module.
//
// exports: SignupFormData | ValidationErrors | ValidationState | UseSignupValidationReturn
// used_by: hooks\useSignupValidation.ts
//                   hooks\useSignupValidators.ts
// rules:   This module only exports TypeScript type/interface definitions and must not contain any runtime logic, constants, or function implementations.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { PasswordValidationResult } from '@/utils/authValidation';

export interface SignupFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface ValidationState {
  errors: ValidationErrors;
  passwordValidation: PasswordValidationResult;
  isValid: boolean;
}

export interface UseSignupValidationReturn {
  validateForm: (data: SignupFormData) => ValidationState;
  validateField: (field: keyof SignupFormData, value: string) => string | undefined;
  validatePasswordField: (password: string) => PasswordValidationResult;
  validationErrors: ValidationErrors;
  passwordValidation: PasswordValidationResult;
  isFormValid: (data: SignupFormData) => boolean;
  clearErrors: () => void;
}
