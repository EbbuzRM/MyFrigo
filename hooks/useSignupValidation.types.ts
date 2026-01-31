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
