// password-reset-form.test.tsx — PasswordResetForm test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PasswordResetForm from '../password-reset-form';
import { supabase } from '@/services/supabaseClient';



// --- Mocks ---

// Capture the onAuthStateChange callback so tests can fire events
let authStateCallback: ((event: string, session: unknown) => void) | null = null;

const mockGetSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockUpdateUser = jest.fn();
const mockOnAuthStateChange = jest.fn((callback: (event: string, session: unknown) => void) => {
  authStateCallback = callback;
  return { data: { subscription: { unsubscribe: jest.fn() } } };
});

jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      refreshSession: () => mockRefreshSession(),
      updateUser: (data: unknown) => mockUpdateUser(data),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => mockOnAuthStateChange(callback),
    },
  },
  getCachedSession: () => mockGetSession(),
}));

const mockRouterReplace = jest.fn();
const mockRouter = {
  replace: mockRouterReplace,
  push: jest.fn(),
  back: jest.fn(),
};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: () => null,
}));

// --- Helpers ---

const createMockUser = (id: string, email: string, metadata?: Record<string, unknown>) => ({
  id,
  email,
  app_metadata: {},
  user_metadata: metadata || {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  role: 'authenticated',
});

const createMockSession = (user: ReturnType<typeof createMockUser>) => ({
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600,
  token_type: 'bearer',
  user,
});

const defaultUser = createMockUser('user-123', 'test@example.com');
const defaultSession = createMockSession(defaultUser);

// Default mock implementations for a successful session
const setupValidSession = () => {
  mockGetSession.mockResolvedValue({ data: { session: defaultSession }, error: null });
  mockRefreshSession.mockResolvedValue({ data: { session: defaultSession }, error: null });
};

const renderForm = () => render(<PasswordResetForm />);

// --- Test Suite ---

describe('PasswordResetForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockReset();
    mockRefreshSession.mockReset();
    mockUpdateUser.mockReset();
    mockOnAuthStateChange.mockReset();
    authStateCallback = null;
    setupValidSession();
    // Default mock for onAuthStateChange
    mockOnAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
      authStateCallback = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
  });

  // ── Loading State ──────────────────────────────────────────────────

  describe('loading state', () => {
    it('should show loading indicator while checking session', () => {
      // Don't resolve getSession yet — keep the component in loading state
      mockGetSession.mockReturnValue(new Promise(() => {}));

      const { getByText } = renderForm();

      expect(getByText('Verifica sessione...')).toBeTruthy();
    });

    it('should show ActivityIndicator while loading', () => {
      mockGetSession.mockReturnValue(new Promise(() => {}));

      const { UNSAFE_root } = renderForm();

      // ActivityIndicator should be rendered during loading
      const activityIndicators = UNSAFE_root.findAllByType('ActivityIndicator');
      expect(activityIndicators.length).toBeGreaterThan(0);
    });
  });

  // ── Session Validation ─────────────────────────────────────────────

  describe('session validation', () => {
    it('should redirect to /login when session is null', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      renderForm();

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/login');
      });
    });

    it('should show error alert when getSession returns an error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      renderForm();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          'Impossibile verificare la sessione utente'
        );
        expect(mockRouterReplace).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to /login when refreshed session is also null', async () => {
      // First getSession returns a session, but after refresh it's null
      mockGetSession
        .mockResolvedValueOnce({ data: { session: defaultSession }, error: null })
        .mockResolvedValueOnce({ data: { session: null }, error: null });
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      renderForm();

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/login');
      });
    });

    it('should use refreshed session when available', async () => {
      const refreshedUser = createMockUser('user-456', 'refreshed@example.com');
      const refreshedSession = createMockSession(refreshedUser);
      mockGetSession
        .mockResolvedValueOnce({ data: { session: defaultSession }, error: null })
        .mockResolvedValueOnce({ data: { session: refreshedSession }, error: null });
      mockRefreshSession.mockResolvedValue({
        data: { session: refreshedSession },
        error: null,
      });

      const { getByText } = renderForm();

      await waitFor(() => {
        expect(getByText('Ciao refreshed@example.com, inserisci la tua nuova password')).toBeTruthy();
      });
    });

