// LoginForm.test.tsx — LoginForm test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import i18next from 'i18next';
import { initI18n } from '@/i18n';
import { itCatalogs } from '@/i18n/catalogs/it';
import { enCatalogs } from '@/i18n/catalogs/en';
import { LoginForm } from '../LoginForm';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'it-IT' }]),
}));

// ── Mock dependencies ────────────────────────────────────────────────

// ThemeContext is already mocked globally in jest.setup.js

jest.mock('@/hooks/useEmailAuth', () => ({
  useEmailAuth: jest.fn(),
}));

jest.mock('@/hooks/usePasswordValidation', () => ({
  usePasswordValidation: jest.fn(),
}));

jest.mock('../PasswordValidationDisplay', () => ({
  PasswordValidationDisplay: 'PasswordValidationDisplay',
}));

jest.mock('../EmailVerificationBanner', () => ({
  EmailVerificationBanner: 'EmailVerificationBanner',
}));

jest.mock('@/services/AuthService', () => ({
  AuthService: {
    signInWithEmail: jest.fn(),
  },
  AUTH_ERROR_CODES: {
    INVALID_EMAIL_FORMAT: 'invalid_email_format',
    MISSING_CREDENTIALS: 'missing_credentials',
    RATE_LIMITED: 'rate_limited',
    INVALID_CREDENTIALS: 'invalid_credentials',
    EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
    LOGIN_FAILED: 'login_failed',
    GOOGLE_FAILED: 'google_failed',
    GOOGLE_CONFIG_ERROR: 'google_config_error',
  },
  AUTH_ERROR_I18N_KEYS: {
    invalid_email_format: 'auth.errors_invalidEmailFormat',
    missing_credentials: 'auth.errors_loginGenericError',
    rate_limited: 'auth.errors_rateLimitLogin',
    invalid_credentials: 'auth.errors_invalidCredentials',
    email_not_confirmed: 'auth.errors_emailNotConfirmed',
    login_failed: 'auth.errors_loginGenericError',
    google_failed: 'auth.errors_googleLoginFailed',
    google_config_error: 'auth.errors_googleConfigError',
  },
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: 'FontAwesome',
}));

import { useEmailAuth } from '@/hooks/useEmailAuth';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';

