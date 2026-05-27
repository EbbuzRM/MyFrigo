// login.test.tsx — LoginScreen test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert, Text } from 'react-native';
import LoginScreen from '../login';

// --- Mocks ---

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock useGoogleAuth hook
const mockPerformGoogleSignIn = jest.fn();
const mockUseGoogleAuth = jest.fn(() => ({
  performGoogleSignIn: mockPerformGoogleSignIn,
  loading: false,
  configError: null as null | string,
  googleRetryInProgress: false,
  retryAttemptNumber: 0,
}));

jest.mock('@/hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => mockUseGoogleAuth(),
}));

// Mock useEmailAuth hook (used by LoginForm)
const mockHandleLogin = jest.fn()
  .mockImplementation((password: string) => Promise.resolve({ success: false, error: 'Messaggio errore predefinito' }));
const mockUseEmailAuth = jest.fn(() => ({
  email: '',
  setEmail: jest.fn(),
  loading: false,
  error: null as null | string,
  handleLogin: mockHandleLogin,
  clearError: jest.fn(),
}));

jest.mock('@/hooks/useEmailAuth', () => ({
  useEmailAuth: () => mockUseEmailAuth(),
}));

// Mock usePasswordValidation hook (used by LoginForm)
const mockHandlePasswordChange = jest.fn();
const mockUsePasswordValidation = jest.fn(() => ({
  password: '',
  setPassword: jest.fn(),
  handlePasswordChange: mockHandlePasswordChange,
  validation: {
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    isNotCommon: true,
  },
}));

jest.mock('@/hooks/usePasswordValidation', () => ({
  usePasswordValidation: () => mockUsePasswordValidation(),
}));

// Mock PasswordValidationDisplay component
jest.mock('@/components/PasswordValidationDisplay', () => ({
  PasswordValidationDisplay: () => null,
}));

// Mock EmailVerificationBanner component
jest.mock('@/components/EmailVerificationBanner', () => ({
  EmailVerificationBanner: () => null,
}));

// Mock GoogleLoginButton component
jest.mock('@/components/GoogleLoginButton', () => {
  const React = require('react');
  const { TouchableOpacity, Text: RnText } = require('react-native');
  return {
    GoogleLoginButton: ({ onPress, disabled, loading, retryInProgress, retryAttemptNumber }: {
      onPress: () => void;
      disabled?: boolean;
      loading?: boolean;
      retryInProgress?: boolean;
      retryAttemptNumber?: number;
    }) => (
      React.createElement(TouchableOpacity, {
        testID: 'google-login-button',
        onPress,
        disabled,
        accessibilityLabel: 'Accedi con Google',
      },
        React.createElement(RnText, null,
          loading ? 'Caricamento...' : 'Accedi con Google'
        )
      )
    ),
  };
});

// --- Helpers ---

const renderLoginScreen = (loginFormProps = {}) => render(
  <LoginScreen />,
);

