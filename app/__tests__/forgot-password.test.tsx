// forgot-password.test.tsx — ForgotPassword test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import i18next from 'i18next';
import { Alert } from 'react-native';
import { initI18n } from '@/i18n';
import { itCatalogs } from '@/i18n/catalogs/it';
import { cleanupRateLimiter } from '@/services/AuthService';
import ForgotPassword from '../forgot-password';

// --- Mocks ---

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'it-IT' }]),
}));

// --- Mocks ---

const mockRouterReplace = jest.fn();
const mockRouterBack = jest.fn();
const mockRouter = {
  replace: mockRouterReplace,
  push: jest.fn(),
  back: mockRouterBack,
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

// Mock supabaseClient
const mockResetPasswordForEmail = jest.fn();
const mockVerifyOtp = jest.fn();
const mockUpdateUser = jest.fn();
const mockFunctionsInvoke = jest.fn();

jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
  },
}));

// --- Helpers ---

const renderForgotPassword = () => render(<ForgotPassword />);

// --- Test Suite ---

describe('ForgotPassword', () => {
  afterAll(() => {
    cleanupRateLimiter();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    initI18n();
    jest.useFakeTimers();
    mockResetPasswordForEmail.mockReset();
    mockVerifyOtp.mockReset();
    mockUpdateUser.mockReset();
    mockFunctionsInvoke.mockReset();
    delete process.env.EXPO_PUBLIC_E2E_TEST_MODE;
  });

  // Reset timers + language so suites running after this one start from Italian.
  afterEach(async () => {
    jest.useRealTimers();
    await i18next.changeLanguage('it');
  });

  // -- Rendering --

  describe('rendering', () => {
    it('should render the title', () => {
      const { getByText } = renderForgotPassword();
      expect(getByText(itCatalogs.auth.forgotPasswordTitle)).toBeTruthy();
    });

    it('should render the email input with correct placeholder', () => {
      const { getByPlaceholderText } = renderForgotPassword();
      expect(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder)).toBeTruthy();
    });

    it('should render the info text about OTP', () => {
      const { getByText } = renderForgotPassword();
      expect(getByText(itCatalogs.auth.otpInfoText)).toBeTruthy();
    });

    it('should render the send OTP button', () => {
      const { getByText } = renderForgotPassword();
      expect(getByText(itCatalogs.auth.sendOtpButton)).toBeTruthy();
    });

    it('should render email input with email-address keyboard type', () => {
      const { getByPlaceholderText } = renderForgotPassword();
      expect(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder).props.keyboardType).toBe('email-address');
    });

    it('should render email input with autoCapitalize none', () => {
      const { getByPlaceholderText } = renderForgotPassword();
      expect(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder).props.autoCapitalize).toBe('none');
    });

    it('should NOT render the OTP section initially', () => {
      const { queryByText } = renderForgotPassword();
      expect(queryByText(itCatalogs.auth.enterOtpTitle)).toBeNull();
      expect(queryByText(itCatalogs.auth.verifyCodeButton)).toBeNull();
    });

    it('should render the send-otp-button testID wrapper', () => {
      const { getByTestId } = renderForgotPassword();
      expect(getByTestId('send-otp-button')).toBeTruthy();
    });
  });

  // -- Email Input Interaction --

  describe('email input interaction', () => {
    it('should update email value when text is entered', () => {
      const { getByPlaceholderText } = renderForgotPassword();
      const input = getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder);
      fireEvent.changeText(input, 'user@example.com');
      expect(input.props.value).toBe('user@example.com');
    });

    it('should trim email before sending', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), '  user@example.com  ');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
          'user@example.com',
          expect.any(Object)
        );
      });
    });
  });

  // -- Email Validation --

  describe('email validation', () => {
    it('should show alert when email is empty', async () => {
      const { getByText } = renderForgotPassword();
      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });
      expect(Alert.alert).toHaveBeenCalledWith(itCatalogs.auth.alertTitles_error, itCatalogs.auth.errors_emailRequired);
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('should show alert when email is only spaces', async () => {
      const { getByPlaceholderText, getByText } = renderForgotPassword();
      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), '   ');
      });
      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });
      expect(Alert.alert).toHaveBeenCalledWith(itCatalogs.auth.alertTitles_error, itCatalogs.auth.errors_emailRequired);
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  // -- OTP Request Flow --

  describe('OTP request flow', () => {
    it('should call resetPasswordForEmail with the email', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {});
      });
    });

    it('should show success alert when OTP email is sent', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.checkEmailAlertTitle,
          itCatalogs.auth.checkEmailAlertMessage
        );
      });
    });

    it('should show OTP input section after successful request', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(getByText(itCatalogs.auth.enterOtpTitle)).toBeTruthy();
        expect(getByText(itCatalogs.auth.verifyCodeButton)).toBeTruthy();
      });
    });

    it('should disable email input while loading', async () => {
      mockResetPasswordForEmail.mockReturnValue(new Promise(() => {}));
      const { getByPlaceholderText, getByText } = renderForgotPassword();
      const input = getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder);

      await act(async () => {
        fireEvent.changeText(input, 'user@example.com');
      });

      act(() => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(input.props.editable).toBe(false);
      });
    });
  });

  // -- Supabase Error Handling --

  describe('Supabase error handling', () => {
    it('should not reveal when the account does not exist', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'unknown@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.checkEmailAlertTitle,
          itCatalogs.auth.checkEmailAlertMessage
        );
      });
    });

    it('should show rate limit error', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Rate limit exceeded' } });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.alertTitles_error,
          itCatalogs.auth.errors_tooManyRequests
        );
      });
    });

    it('should show invalid-email error', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Invalid email format' } });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'not-an-email');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.alertTitles_error,
          itCatalogs.auth.errors_invalidEmailAddress
        );
      });
    });

    it('should show generic error for unknown Supabase errors', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Something else' } });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.alertTitles_error,
          itCatalogs.auth.errors_resetEmailSendError
        );
      });
    });

    it('should show localised fallback when an exception is thrown', async () => {
      mockResetPasswordForEmail.mockRejectedValue(new Error('Network failure'));
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(itCatalogs.auth.alertTitles_error, itCatalogs.auth.errors_unexpectedOtpError);
      });
    });

    it('should show generic error when non-Error is thrown', async () => {
      mockResetPasswordForEmail.mockRejectedValue('string error');
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.alertTitles_error,
          itCatalogs.auth.errors_unexpectedOtpError
        );
      });
    });

    it('should reset loading state after error', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Server unavailable' } });
      const { getByPlaceholderText, getByText, queryByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      expect(queryByText('Invia Codice OTP')).toBeTruthy();
    });
  });

  // -- OTP Section Rendering --

  describe('OTP section rendering', () => {
    const showOtpSection = async (
      getByPlaceholderText: ReturnType<typeof render>['getByPlaceholderText'],
      getByText: ReturnType<typeof render>['getByText']
    ) => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(getByText(itCatalogs.auth.enterOtpTitle)).toBeTruthy();
      });
    };

    it('should show OTP input with maxLength 6', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await showOtpSection(getByPlaceholderText, getByText);
      expect(getByTestId('otp-input').props.maxLength).toBe(6);
    });

    it('should show OTP input with number-pad keyboard', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await showOtpSection(getByPlaceholderText, getByText);
      expect(getByTestId('otp-input').props.keyboardType).toBe('number-pad');
    });

    it('should show OTP section title', async () => {
      const { getByPlaceholderText, getByText } = renderForgotPassword();
      await showOtpSection(getByPlaceholderText, getByText);
      expect(getByText(itCatalogs.auth.enterOtpTitle)).toBeTruthy();
    });

    it('should show OTP info text about checking email', async () => {
      const { getByPlaceholderText, getByText } = renderForgotPassword();
      await showOtpSection(getByPlaceholderText, getByText);
      expect(getByText(itCatalogs.auth.checkEmailForCode)).toBeTruthy();
    });
  });

  // -- OTP Validation --

  describe('OTP validation', () => {
    const showOtpSection = async (
      getByPlaceholderText: ReturnType<typeof render>['getByPlaceholderText'],
      getByText: ReturnType<typeof render>['getByText']
    ) => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(getByText(itCatalogs.auth.enterOtpTitle)).toBeTruthy();
      });
    };

    it('should show error when OTP is empty', async () => {
      const { getByPlaceholderText, getByText } = renderForgotPassword();
      await showOtpSection(getByPlaceholderText, getByText);

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        itCatalogs.auth.alertTitles_error,
        itCatalogs.auth.errors_invalidOtpLength
      );
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it('should show error when OTP has less than 6 digits', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await showOtpSection(getByPlaceholderText, getByText);

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '12345');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        itCatalogs.auth.alertTitles_error,
        itCatalogs.auth.errors_invalidOtpLength
      );
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });
  });

  // -- OTP Verification Success --

  describe('OTP verification success', () => {
    const setupOtpSection = async (
      getByPlaceholderText: ReturnType<typeof render>['getByPlaceholderText'],
      getByText: ReturnType<typeof render>['getByText']
    ) => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(getByText(itCatalogs.auth.enterOtpTitle)).toBeTruthy();
      });
    };

    it('should call verifyOtp with correct params', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await setupOtpSection(getByPlaceholderText, getByText);

      mockVerifyOtp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 't' } },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith({
          email: 'user@example.com',
          token: '123456',
          type: 'recovery',
        });
      });
    });

    it('should call updateUser with is_resetting_password flag', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await setupOtpSection(getByPlaceholderText, getByText);

      mockVerifyOtp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 't' } },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          data: { is_resetting_password: true },
        });
      });
    });

    it('should trim email before verifying OTP', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();

      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), '  user@example.com  ');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(getByText(itCatalogs.auth.enterOtpTitle)).toBeTruthy();
      });

      mockVerifyOtp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 't' } },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith({
          email: 'user@example.com',
          token: '123456',
          type: 'recovery',
        });
      });
    });

    it('should navigate to /password-reset-form after success', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await setupOtpSection(getByPlaceholderText, getByText);

      mockVerifyOtp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 't' } },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/password-reset-form');
      });
    });
  });

  // -- OTP Verification Errors --

  describe('OTP verification errors', () => {
    const setupOtpSection = async (
      getByPlaceholderText: ReturnType<typeof render>['getByPlaceholderText'],
      getByText: ReturnType<typeof render>['getByText']
    ) => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(getByText(itCatalogs.auth.enterOtpTitle)).toBeTruthy();
      });
    };

    it('should show expired token error', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await setupOtpSection(getByPlaceholderText, getByText);

      mockVerifyOtp.mockResolvedValue({ data: null, error: { message: 'Token has expired' } });

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.alertTitles_error,
          itCatalogs.auth.errors_expiredOtp
        );
      });
    });

    it('should show invalid token error', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await setupOtpSection(getByPlaceholderText, getByText);

      mockVerifyOtp.mockResolvedValue({ data: null, error: { message: 'Invalid token' } });

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.alertTitles_error,
          itCatalogs.auth.errors_incorrectOtp
        );
      });
    });

    it('should show generic OTP error for unknown errors', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await setupOtpSection(getByPlaceholderText, getByText);

      mockVerifyOtp.mockResolvedValue({ data: null, error: { message: 'Other error' } });

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.alertTitles_error,
          itCatalogs.auth.errors_genericOtpError
        );
      });
    });

    it('should show error when updateUser fails', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await setupOtpSection(getByPlaceholderText, getByText);

      mockVerifyOtp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 't' } },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({ error: { message: 'Update failed' } });

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.alertTitles_error,
          itCatalogs.auth.errors_metadataUpdateError
        );
      });
    });

    it('should show localised fallback when exception is thrown during OTP verification', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await setupOtpSection(getByPlaceholderText, getByText);

      mockVerifyOtp.mockRejectedValue(new Error('Network timeout'));

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(itCatalogs.auth.alertTitles_error, itCatalogs.auth.errors_unexpectedVerifyError);
      });
    });

    it('should show generic error when non-Error is thrown during verification', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await setupOtpSection(getByPlaceholderText, getByText);

      mockVerifyOtp.mockRejectedValue('string error');

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.verifyCodeButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.alertTitles_error,
          itCatalogs.auth.errors_unexpectedVerifyError
        );
      });
    });
  });

  // -- Back to Email --

  describe('back to email', () => {
    it('should hide OTP section and clear OTP value when pressed', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const { getByPlaceholderText, getByText, queryByText, getByTestId } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(getByText(itCatalogs.auth.enterOtpTitle)).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.backToEmailButton));
      });

      expect(queryByText(itCatalogs.auth.enterOtpTitle)).toBeNull();
      expect(queryByText(itCatalogs.auth.verifyCodeButton)).toBeNull();

      // Re-trigger OTP to verify OTP was cleared
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(getByText(itCatalogs.auth.enterOtpTitle)).toBeTruthy();
      });

      const otpInput = getByTestId('otp-input');
      expect(otpInput.props.value).toBe('');
    });
  });

  // -- E2E Test Mode --

  describe('E2E test mode', () => {
    it('should use edge function instead of resetPasswordForEmail', async () => {
      process.env.EXPO_PUBLIC_E2E_TEST_MODE = 'true';
      mockFunctionsInvoke.mockResolvedValue({
        data: { token_hash: 'mock-hash' },
        error: null,
      });
      mockVerifyOtp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 't' } },
        error: null,
      });

      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(mockFunctionsInvoke).toHaveBeenCalledWith('e2e-otp', {
          body: { email: 'user@example.com', action: 'generate-recovery-token' },
          headers: { 'x-e2e-secret': expect.any(String) },
        });
        expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
      });
    });

    it('should call verifyOtp with token_hash in E2E mode', async () => {
      process.env.EXPO_PUBLIC_E2E_TEST_MODE = 'true';
      mockFunctionsInvoke.mockResolvedValue({
        data: { token_hash: 'mock-hash' },
        error: null,
      });
      mockVerifyOtp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 't' } },
        error: null,
      });

      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith({
          token_hash: 'mock-hash',
          type: 'recovery',
        });
      });
    });

    it('should navigate to /password-reset-form on success', async () => {
      process.env.EXPO_PUBLIC_E2E_TEST_MODE = 'true';
      mockFunctionsInvoke.mockResolvedValue({
        data: { token_hash: 'mock-hash' },
        error: null,
      });
      mockVerifyOtp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: { access_token: 't' } },
        error: null,
      });

      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/password-reset-form');
      });
    });

    it('should show localised generation error when edge function fails', async () => {
      process.env.EXPO_PUBLIC_E2E_TEST_MODE = 'true';
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Edge function error' },
      });

      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(itCatalogs.auth.alertTitles_error, itCatalogs.auth.errors_otpGenerationError);
      });
    });

    it('should show error when no token_hash is returned', async () => {
      process.env.EXPO_PUBLIC_E2E_TEST_MODE = 'true';
      mockFunctionsInvoke.mockResolvedValue({
        data: { token_hash: null },
        error: null,
      });

      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(itCatalogs.auth.alertTitles_error, itCatalogs.auth.errors_tokenHashMissing);
      });
    });

    it('should show localised error without technical detail when verifyOtp fails in E2E mode', async () => {
      process.env.EXPO_PUBLIC_E2E_TEST_MODE = 'true';
      mockFunctionsInvoke.mockResolvedValue({
        data: { token_hash: 'mock-hash' },
        error: null,
      });
      mockVerifyOtp.mockResolvedValue({
        data: null,
        error: { message: 'OTP failed' },
      });

      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(itCatalogs.auth.alertTitles_error, itCatalogs.auth.errors_otpVerifyFailed);
        expect(Alert.alert).not.toHaveBeenCalledWith(itCatalogs.auth.alertTitles_error, expect.stringContaining('OTP failed'));
      });
    });

    it('should show error when no session is established in E2E mode', async () => {
      process.env.EXPO_PUBLIC_E2E_TEST_MODE = 'true';
      mockFunctionsInvoke.mockResolvedValue({
        data: { token_hash: 'mock-hash' },
        error: null,
      });
      mockVerifyOtp.mockResolvedValue({
        data: { user: { id: 'u1' }, session: null },
        error: null,
      });

      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(itCatalogs.auth.alertTitles_error, itCatalogs.auth.errors_noSessionEstablished);
      });
    });

    it('should handle non-Error exception in E2E mode', async () => {
      process.env.EXPO_PUBLIC_E2E_TEST_MODE = 'true';
      mockFunctionsInvoke.mockRejectedValue('string error');

      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText(itCatalogs.auth.emailInputPlaceholder), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText(itCatalogs.auth.sendOtpButton));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          itCatalogs.auth.alertTitles_error,
          itCatalogs.auth.errors_otpGenerationError
        );
      });
    });
  });
});
