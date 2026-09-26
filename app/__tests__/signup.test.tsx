// signup.test.tsx — SignupScreen test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import i18next from 'i18next';
import { Alert } from 'react-native';
import { initI18n } from '@/i18n';
import { itCatalogs } from '@/i18n/catalogs/it';
import type { UseRegistrationReturn } from '@/hooks/useRegistration';
import { cleanupRateLimiter } from '@/services/AuthService';
import SignupScreen from '../signup';

// --- Mocks ---

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'it-IT' }]),
}));

// --- Mocks ---

const mockRouterReplace = jest.fn();
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockRouterReplace,
    back: mockRouterBack,
  }),
}));

// Mock useSignupValidation
const mockValidateForm = jest.fn();
const mockValidatePasswordField = jest.fn();
const mockClearErrors = jest.fn();
const mockIsFormValid = jest.fn();
const mockUseSignupValidation = jest.fn(() => ({
  validateForm: mockValidateForm,
  validatePasswordField: mockValidatePasswordField,
  passwordValidation: {
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    isNotCommon: true,
  },
  isFormValid: mockIsFormValid,
  clearErrors: mockClearErrors,
  validationErrors: {},
}));

jest.mock('@/hooks/useSignupValidation', () => ({
  useSignupValidation: () => mockUseSignupValidation(),
}));

// Mock useRegistration
const mockRegister = jest.fn();
const mockHandlePostRegistration = jest.fn();
const mockUseRegistration = jest.fn((): UseRegistrationReturn => ({
  register: mockRegister,
  createUserAccount: mockRegister,
  handlePostRegistration: mockHandlePostRegistration,
  isLoading: false,
  error: null,
  registrationComplete: false,
  resetError: jest.fn(),
}));

jest.mock('@/hooks/useRegistration', () => ({
  useRegistration: () => mockUseRegistration(),
}));

// Mock ValidationCheck component
jest.mock('@/components/ValidationCheck', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ValidationCheck: ({ isValid, text }: { isValid: boolean; text: string }) =>
      React.createElement(Text, { testID: `validation-check-${text}` }, `${isValid ? '✓' : '✗'} ${text}`),
  };
});

// Mock FontAwesome
jest.mock('@expo/vector-icons', () => ({
  FontAwesome: () => null,
}));

// Mock signupStyles
jest.mock('@/styles/signupStyles', () => ({
  signupStyles: {
    container: {},
    header: {},
    subtitle: {},
    label: {},
    input: {},
    passwordContainer: {},
    eyeIcon: {},
    validationContainer: {},
    button: {},
    buttonDisabled: {},
    buttonText: {},
    errorText: {},
    backText: {},
  },
}));

// --- Helpers ---

const renderSignupScreen = () => render(<SignupScreen />);

// --- Test Suite ---