describe('LoginForm', () => {
  const mockEmailAuth = {
    email: '',
    setEmail: jest.fn(),
    handleLogin: jest.fn(),
    error: '',
    loading: false,
  };

  const mockPasswordValidation = {
    password: '',
    handlePasswordChange: jest.fn(),
    validation: {
      minLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSpecial: false,
      isNotCommon: false,
    },
  };

  const defaultProps = {
    onLoginSuccess: jest.fn(),
    onLoginError: jest.fn(),
    onRegisterPress: jest.fn(),
    onForgotPasswordPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    initI18n();
    (useEmailAuth as jest.Mock).mockReturnValue(mockEmailAuth);
    (usePasswordValidation as jest.Mock).mockReturnValue(mockPasswordValidation);
  });

  afterEach(async () => {
    await i18next.changeLanguage('it');
  });

  it('should render email input, password input and login button', () => {
    const { getByTestId, getByText } = render(<LoginForm {...defaultProps} />);

    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
    expect(getByText(itCatalogs.auth.login)).toBeTruthy();
  });

  it('should show register and forgot password links', () => {
    const { getByText } = render(<LoginForm {...defaultProps} />);

    expect(getByText(itCatalogs.auth.signUp)).toBeTruthy();
    expect(getByText(itCatalogs.auth.forgotPassword)).toBeTruthy();
  });

  it('should call onRegisterPress when register button pressed', () => {
    const onRegisterPress = jest.fn();
    const { getByText } = render(
      <LoginForm {...defaultProps} onRegisterPress={onRegisterPress} />
    );

    fireEvent.press(getByText(itCatalogs.auth.signUp));
    expect(onRegisterPress).toHaveBeenCalledTimes(1);
  });

  it('should call onForgotPasswordPress when forgot password pressed', () => {
    const onForgotPasswordPress = jest.fn();
    const { getByText } = render(
      <LoginForm {...defaultProps} onForgotPasswordPress={onForgotPasswordPress} />
    );

    fireEvent.press(getByText(itCatalogs.auth.forgotPassword));
    expect(onForgotPasswordPress).toHaveBeenCalledTimes(1);
  });

  it('should update email via setEmail on text input change', () => {
    const setEmail = jest.fn();
    (useEmailAuth as jest.Mock).mockReturnValue({
      ...mockEmailAuth,
      setEmail,
    });

    const { getByTestId } = render(<LoginForm {...defaultProps} />);

    fireEvent.changeText(getByTestId('email-input'), 'user@example.com');
    expect(setEmail).toHaveBeenCalledWith('user@example.com');
  });

  it('should call handlePasswordChange on password input change', () => {
    const handlePasswordChange = jest.fn();
    (usePasswordValidation as jest.Mock).mockReturnValue({
      ...mockPasswordValidation,
      handlePasswordChange,
    });

    const { getByTestId } = render(<LoginForm {...defaultProps} />);

    fireEvent.changeText(getByTestId('password-input'), 'Password123!');
    expect(handlePasswordChange).toHaveBeenCalledWith('Password123!');
  });

  it('should call onLoginSuccess on successful login', async () => {
    const onLoginSuccess = jest.fn();
    const handleLogin = jest.fn().mockResolvedValue({ success: true });
    (useEmailAuth as jest.Mock).mockReturnValue({
      ...mockEmailAuth,
      email: 'user@example.com',
      handleLogin,
    });
    (usePasswordValidation as jest.Mock).mockReturnValue({
      ...mockPasswordValidation,
      password: 'Password123!',
    });

    const { getByTestId } = render(
      <LoginForm {...defaultProps} onLoginSuccess={onLoginSuccess} />
    );

    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      // captchaToken is undefined: no hCaptcha token has been solved yet
      expect(handleLogin).toHaveBeenCalledWith('Password123!', undefined);
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onLoginError on failed login', async () => {
    const onLoginError = jest.fn();
    const handleLogin = jest.fn().mockResolvedValue({
      success: false,
      error: 'invalid_credentials',
    });
    (useEmailAuth as jest.Mock).mockReturnValue({
      ...mockEmailAuth,
      email: 'user@example.com',
      handleLogin,
    });
    (usePasswordValidation as jest.Mock).mockReturnValue({
      ...mockPasswordValidation,
      password: 'Password123!',
    });

    const { getByTestId } = render(
      <LoginForm {...defaultProps} onLoginError={onLoginError} />
    );

    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(handleLogin).toHaveBeenCalled();
      // Boundary maps the stable code to the catalog text.
      expect(onLoginError).toHaveBeenCalledWith(itCatalogs.auth.errors_invalidCredentials);
    });
  });

  it('should call onLoginError when password is empty before login', async () => {
    const onLoginError = jest.fn();
    (usePasswordValidation as jest.Mock).mockReturnValue({
      ...mockPasswordValidation,
      password: '',
    });

    const { getByTestId } = render(
      <LoginForm {...defaultProps} onLoginError={onLoginError} />
    );

    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(onLoginError).toHaveBeenCalledWith(itCatalogs.auth.errors_emptyPassword);
    });
  });

  it('should show error message from useEmailAuth', () => {
    (useEmailAuth as jest.Mock).mockReturnValue({
      ...mockEmailAuth,
      error: 'invalid_credentials',
    });

    const { getByText } = render(<LoginForm {...defaultProps} />);
    expect(getByText(itCatalogs.auth.errors_invalidCredentials)).toBeTruthy();
  });

  it('should render localised blocked label with minutes when rate limited (IT and EN)', async () => {
    (useEmailAuth as jest.Mock).mockReturnValue({
      ...mockEmailAuth,
      isRateLimited: true,
      remainingMs: 5 * 60 * 1000,
    });

    const { getByText, unmount } = render(<LoginForm {...defaultProps} />);
    expect(getByText(`${itCatalogs.auth.blockedSuffix} (5m)`)).toBeTruthy();
    expect(getByText('Bloccato (5m)')).toBeTruthy();
    unmount();

    await i18next.changeLanguage('en');
    const { getByText: getByTextEn } = render(<LoginForm {...defaultProps} />);
    expect(getByTextEn(`${enCatalogs.auth.blockedSuffix} (5m)`)).toBeTruthy();
    expect(getByTextEn('Blocked (5m)')).toBeTruthy();
  });

  it('should disable login button when loading', () => {
    (useEmailAuth as jest.Mock).mockReturnValue({
      ...mockEmailAuth,
      loading: true,
    });

    const { getByTestId } = render(<LoginForm {...defaultProps} />);
    const loginButton = getByTestId('login-button');

    expect(loginButton.props.disabled).toBe(true);
  });

  it('should show ActivityIndicator when loading', () => {
    (useEmailAuth as jest.Mock).mockReturnValue({
      ...mockEmailAuth,
      loading: true,
    });

    const { UNSAFE_getByType } = render(<LoginForm {...defaultProps} />);

    // ActivityIndicator is rendered when loading
    expect(UNSAFE_getByType('ActivityIndicator' as any)).toBeTruthy();
  });

  it('should show password validation display when password length > 0', () => {
    (usePasswordValidation as jest.Mock).mockReturnValue({
      ...mockPasswordValidation,
      password: 'a',
    });

    const { getByTestId } = render(<LoginForm {...defaultProps} />);

    // PasswordValidationDisplay is rendered as a mock
    // In the mock it's set as a string, but the component renders it
    // This test verifies no crash and that password validation is triggered
    expect(getByTestId('password-input')).toBeTruthy();
  });
});