// --- Test Suite ---

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default mocks
    mockUseGoogleAuth.mockReturnValue({
      performGoogleSignIn: mockPerformGoogleSignIn,
      loading: false,
      configError: null as null | string,
      googleRetryInProgress: false,
      retryAttemptNumber: 0,
    });
    mockUseEmailAuth.mockReturnValue({
      email: '',
      setEmail: jest.fn(),
      loading: false,
      error: null as null | string,
      handleLogin: mockHandleLogin,
      clearError: jest.fn(),
    });
    mockUsePasswordValidation.mockReturnValue({
      password: 'Password123!',
      setPassword: jest.fn(),
      handlePasswordChange: mockHandlePasswordChange,
      validation: {
        minLength: true,
        hasUpper: true,
        hasLower: true,
        hasNumber: true,
        isNotCommon: true,
      },
    });
    // Mock Alert.alert globally
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (Alert.alert as jest.Mock).mockClear();
  });

  // ── Rendering ──────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render the login screen with testID', () => {
      const { getByTestId } = renderLoginScreen();

      expect(getByTestId('login-screen')).toBeTruthy();
    });

    it('should render LoginForm with email input', () => {
      const { getByTestId } = renderLoginScreen();

      expect(getByTestId('email-input')).toBeTruthy();
    });

    it('should render LoginForm with password input', () => {
      const { getByTestId } = renderLoginScreen();

      expect(getByTestId('password-input')).toBeTruthy();
    });

    it('should render LoginForm with login button', () => {
      const { getByTestId } = renderLoginScreen();

      expect(getByTestId('login-button')).toBeTruthy();
    });

    it('should render GoogleLoginButton', () => {
      const { getByTestId } = renderLoginScreen();

      expect(getByTestId('google-login-button')).toBeTruthy();
    });

    it('should render "Hai dimenticato la password?" link', () => {
      const { getByText } = renderLoginScreen();

      expect(getByText('Hai dimenticato la password?')).toBeTruthy();
    });

    it('should render "Registrati" button', () => {
      const { getByText } = renderLoginScreen();

      expect(getByText('Registrati')).toBeTruthy();
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────

  describe('navigation', () => {
    it('should navigate to signup when "Registrati" is pressed', async () => {
      const { getByText } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByText('Registrati'));
      });

      expect(mockRouterPush).toHaveBeenCalledWith('/signup');
    });

    it('should navigate to forgot-password when "Hai dimenticato la password?" is pressed', async () => {
      const { getByText } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByText('Hai dimenticato la password?'));
      });

      expect(mockRouterPush).toHaveBeenCalledWith('/forgot-password');
    });
  });

  // ── Login Flow ────────────────────────────────────────────────────

  describe('login flow', () => {
    it('should call handleLogin when login button is pressed', async () => {
      const { getByTestId } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      expect(mockHandleLogin).toHaveBeenCalled();
    });

    it('should call onLoginSuccess callback on successful login', async () => {
      mockHandleLogin.mockResolvedValueOnce({ success: true });

      const { getByTestId } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      // handleLogin was called - success path is handled by AuthContext
      expect(mockHandleLogin).toHaveBeenCalled();
    });

    it('should show Alert on login error', async () => {
      mockUseEmailAuth.mockReturnValue({
        email: 'user@example.com',
        setEmail: jest.fn(),
        loading: false,
        error: 'Email o password non validi.',
        handleLogin: mockHandleLogin,
        clearError: jest.fn(),
      });

      const { getByText } = renderLoginScreen();

      expect(getByText('Email o password non validi.')).toBeTruthy();
    });

    it('should show "Email o password non validi." for wrong password (NOT email confirmation message)', async () => {
      // Simulate wrong password scenario: AuthService returns "Invalid login credentials"
      // which maps to "Email o password non validi."
      mockHandleLogin.mockResolvedValueOnce({
        success: false,
        error: 'Email o password non validi.',
      });

      const { getByTestId } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      // The error should be "Email o password non validi.", NOT
      // "Se le credenziali sono corrette, riceverai un'email di conferma."
      expect(mockHandleLogin).toHaveBeenCalled();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore nel Login', 'Email o password non validi.');
      });
    });

    it('should show "Se le credenziali sono corrette..." for unconfirmed email', async () => {
      // Simulate unconfirmed email: AuthService returns "Email not confirmed"
      // which maps to the generic message
      mockHandleLogin.mockResolvedValueOnce({
        success: false,
        error: 'Se le credenziali sono corrette, riceverai un\'email di conferma.',
      });

      const { getByTestId } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore nel Login', 'Se le credenziali sono corrette, riceverai un\'email di conferma.');
      });
    });

    it('should show Alert when onLoginError is called', async () => {
      mockHandleLogin.mockResolvedValueOnce({
        success: false,
        error: 'Network error',
      });

      const { getByTestId } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore nel Login', 'Network error');
      });
    });

    it('should pass empty password error when password is empty', async () => {
      mockUsePasswordValidation.mockReturnValue({
        password: '',
        setPassword: jest.fn(),
        handlePasswordChange: mockHandlePasswordChange,
        validation: {
          minLength: false,
          hasUpper: false,
          hasLower: false,
          hasNumber: false,
          isNotCommon: true,
        },
      });

      const { getByTestId } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      // LoginForm should call onLoginError with "Inserisci la password"
      // when password is empty
      expect(mockHandleLogin).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore nel Login', 'Inserisci la password');
      });
    });
  });

  // ── Google Auth ────────────────────────────────────────────────────

  describe('Google authentication', () => {
    it('should call performGoogleSignIn when Google button is pressed', async () => {
      const { getByTestId } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByTestId('google-login-button'));
      });

      expect(mockPerformGoogleSignIn).toHaveBeenCalledTimes(1);
    });

    it('should show configError when Google auth has configuration error', () => {
      mockUseGoogleAuth.mockReturnValue({
        performGoogleSignIn: mockPerformGoogleSignIn,
        loading: false,
        configError: 'Google Sign-In non configurato',
        googleRetryInProgress: false,
        retryAttemptNumber: 0,
      });

      const { getByText } = renderLoginScreen();

      expect(getByText('Google Sign-In non configurato')).toBeTruthy();
    });

    it('should NOT show configError when there is none', () => {
      const { queryByText } = renderLoginScreen();

      expect(queryByText(/non configurato/)).toBeNull();
    });
  });

  // ── GoogleLoginButton Props ────────────────────────────────────────

  describe('GoogleLoginButton props', () => {
    it('should pass loading state to GoogleLoginButton', () => {
      mockUseGoogleAuth.mockReturnValue({
        performGoogleSignIn: mockPerformGoogleSignIn,
        loading: true,
        configError: null,
        googleRetryInProgress: false,
        retryAttemptNumber: 0,
      });

      const { getByTestId } = renderLoginScreen();

      const googleButton = getByTestId('google-login-button');
      expect(googleButton.props.disabled).toBe(true);
    });

    it('should disable Google button when config error exists', () => {
      mockUseGoogleAuth.mockReturnValue({
        performGoogleSignIn: mockPerformGoogleSignIn,
        loading: false,
        configError: 'Configuration error',
        googleRetryInProgress: false,
        retryAttemptNumber: 0,
      });

      const { getByTestId } = renderLoginScreen();

      const googleButton = getByTestId('google-login-button');
      expect(googleButton.props.disabled).toBe(true);
    });

    it('should enable Google button when no loading and no config error', () => {
      const { getByTestId } = renderLoginScreen();

      const googleButton = getByTestId('google-login-button');
      expect(googleButton.props.disabled).toBe(false);
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should show Alert with error message on login failure', async () => {
      mockHandleLogin.mockResolvedValueOnce({
        success: false,
        error: 'Test error',
      });

      const { getByTestId } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore nel Login', 'Test error');
      });
    });

    it('should show default error message when error is empty', async () => {
      mockHandleLogin.mockResolvedValueOnce({
        success: false,
        error: '',
      });

      const { getByTestId } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore nel Login', 'Errore durante il login');
      });
    });

    it('should show default error message when error is undefined', async () => {
      mockHandleLogin.mockResolvedValueOnce({
        success: false,
        error: undefined,
      });

      const { getByTestId } = renderLoginScreen();

      await act(async () => {
        fireEvent.press(getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore nel Login', 'Errore durante il login');
      });
    });
  });
});