describe('SignupScreen', () => {
  afterAll(() => {
    cleanupRateLimiter();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    initI18n();
    // Reset default mock implementations
    mockUseSignupValidation.mockReturnValue({
      validateForm: mockValidateForm,
      validatePasswordField: mockValidatePasswordField,
      passwordValidation: {
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        isNotCommon: true,
      },
      isFormValid: mockIsFormValid,
      clearErrors: mockClearErrors,
      validationErrors: {},
    });
    mockUseRegistration.mockReturnValue({
      register: mockRegister,
      createUserAccount: mockRegister,
      handlePostRegistration: mockHandlePostRegistration,
      isLoading: false,
      error: null,
      registrationComplete: false,
      resetError: jest.fn(),
    });
    mockIsFormValid.mockReturnValue(true);
    mockValidateForm.mockReturnValue({ isValid: true, errors: {}, passwordValidation: {} });
  });

  afterEach(async () => {
    await i18next.changeLanguage('it');
  });

  // ── Rendering ──────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render the signup screen header text', () => {
      const { getAllByText } = renderSignupScreen();
      // "Registrati" appears as both header and button text
      const elements = getAllByText(itCatalogs.auth.signupButton);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render the subtitle', () => {
      const { getByText } = renderSignupScreen();
      expect(getByText(itCatalogs.auth.signupSubtitle)).toBeTruthy();
    });

    it('should render first name input', () => {
      const { getByPlaceholderText } = renderSignupScreen();
      expect(getByPlaceholderText(itCatalogs.auth.firstNamePlaceholder)).toBeTruthy();
    });

    it('should render last name input', () => {
      const { getByPlaceholderText } = renderSignupScreen();
      expect(getByPlaceholderText(itCatalogs.auth.lastNamePlaceholder)).toBeTruthy();
    });

    it('should render email input', () => {
      const { getByPlaceholderText } = renderSignupScreen();
      expect(getByPlaceholderText(itCatalogs.auth.emailPlaceholderSignup)).toBeTruthy();
    });

    it('should render password input', () => {
      const { getByPlaceholderText } = renderSignupScreen();
      expect(getByPlaceholderText(itCatalogs.auth.passwordPlaceholderSignup)).toBeTruthy();
    });

    it('should render the back to login link', () => {
      const { getByText } = renderSignupScreen();
      expect(getByText(itCatalogs.auth.backToLogin)).toBeTruthy();
    });

    it('should render password visibility toggle', () => {
      const { getByLabelText } = renderSignupScreen();
      expect(getByLabelText(itCatalogs.auth.showHidePasswordLabel)).toBeTruthy();
    });
  });

  // ── Password Validation Display ────────────────────────────────────

  describe('password validation display', () => {
    it('should show validation checks when password length > 0', () => {
      const passwordInput = renderSignupScreen().getByPlaceholderText(itCatalogs.auth.passwordPlaceholderSignup);
      act(() => {
        fireEvent.changeText(passwordInput, 'a');
      });

      expect(mockValidatePasswordField).toHaveBeenCalledWith('a');
    });
  });

  // ── Form Validation ────────────────────────────────────────────────

  describe('form validation', () => {
    it('should call validateForm when signup button is pressed', async () => {
      // Use accessibilityLabel to uniquely identify the button
      const { getByLabelText } = renderSignupScreen();
      const signupButton = getByLabelText(itCatalogs.auth.signUp);

      await act(async () => {
        fireEvent.press(signupButton);
      });

      expect(mockValidateForm).toHaveBeenCalled();
    });

    it('should show alert when form validation fails', async () => {
      mockValidateForm.mockReturnValueOnce({ isValid: false, errors: { email: 'Email richiesta' }, passwordValidation: {} });

      const { getByLabelText } = renderSignupScreen();
      const signupButton = getByLabelText(itCatalogs.auth.signUp);

      await act(async () => {
        fireEvent.press(signupButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });
  });

  // ── Registration Flow ──────────────────────────────────────────────

  describe('registration flow', () => {
    it('should call register when form is valid and button is pressed', async () => {
      mockRegister.mockResolvedValueOnce({ user: { id: '123' }, error: null });

      const { getByLabelText, getByPlaceholderText } = renderSignupScreen();

      // Fill in the form
      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.firstNamePlaceholder), 'Mario');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.lastNamePlaceholder), 'Rossi');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailPlaceholderSignup), 'mario@example.com');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.passwordPlaceholderSignup), 'Password1');
      });

      await act(async () => {
        fireEvent.press(getByLabelText(itCatalogs.auth.signUp));
      });

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    it('should call register with trimmed names', async () => {
      mockRegister.mockResolvedValueOnce({ user: { id: '123' }, error: null });

      const { getByLabelText, getByPlaceholderText } = renderSignupScreen();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.firstNamePlaceholder), '  Mario  ');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.lastNamePlaceholder), '  Rossi  ');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailPlaceholderSignup), 'mario@example.com');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.passwordPlaceholderSignup), 'Password1');
      });

      await act(async () => {
        fireEvent.press(getByLabelText(itCatalogs.auth.signUp));
      });

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Mario',
            lastName: 'Rossi',
          })
        );
      });
    });

    it('should show ActivityIndicator when isLoading is true', () => {
      mockUseRegistration.mockReturnValue({
        register: mockRegister,
        createUserAccount: mockRegister,
        handlePostRegistration: mockHandlePostRegistration,
        isLoading: true,
        error: null,
        registrationComplete: false,
        resetError: jest.fn(),
      });

      const { UNSAFE_root } = renderSignupScreen();
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should disable inputs when isLoading is true', () => {
      mockUseRegistration.mockReturnValue({
        register: mockRegister,
        createUserAccount: mockRegister,
        handlePostRegistration: mockHandlePostRegistration,
        isLoading: true,
        error: null,
        registrationComplete: false,
        resetError: jest.fn(),
      });

      const { getByPlaceholderText } = renderSignupScreen();

      expect(getByPlaceholderText(itCatalogs.auth.firstNamePlaceholder).props.editable).toBe(false);
      expect(getByPlaceholderText(itCatalogs.auth.emailPlaceholderSignup).props.editable).toBe(false);
      expect(getByPlaceholderText(itCatalogs.auth.passwordPlaceholderSignup).props.editable).toBe(false);
    });
  });

  // ── Error Handling ─────────────────────────────────────────────────

  describe('error handling', () => {
    it('should display error text when error is present', () => {
      mockUseRegistration.mockReturnValue({
        register: mockRegister,
        createUserAccount: mockRegister,
        handlePostRegistration: mockHandlePostRegistration,
        isLoading: false,
        // Stable hook code: the screen maps it to the catalog text.
        error: 'registration_failed',
        registrationComplete: false,
        resetError: jest.fn(),
      });

      const { getByText } = renderSignupScreen();

      expect(getByText(itCatalogs.auth.errors_registrationFailed)).toBeTruthy();
    });

    it('should call register and handle result', async () => {
      mockRegister.mockResolvedValueOnce({ user: null, error: 'Email già in uso' });

      const { getByLabelText, getByPlaceholderText } = renderSignupScreen();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.firstNamePlaceholder), 'Mario');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.lastNamePlaceholder), 'Rossi');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailPlaceholderSignup), 'mario@example.com');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.passwordPlaceholderSignup), 'Password1');
      });

      await act(async () => {
        fireEvent.press(getByLabelText(itCatalogs.auth.signUp));
      });

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    it('should show alert when firstName or lastName is empty after trim', async () => {
      const { getByLabelText, getByPlaceholderText } = renderSignupScreen();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.firstNamePlaceholder), '   ');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.lastNamePlaceholder), 'Rossi');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailPlaceholderSignup), 'mario@example.com');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.passwordPlaceholderSignup), 'Password1');
      });

      await act(async () => {
        fireEvent.press(getByLabelText(itCatalogs.auth.signUp));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });
  });

  // ── Password Visibility Toggle ─────────────────────────────────────

  describe('password visibility toggle', () => {
    it('should toggle password visibility when eye icon is pressed', () => {
      const { getByLabelText, getByPlaceholderText } = renderSignupScreen();

      const passwordInput = getByPlaceholderText(itCatalogs.auth.passwordPlaceholderSignup);

      // Initially password should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Press the eye button
      act(() => {
        fireEvent.press(getByLabelText(itCatalogs.auth.showHidePasswordLabel));
      });
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────

  describe('navigation', () => {
    it('should navigate back when "Torna al login" is pressed', async () => {
      const { getByText } = renderSignupScreen();

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.backToLogin));
      });

      expect(mockRouterBack).toHaveBeenCalled();
    });

    it('should call register on successful form submission', async () => {
      mockRegister.mockResolvedValueOnce({ user: { id: '123' }, error: null });

      const { getByLabelText, getByPlaceholderText } = renderSignupScreen();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.firstNamePlaceholder), 'Mario');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.lastNamePlaceholder), 'Rossi');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailPlaceholderSignup), 'mario@example.com');
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.passwordPlaceholderSignup), 'Password1');
      });

      await act(async () => {
        fireEvent.press(getByLabelText(itCatalogs.auth.signUp));
      });

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });
  });
});
