// forgot-password.test.tsx — ForgotPassword test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ForgotPassword from '../forgot-password';

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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockResetPasswordForEmail.mockReset();
    mockVerifyOtp.mockReset();
    mockUpdateUser.mockReset();
    mockFunctionsInvoke.mockReset();
    delete process.env.EXPO_PUBLIC_E2E_TEST_MODE;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -- Rendering --

  describe('rendering', () => {
    it('should render the title', () => {
      const { getByText } = renderForgotPassword();
      expect(getByText('Recupero Password')).toBeTruthy();
    });

    it('should render the email input with correct placeholder', () => {
      const { getByPlaceholderText } = renderForgotPassword();
      expect(getByPlaceholderText('Inserisci la tua email')).toBeTruthy();
    });

    it('should render the info text about OTP', () => {
      const { getByText } = renderForgotPassword();
      expect(getByText(/Ti invieremo un codice OTP/)).toBeTruthy();
    });

    it('should render the send OTP button', () => {
      const { getByText } = renderForgotPassword();
      expect(getByText('Invia Codice OTP')).toBeTruthy();
    });

    it('should render email input with email-address keyboard type', () => {
      const { getByPlaceholderText } = renderForgotPassword();
      expect(getByPlaceholderText('Inserisci la tua email').props.keyboardType).toBe('email-address');
    });

    it('should render email input with autoCapitalize none', () => {
      const { getByPlaceholderText } = renderForgotPassword();
      expect(getByPlaceholderText('Inserisci la tua email').props.autoCapitalize).toBe('none');
    });

    it('should NOT render the OTP section initially', () => {
      const { queryByText } = renderForgotPassword();
      expect(queryByText('Inserisci il codice OTP')).toBeNull();
      expect(queryByText('Verifica Codice')).toBeNull();
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
      const input = getByPlaceholderText('Inserisci la tua email');
      fireEvent.changeText(input, 'user@example.com');
      expect(input.props.value).toBe('user@example.com');
    });

    it('should trim email before sending', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), '  user@example.com  ');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
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
        fireEvent.press(getByText('Invia Codice OTP'));
      });
      expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Inserisci la tua email.');
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('should show alert when email is only spaces', async () => {
      const { getByPlaceholderText, getByText } = renderForgotPassword();
      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), '   ');
      });
      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });
      expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Inserisci la tua email.');
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  // -- OTP Request Flow --

  describe('OTP request flow', () => {
    it('should call resetPasswordForEmail with the email', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {});
      });
    });

    it('should show success alert when OTP email is sent', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Successo',
          'Email di reset della password inviata. Si prega di controllare la posta in arrivo.'
        );
      });
    });

    it('should show OTP input section after successful request', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(getByText('Inserisci il codice OTP')).toBeTruthy();
        expect(getByText('Verifica Codice')).toBeTruthy();
      });
    });

    it('should disable email input while loading', async () => {
      mockResetPasswordForEmail.mockReturnValue(new Promise(() => {}));
      const { getByPlaceholderText, getByText } = renderForgotPassword();
      const input = getByPlaceholderText('Inserisci la tua email');

      await act(async () => {
        fireEvent.changeText(input, 'user@example.com');
      });

      act(() => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(input.props.editable).toBe(false);
      });
    });
  });

  // -- Supabase Error Handling --

  describe('Supabase error handling', () => {
    it('should show user-not-found error', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'unknown@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Nessun account trovato con questa email.');
      });
    });

    it('should show rate limit error', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Rate limit exceeded' } });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          'Troppe richieste. Attendi qualche minuto prima di riprovare.'
        );
      });
    });

    it('should show invalid-email error', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Invalid email format' } });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'not-an-email');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          "L'indirizzo email inserito non è valido."
        );
      });
    });

    it('should show generic error for unknown Supabase errors', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Something else' } });
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          "Errore nell'invio dell'email di reset della password. Si prega di riprovare."
        );
      });
    });

    it('should show error message when an exception is thrown', async () => {
      mockResetPasswordForEmail.mockRejectedValue(new Error('Network failure'));
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Network failure');
      });
    });

    it('should show generic error when non-Error is thrown', async () => {
      mockResetPasswordForEmail.mockRejectedValue('string error');
      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          "Errore durante l'invio del codice OTP"
        );
      });
    });

    it('should reset loading state after error', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } });
      const { getByPlaceholderText, getByText, queryByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(getByText('Inserisci il codice OTP')).toBeTruthy();
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
      expect(getByText('Inserisci il codice OTP')).toBeTruthy();
    });

    it('should show OTP info text about checking email', async () => {
      const { getByPlaceholderText, getByText } = renderForgotPassword();
      await showOtpSection(getByPlaceholderText, getByText);
      expect(getByText(/Controlla la tua email per il codice di verifica/)).toBeTruthy();
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(getByText('Inserisci il codice OTP')).toBeTruthy();
      });
    };

    it('should show error when OTP is empty', async () => {
      const { getByPlaceholderText, getByText } = renderForgotPassword();
      await showOtpSection(getByPlaceholderText, getByText);

      await act(async () => {
        fireEvent.press(getByText('Verifica Codice'));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Errore',
        'Inserisci un codice OTP valido a 6 cifre.'
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
        fireEvent.press(getByText('Verifica Codice'));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Errore',
        'Inserisci un codice OTP valido a 6 cifre.'
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(getByText('Inserisci il codice OTP')).toBeTruthy();
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
        fireEvent.press(getByText('Verifica Codice'));
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
        fireEvent.press(getByText('Verifica Codice'));
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          data: { is_resetting_password: true },
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
        fireEvent.press(getByText('Verifica Codice'));
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(getByText('Inserisci il codice OTP')).toBeTruthy();
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
        fireEvent.press(getByText('Verifica Codice'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          'Il codice OTP è scaduto. Richiedi un nuovo codice.'
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
        fireEvent.press(getByText('Verifica Codice'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          'Il codice OTP inserito non è corretto.'
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
        fireEvent.press(getByText('Verifica Codice'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          'Codice OTP non valido o scaduto.'
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
        fireEvent.press(getByText('Verifica Codice'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          'Impossibile aggiornare lo stato di reset password'
        );
      });
    });

    it('should show error when exception is thrown during OTP verification', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderForgotPassword();
      await setupOtpSection(getByPlaceholderText, getByText);

      mockVerifyOtp.mockRejectedValue(new Error('Network timeout'));

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText('Verifica Codice'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Network timeout');
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
        fireEvent.press(getByText('Verifica Codice'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          'Errore durante la verifica del codice'
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(getByText('Inserisci il codice OTP')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('otp-input'), '123456');
      });

      await act(async () => {
        fireEvent.press(getByText(/Torna all/));
      });

      expect(queryByText('Inserisci il codice OTP')).toBeNull();
      expect(queryByText('Verifica Codice')).toBeNull();

      // Re-trigger OTP to verify OTP was cleared
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(getByText('Inserisci il codice OTP')).toBeTruthy();
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(mockFunctionsInvoke).toHaveBeenCalledWith('e2e-otp', {
          body: { email: 'user@example.com', action: 'generate-recovery-token' },
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/password-reset-form');
      });
    });

    it('should show error when edge function fails', async () => {
      process.env.EXPO_PUBLIC_E2E_TEST_MODE = 'true';
      mockFunctionsInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Edge function error' },
      });

      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Edge function error');
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Token hash non ricevuto dalla Edge Function');
      });
    });

    it('should show error when verifyOtp fails in E2E mode', async () => {
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Verifica OTP fallita: OTP failed');
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
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Nessuna sessione stabilita');
      });
    });

    it('should handle non-Error exception in E2E mode', async () => {
      process.env.EXPO_PUBLIC_E2E_TEST_MODE = 'true';
      mockFunctionsInvoke.mockRejectedValue('string error');

      const { getByPlaceholderText, getByText } = renderForgotPassword();

      await act(async () => {
        fireEvent.changeText(getByPlaceholderText('Inserisci la tua email'), 'user@example.com');
      });

      await act(async () => {
        fireEvent.press(getByText('Invia Codice OTP'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          'Errore durante la generazione del token'
        );
      });
    });
  });
});
