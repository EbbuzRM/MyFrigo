// useSignupValidation.test.ts — useSignupValidation test module.
//
// exports: none
// used_by: none
// rules: none

import { renderHook, act } from '@testing-library/react-native';
import { useSignupValidation } from '../useSignupValidation';
import { SignupFormData, ValidationState } from '../useSignupValidation.types'; import { PasswordValidationResult } from '@/utils/authValidation';

// Mock the AUTH_CONSTANTS used by useSignupValidators
jest.mock('@/constants/auth', () => ({
  AUTH_CONSTANTS: {
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 1,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    ERRORS: {
      MISSING_FIELDS: 'Completa tutti i campi richiesti',
      MISSING_NAMES: 'Per favore, inserisci nome e cognome',
      EMAIL_CHECK_FAILED: "Errore durante la verifica dell'email.",
      REGISTRATION_FAILED: 'Registrazione fallita',
      UNKNOWN_ERROR: 'Errore sconosciuto',
    },
    ALERT_TITLES: {
      MISSING_DATA: 'Dati Mancanti',
      EMAIL_EXISTS: 'Email già registrata',
      REGISTRATION_COMPLETE: 'Registrazione Completata',
      REGISTRATION_ERROR: 'Errore di Registrazione',
    },
    ALERT_MESSAGES: {
      EMAIL_EXISTS: 'Questo indirizzo email è già in uso.',
      REGISTRATION_SUCCESS: 'Registrazione completata con successo',
      OK_BUTTON: 'OK',
    },
    PASSWORD_VALIDATION: {
      MIN_LENGTH: 'Almeno 8 caratteri',
      HAS_UPPER: 'Una lettera maiuscola',
      HAS_LOWER: 'Una lettera minuscola',
      HAS_NUMBER: 'Un numero',
    },
  },
}));

// Mock authValidation
jest.mock('@/utils/authValidation', () => ({
  validatePassword: jest.fn((password: string) => ({
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    isNotCommon: ['password', '12345678'].includes(password.toLowerCase()),
  })),
  isPasswordValid: jest.fn((password: string) => {
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLength && hasUpper && hasLower && hasNumber;
  }),
  PasswordValidationResult: {},
}));

const validFormData: SignupFormData = {
  email: 'test@example.com',
  password: 'Test1234',
  firstName: 'Mario',
  lastName: 'Rossi',
};