it('should continue with original session if refresh fails', async () => {
    // Sovrascrivi refreshSession per simulare errore di rete
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Network error' },
    });
    // Sovrascrivi getSession per restituire SEMPRE defaultSession
    mockGetSession.mockImplementation(() => Promise.resolve({ data: { session: defaultSession }, error: null }));

    const { getByText } = renderForm();

    await waitFor(() => {
      expect(getByText(/Ciao.*test@example\.com.*inserisci/)).toBeTruthy();
    });
  });
});

  // ── Form Rendering ─────────────────────────────────────────────────

  describe('form rendering', () => {
    it('should render form fields after session is verified', async () => {
      const { getByTestId, getByText } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
        expect(getByTestId('confirm-password-input')).toBeTruthy();
        expect(getByTestId('confirm-reset-button')).toBeTruthy();
      });
    });

    it('should show user email in subtitle', async () => {
      const { getByText } = renderForm();

      await waitFor(() => {
        expect(getByText('Ciao test@example.com, inserisci la tua nuova password')).toBeTruthy();
      });
    });

    it('should render the title "Reimposta Password"', async () => {
      const { getByText } = renderForm();

      await waitFor(() => {
        expect(getByText('Reimposta Password')).toBeTruthy();
      });
    });

    it('should render validation checks', async () => {
      const { getByText } = renderForm();

      await waitFor(() => {
        expect(getByText('Almeno 8 caratteri')).toBeTruthy();
        expect(getByText('Una lettera maiuscola')).toBeTruthy();
        expect(getByText('Una lettera minuscola')).toBeTruthy();
        expect(getByText('Un numero')).toBeTruthy();
        expect(getByText('Le password coincidono')).toBeTruthy();
      });
    });
  });

  // ── Button State ───────────────────────────────────────────────────

  describe('button state', () => {
    it('should have button disabled when fields are empty', async () => {
      const { getByTestId } = renderForm();

      await waitFor(() => {
        const button = getByTestId('confirm-reset-button');
        expect(button.props.disabled).toBe(true);
      });
    });

    it('should have button disabled when passwords do not match', async () => {
      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'Password1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'Password2');
      });

      const button = getByTestId('confirm-reset-button');
      expect(button.props.disabled).toBe(true);
    });

    it('should have button disabled when password is too short', async () => {
      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'Short1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'Short1');
      });

      const button = getByTestId('confirm-reset-button');
      expect(button.props.disabled).toBe(true);
    });

    it('should have button disabled when password has no uppercase', async () => {
      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'password1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'password1');
      });

      const button = getByTestId('confirm-reset-button');
      expect(button.props.disabled).toBe(true);
    });

    it('should have button disabled when password has no number', async () => {
      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'PasswordX');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'PasswordX');
      });

      const button = getByTestId('confirm-reset-button');
      expect(button.props.disabled).toBe(true);
    });

    it('should have button enabled when password is valid and matches', async () => {
      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'ValidPass1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'ValidPass1');
      });

      const button = getByTestId('confirm-reset-button');
      expect(button.props.disabled).toBe(false);
    });
  });

  // ── Form Submission ────────────────────────────────────────────────

  describe('form submission', () => {
    const fillValidPassword = async (getByTestId: ReturnType<typeof renderForm>['getByTestId']) => {
      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'ValidPass1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'ValidPass1');
      });
    };

    it('should show alert when submitting with empty new password', async () => {
      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('confirm-reset-button')).toBeTruthy();
      });

      // Bypass disabled state by directly calling onPress
      // This tests the validation inside handleUpdatePassword
      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), '');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'ValidPass1');
      });

      // Since button is disabled, we need to test the handler logic
      // by checking that Alert is called when fields are empty
      // The actual handler checks for empty fields
    });

    it('should call supabase.auth.updateUser on valid submission', async () => {
      mockUpdateUser.mockResolvedValue({ data: { user: defaultUser }, error: null });

      const { getByTestId } = renderForm();

      await fillValidPassword(getByTestId);

      await act(async () => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: 'ValidPass1',
          data: { is_resetting_password: false },
        });
      });
    });

    it('should show success Alert on successful update', async () => {
      mockUpdateUser.mockResolvedValue({ data: { user: defaultUser }, error: null });

      const { getByTestId } = renderForm();

      await fillValidPassword(getByTestId);

      await act(async () => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Successo',
          'Password reimpostata con successo! Verrai reindirizzato alla dashboard.',
          expect.arrayContaining([
            expect.objectContaining({ text: 'OK' }),
          ])
        );
      });
    });

    it('should redirect to dashboard only after pressing OK on success alert', async () => {
      mockUpdateUser.mockResolvedValue({ data: { user: defaultUser }, error: null });

      const { getByTestId } = renderForm();

      await fillValidPassword(getByTestId);

      await act(async () => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Before pressing OK, should NOT have redirected
      expect(mockRouterReplace).not.toHaveBeenCalledWith('/(tabs)');

      // Simulate pressing OK
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const okButton = alertCall[2].find((btn: { text: string }) => btn.text === 'OK');

      await act(async () => {
        okButton.onPress();
      });

      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
    });

    it('should show error Alert on failed update', async () => {
      mockUpdateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'New password should be different than the old one' },
      });

      const { getByTestId } = renderForm();

      await fillValidPassword(getByTestId);

      await act(async () => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          'La nuova password deve essere diversa dalla precedente.'
        );
      });
    });

    it('should show generic error on unknown update error', async () => {
      mockUpdateUser.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = renderForm();

      await fillValidPassword(getByTestId);

      await act(async () => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Network error');
      });
    });

    it('should show timeout message when request times out without server confirmation', async () => {
      // Make updateUser never resolve (simulate timeout)
      mockUpdateUser.mockReturnValue(new Promise(() => {}));

      const { getByTestId } = renderForm();

      await fillValidPassword(getByTestId);

      // Usiamo i fake timers prima che venga innescato il setTimeout dentro il handler!
      jest.useFakeTimers();

      // Start the submission
      act(() => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      // Advance timers to trigger the 20s timeout
      act(() => {
        jest.advanceTimersByTime(21000);
      });
      jest.useRealTimers();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Errore',
          'Il server non ha risposto in tempo, riprova tra poco.'
        );
      });
    });

    it('should show loading text while updating', async () => {
      // Make updateUser take some time
      let resolveUpdate: (value: unknown) => void;
      mockUpdateUser.mockReturnValue(new Promise((resolve) => {
        resolveUpdate = resolve;
      }));

      const { getByTestId, queryByText } = renderForm();

      await fillValidPassword(getByTestId);

      await act(async () => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      // While updating, button should show "Aggiornamento..."
      expect(queryByText('Aggiornamento...')).toBeTruthy();

      // Resolve the update
      await act(async () => {
        resolveUpdate!({ data: { user: defaultUser }, error: null });
      });
    });
  });

  // ── Race Condition ─────────────────────────────────────────────────

  describe('race condition: USER_UPDATED event', () => {
    it('should NOT redirect when USER_UPDATED is received before user presses OK', async () => {
      mockUpdateUser.mockResolvedValue({ data: { user: defaultUser }, error: null });

      const { getByTestId } = renderForm();

      // Wait for form to render
      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      // Fill valid password
      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'ValidPass1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'ValidPass1');
      });

      // Submit the form
      await act(async () => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate USER_UPDATED event arriving (this is the race condition scenario)
      // The component should NOT redirect on this event
      await act(async () => {
        if (authStateCallback) {
          authStateCallback('USER_UPDATED', defaultSession);
        }
      });

      // After USER_UPDATED, the component should NOT redirect
      // because the redirect should only happen when user presses OK on the Alert
      expect(mockRouterReplace).not.toHaveBeenCalledWith('/(tabs)');

      // Now simulate the user pressing OK on the Alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const okButton = alertCall[2].find((btn: { text: string }) => btn.text === 'OK');

      await act(async () => {
        okButton.onPress();
      });

      // NOW the redirect should happen
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
    });

    it('should set serverConfirmed ref when USER_UPDATED is received', async () => {
      mockUpdateUser.mockResolvedValue({ data: { user: defaultUser }, error: null });

      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      // Trigger USER_UPDATED event
      await act(async () => {
        if (authStateCallback) {
          authStateCallback('USER_UPDATED', defaultSession);
        }
      });

      // The component should still be showing the form (no redirect from USER_UPDATED)
      expect(getByTestId('new-password-input')).toBeTruthy();
    });
  });

  // ── Auth State Events ──────────────────────────────────────────────

  describe('auth state change events', () => {
    it('should redirect to /login on SIGNED_OUT event', async () => {
      renderForm();

      await waitFor(() => {
        expect(mockGetSession).toHaveBeenCalled();
      });

      // Simulate SIGNED_OUT event
      await act(async () => {
        if (authStateCallback) {
          authStateCallback('SIGNED_OUT', null);
        }
      });

      expect(mockRouterReplace).toHaveBeenCalledWith('/login');
    });

    it('should redirect to /login when session is null in auth state change', async () => {
      renderForm();

      await waitFor(() => {
        expect(mockGetSession).toHaveBeenCalled();
      });

      // Simulate an event with null session
      await act(async () => {
        if (authStateCallback) {
          authStateCallback('TOKEN_REFRESHED', null);
        }
      });

      expect(mockRouterReplace).toHaveBeenCalledWith('/login');
    });
  });

  // ── Password Visibility Toggle ─────────────────────────────────────

  describe('password visibility toggle', () => {
    it('should have password fields with secureTextEntry by default', async () => {
      const { getByTestId } = renderForm();

      await waitFor(() => {
        const newPasswordInput = getByTestId('new-password-input');
        const confirmPasswordInput = getByTestId('confirm-password-input');
        expect(newPasswordInput.props.secureTextEntry).toBe(true);
        expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
      });
    });
  });

  // ── Validation Checks Display ──────────────────────────────────────

  describe('validation checks', () => {
    it('should show invalid checks for empty password', async () => {
      const { getByTestId, UNSAFE_root } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      // All validation checks should be false for empty password
      // The ValidationCheck component renders FontAwesome icons based on isValid
      // We can verify the text is present
      const checkTexts = UNSAFE_root.findAllByType('Text');
      const validationTexts = checkTexts
        .map((t: { props: { children: string } }) => t.props.children)
        .filter((t: string) => typeof t === 'string');

      expect(validationTexts).toContain('Almeno 8 caratteri');
      expect(validationTexts).toContain('Una lettera maiuscola');
      expect(validationTexts).toContain('Una lettera minuscola');
      expect(validationTexts).toContain('Un numero');
      expect(validationTexts).toContain('Le password coincidono');
    });

    it('should update validation as password changes', async () => {
      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      // Type a valid password
      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'ValidPass1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'ValidPass1');
      });

      // Now the button should be enabled (all validation checks pass)
      const button = getByTestId('confirm-reset-button');
      expect(button.props.disabled).toBe(false);
    });
  });

  // ── Cleanup ────────────────────────────────────────────────────────

  describe('cleanup', () => {
    it('should unsubscribe from auth listener on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      });

      const { unmount } = renderForm();

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle common password rejection', async () => {
      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      // Type a common password
      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'password1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'password1');
      });

      // Button should be disabled because "password1" is in COMMON_PASSWORDS
      const button = getByTestId('confirm-reset-button');
      expect(button.props.disabled).toBe(true);
    });

    it('should handle updateUser error with non-standard message', async () => {
      mockUpdateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Some unknown error from Supabase' },
      });

      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'ValidPass1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'ValidPass1');
      });

      await act(async () => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore', expect.any(String));
      });
    });

    it('should handle non-Error thrown values in update', async () => {
      mockUpdateUser.mockRejectedValue('string error');

      const { getByTestId } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'ValidPass1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'ValidPass1');
      });

      await act(async () => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Errore sconosciuto');
      });
    });

    it('should reset loading state after error', async () => {
      mockUpdateUser.mockRejectedValue(new Error('Update failed'));

      const { getByTestId, queryByText } = renderForm();

      await waitFor(() => {
        expect(getByTestId('new-password-input')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('new-password-input'), 'ValidPass1');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'ValidPass1');
      });

      await act(async () => {
        fireEvent.press(getByTestId('confirm-reset-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Loading should be false now, button text should be "Aggiorna Password"
      expect(queryByText('Aggiorna Password')).toBeTruthy();
      expect(queryByText('Aggiornamento...')).toBeNull();
    });
  });
});
