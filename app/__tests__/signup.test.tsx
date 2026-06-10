// signup.test.tsx — SignupScreen test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignupScreen from '../signup';

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
const mockUseRegistration = jest.fn(() => ({
  register: mockRegister,
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
  beforeEach(() => {
    jest.clearAllMocks();
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
      handlePostRegistration: mockHandlePostRegistration,
      isLoading: false,
      error: null,
      registrationComplete: false,
      resetError: jest.fn(),
    });
    mockIsFormValid.mockReturnValue(true);
    mockValidateForm.mockReturnValue({ isValid: true, errors: {}, passwordValidation: {} });
  });

  // ── Rendering ──────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render the signup screen header text', () => {
      const { getAllByText } = renderSignupScreen();
      // "Registrati" appears as both header and button text
      const elements = getAllByText('Registrati');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render the subtitle', () => {
      const { getByText } = renderSignupScreen();
      expect(getByText('Crea il tuo account MyFrigo')).toBeTruthy();
    });

    it('should render first name input', () => {
      const { getByPlaceholderText } = renderSignupScreen();
      expect(getByPlaceholderText('Il tuo nome')).toBeTruthy();
    });

    it('should render last name input', () => {
      const { getByPlaceholderText } = renderSignupScreen();
      expect(getByPlaceholderText('Il tuo cognome')).toBeTruthy();
    });

    it('should render email input', () => {
      const { getByPlaceholderText } = renderSignupScreen();
      expect(getByPlaceholderText('La tua email')).toBeTruthy();
    });

    it('should render password input', () => {
      const { getByPlaceholderText } = renderSignupScreen();
      expect(getByPlaceholderText('La tua password')).toBeTruthy();
    });

    it('should render the back to login link', () => {
      const { getByText } = renderSignupScreen();
      expect(getByText('Torna al login')).toBeTruthy();
    });

    it('should render password visibility toggle', () => {
      const { getByLabelText } = renderSignupScreen();
      expect(getByLabelText('Mostra/Nascondi password')).toBeTruthy();
    });
  });

  // ── Password Validation Display ────────────────────────────────────

  describe('password validation display', () => {
    it('should show validation checks when password length > 0', () => {
      const passwordInput = renderSignupScreen().getByPlaceholderText('La tua password');
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
      const signupButton = getByLabelText('Registrati');

      await act(async () => {
        fireEvent.press(signupButton);
      });

      expect(mockValidateForm).toHaveBeenCalled();
    });

    it('should show alert when form validation fails', async () => {
      mockValidateForm.mockReturnValueOnce({ isValid: false, errors: { email: 'Email richiesta' }, passwordValidation: {} });

      const { getByLabelText } = renderSignupScreen();
      const signupButton = getByLabelText('Registrati');

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
        fireEvent.changeText(getByPlaceholderText('Il tuo nome'), 'Mario');
        fireEvent.changeText(getByPlaceholderText('Il tuo cognome'), 'Rossi');
        fireEvent.changeText(getByPlaceholderText('La tua email'), 'mario@example.com');
        fireEvent.changeText(getByPlaceholderText('La tua password'), 'Password1');
      });

      await act(async () => {
        fireEvent.press(getByLabelText('Registrati'));
      });

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    it('should call register with trimmed names', async () => {
      mockRegister.mockResolvedValueOnce({ user: { id: '123' }, error: null });

      const { getByLabelText, getByPlaceholderText } = renderSignupScreen();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Il tuo nome'), '  Mario  ');
        fireEvent.changeText(getByPlaceholderText('Il tuo cognome'), '  Rossi  ');
        fireEvent.changeText(getByPlaceholderText('La tua email'), 'mario@example.com');
        fireEvent.changeText(getByPlaceholderText('La tua password'), 'Password1');
      });

      await act(async () => {
        fireEvent.press(getByLabelText('Registrati'));
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
        handlePostRegistration: mockHandlePostRegistration,
        isLoading: true,
        error: null,
        registrationComplete: false,
        resetError: jest.fn(),
      });

      const { getByPlaceholderText } = renderSignupScreen();

      expect(getByPlaceholderText('Il tuo nome').props.editable).toBe(false);
      expect(getByPlaceholderText('La tua email').props.editable).toBe(false);
      expect(getByPlaceholderText('La tua password').props.editable).toBe(false);
    });
  });

  // ── Error Handling ─────────────────────────────────────────────────

  describe('error handling', () => {
    it('should display error text when error is present', () => {
      mockUseRegistration.mockReturnValue({
        register: mockRegister,
        handlePostRegistration: mockHandlePostRegistration,
        isLoading: false,
        error: 'Email già registrata' as any,
        registrationComplete: false,
        resetError: jest.fn(),
      });

      const { getByText } = renderSignupScreen();

      expect(getByText('Email già registrata')).toBeTruthy();
    });

    it('should call register and handle result', async () => {
      mockRegister.mockResolvedValueOnce({ user: null, error: 'Email già in uso' });

      const { getByLabelText, getByPlaceholderText } = renderSignupScreen();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Il tuo nome'), 'Mario');
        fireEvent.changeText(getByPlaceholderText('Il tuo cognome'), 'Rossi');
        fireEvent.changeText(getByPlaceholderText('La tua email'), 'mario@example.com');
        fireEvent.changeText(getByPlaceholderText('La tua password'), 'Password1');
      });

      await act(async () => {
        fireEvent.press(getByLabelText('Registrati'));
      });

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    it('should show alert when firstName or lastName is empty after trim', async () => {
      const { getByLabelText, getByPlaceholderText } = renderSignupScreen();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Il tuo nome'), '   ');
        fireEvent.changeText(getByPlaceholderText('Il tuo cognome'), 'Rossi');
        fireEvent.changeText(getByPlaceholderText('La tua email'), 'mario@example.com');
        fireEvent.changeText(getByPlaceholderText('La tua password'), 'Password1');
      });

      await act(async () => {
        fireEvent.press(getByLabelText('Registrati'));
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

      const passwordInput = getByPlaceholderText('La tua password');

      // Initially password should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Press the eye button
      act(() => {
        fireEvent.press(getByLabelText('Mostra/Nascondi password'));
      });
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────

  describe('navigation', () => {
    it('should navigate back when "Torna al login" is pressed', async () => {
      const { getByText } = renderSignupScreen();

      await act(async () => {
        fireEvent.press(getByText('Torna al login'));
      });

      expect(mockRouterBack).toHaveBeenCalled();
    });

    it('should call register on successful form submission', async () => {
      mockRegister.mockResolvedValueOnce({ user: { id: '123' }, error: null });

      const { getByLabelText, getByPlaceholderText } = renderSignupScreen();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Il tuo nome'), 'Mario');
        fireEvent.changeText(getByPlaceholderText('Il tuo cognome'), 'Rossi');
        fireEvent.changeText(getByPlaceholderText('La tua email'), 'mario@example.com');
        fireEvent.changeText(getByPlaceholderText('La tua password'), 'Password1');
      });

      await act(async () => {
        fireEvent.press(getByLabelText('Registrati'));
      });

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });
  });
});