describe('useSignupValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty errors and default password validation', () => {
      const { result } = renderHook(() => useSignupValidation());

      expect(result.current.validationErrors).toEqual({});
      expect(result.current.passwordValidation).toEqual({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        isNotCommon: false,
      });
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useSignupValidation());

      expect(typeof result.current.validateForm).toBe('function');
      expect(typeof result.current.validateField).toBe('function');
      expect(typeof result.current.validatePasswordField).toBe('function');
      expect(typeof result.current.isFormValid).toBe('function');
      expect(typeof result.current.clearErrors).toBe('function');
    });
  });

  describe('validateField', () => {
    it('should return error for empty email', () => {
      const { result } = renderHook(() => useSignupValidation());

      const error = result.current.validateField('email', '');

      expect(error).toBe('Email richiesta');
    });

    it('should return error for invalid email format', () => {
      const { result } = renderHook(() => useSignupValidation());

      const error = result.current.validateField('email', 'not-an-email');

      expect(error).toBe('Formato email non valido');
    });

    it('should return undefined for valid email', () => {
      const { result } = renderHook(() => useSignupValidation());

      const error = result.current.validateField('email', 'test@example.com');

      expect(error).toBeUndefined();
    });

    it('should return error for empty firstName', () => {
      const { result } = renderHook(() => useSignupValidation());

      const error = result.current.validateField('firstName', '');

      expect(error).toBe('Nome richiesto');
    });

    it('should return error for empty lastName', () => {
      const { result } = renderHook(() => useSignupValidation());

      const error = result.current.validateField('lastName', '');

      expect(error).toBe('Cognome richiesto');
    });

    it('should return undefined for valid firstName', () => {
      const { result } = renderHook(() => useSignupValidation());

      const error = result.current.validateField('firstName', 'Mario');

      expect(error).toBeUndefined();
    });

    it('should update passwordValidation when validating password field', () => {
      const { result } = renderHook(() => useSignupValidation());

      act(() => {
        result.current.validateField('password', 'Test1234');
      });

      expect(result.current.passwordValidation.minLength).toBe(true);
      expect(result.current.passwordValidation.hasUpper).toBe(true);
      expect(result.current.passwordValidation.hasLower).toBe(true);
      expect(result.current.passwordValidation.hasNumber).toBe(true);
    });
  });

  describe('validatePasswordField', () => {
    it('should validate a strong password correctly', () => {
      const { result } = renderHook(() => useSignupValidation());

      let validation!: PasswordValidationResult;
      act(() => {
        validation = result.current.validatePasswordField('StrongPass1');
      });

      expect(validation.minLength).toBe(true);
      expect(validation.hasUpper).toBe(true);
      expect(validation.hasLower).toBe(true);
      expect(validation.hasNumber).toBe(true);
    });

    it('should detect missing uppercase', () => {
      const { result } = renderHook(() => useSignupValidation());

      let validation!: PasswordValidationResult;
      act(() => {
        validation = result.current.validatePasswordField('weakpass1');
      });

      expect(validation.hasUpper).toBe(false);
      expect(validation.hasLower).toBe(true);
      expect(validation.hasNumber).toBe(true);
    });

    it('should detect missing number', () => {
      const { result } = renderHook(() => useSignupValidation());

      let validation!: PasswordValidationResult;
      act(() => {
        validation = result.current.validatePasswordField('WeakPass');
      });

      expect(validation.hasNumber).toBe(false);
    });

    it('should detect too short password', () => {
      const { result } = renderHook(() => useSignupValidation());

      let validation!: PasswordValidationResult;
      act(() => {
        validation = result.current.validatePasswordField('Sh1');
      });

      expect(validation.minLength).toBe(false);
    });
  });

  describe('validateForm', () => {
    it('should return valid for complete and correct form data', () => {
      const { result } = renderHook(() => useSignupValidation());

      let state!: ValidationState;
      act(() => {
        state = result.current.validateForm(validFormData);
      });

      expect(state.isValid).toBe(true);
      expect(state.errors).toEqual({});
      expect(state.passwordValidation.minLength).toBe(true);
    });

    it('should return invalid for empty form data', () => {
      const { result } = renderHook(() => useSignupValidation());

      let state!: ValidationState;
      act(() => {
        state = result.current.validateForm({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
        });
      });

      expect(state.isValid).toBe(false);
      expect(state.errors.email).toBe('Email richiesta');
      expect(state.errors.firstName).toBe('Nome richiesto');
      expect(state.errors.lastName).toBe('Cognome richiesto');
    });

    it('should return invalid for weak password', () => {
      const { result } = renderHook(() => useSignupValidation());

      let state!: ValidationState;
      act(() => {
        state = result.current.validateForm({
          ...validFormData,
          password: 'weak',
        });
      });

      expect(state.isValid).toBe(false);
      expect(state.errors.password).toContain('almeno 8 caratteri');
      expect(state.errors.password).toContain('una maiuscola');
      expect(state.errors.password).toContain('un numero');
    });

    it('should set validation errors in state', () => {
      const { result } = renderHook(() => useSignupValidation());

      act(() => {
        result.current.validateForm({
          email: 'invalid',
          password: '',
          firstName: '',
          lastName: '',
        });
      });

      expect(result.current.validationErrors.email).toBeDefined();
      expect(result.current.validationErrors.firstName).toBeDefined();
      expect(result.current.validationErrors.lastName).toBeDefined();
    });
  });

  describe('clearErrors', () => {
    it('should clear all validation errors', () => {
      const { result } = renderHook(() => useSignupValidation());

      act(() => {
        result.current.validateForm({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
        });
      });

      expect(Object.keys(result.current.validationErrors).length).toBeGreaterThan(0);

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.validationErrors).toEqual({});
      expect(result.current.passwordValidation).toEqual({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        isNotCommon: false,
      });
    });
  });

  describe('isFormValid', () => {
    it('should return true for valid form data', () => {
      const { result } = renderHook(() => useSignupValidation());

      const isValid = result.current.isFormValid(validFormData);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid email', () => {
      const { result } = renderHook(() => useSignupValidation());

      const isValid = result.current.isFormValid({
        ...validFormData,
        email: 'invalid',
      });

      expect(isValid).toBe(false);
    });

    it('should return false for weak password', () => {
      const { result } = renderHook(() => useSignupValidation());

      const isValid = result.current.isFormValid({
        ...validFormData,
        password: 'weak',
      });

      expect(isValid).toBe(false);
    });

    it('should return false for missing names', () => {
      const { result } = renderHook(() => useSignupValidation());

      const isValid = result.current.isFormValid({
        ...validFormData,
        firstName: '',
        lastName: '',
      });

      expect(isValid).toBe(false);
    });
  });
});
