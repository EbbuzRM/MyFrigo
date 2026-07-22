/**
 * Test per la schermata di feedback (feedback.tsx)
 * Verifica rendering, interazioni utente, gestione errori e casi di successo.
 *
 * NOTE: Platform.OS is set to 'android' by default to bypass the ActionSheetIOS
 * code path. ActionSheetIOS is NOT included in the global react-native mock from
 * jest.setup.js. For iOS-specific tests, we mock it separately.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import FeedbackScreen from '../feedback';

// --- Mocks ---

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
  }),
  Stack: {
    Screen: () => null,
  },
}));

const mockLaunchImageLibraryAsync = jest.fn();
const mockRequestMediaLibraryPermissions = jest.fn(() =>
  Promise.resolve({ status: 'granted' })
);
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: any[]) => mockLaunchImageLibraryAsync(...args),
  requestMediaLibraryPermissionsAsync: (...args: any[]) => mockRequestMediaLibraryPermissions(...args),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('base64EncodedData')),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style, testID, ...props }: any) =>
      React.createElement(View, { style, testID, ...props }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft',
}));

// Mock supabase.functions.invoke
const mockInvoke = jest.fn();
jest.mock('@/services/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

// Mock LoggingService
const mockLoggingInfo = jest.fn();
const mockLoggingError = jest.fn();
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: (...args: any[]) => mockLoggingInfo(...args),
    error: (...args: any[]) => mockLoggingError(...args),
    warning: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Toast — renders visible content so we can query message/type
jest.mock('@/components/Toast', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const Toast = (props: any) =>
    props.visible
      ? React.createElement(View, { testID: 'toast' },
          React.createElement(Text, { testID: 'toast-message' }, props.message),
          React.createElement(Text, { testID: 'toast-type' }, props.type)
        )
      : null;
  return { Toast };
});

// --- Augment react-native mock with ActionSheetIOS ---
// The global jest.setup.js mock doesn't include ActionSheetIOS.
// We mutate the mock object to add it for iOS-path tests.
const mockShowActionSheetWithOptions = jest.fn();
const RN = require('react-native');
RN.ActionSheetIOS = {
  showActionSheetWithOptions: mockShowActionSheetWithOptions,
};

// --- Type helpers ---
const mockedLaunchImageLibraryAsync = mockLaunchImageLibraryAsync as jest.MockedFunction<typeof mockLaunchImageLibraryAsync>;
const mockedInvoke = mockInvoke as jest.MockedFunction<typeof mockInvoke>;

// --- Test Suite ---

describe('FeedbackScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: permission granted
    mockRequestMediaLibraryPermissions.mockResolvedValue({ status: 'granted' });
    // Default: no image selected
    mockedLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
    // Default: supabase invoke success
    mockedInvoke.mockResolvedValue({ data: { success: true }, error: null });
    // Default: Platform.OS = android (bypasses ActionSheetIOS)
    Platform.OS = 'android';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Rendering ──────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render the screen title', () => {
      const { getByText } = render(<FeedbackScreen />);
      expect(getByText('Aiutaci a Migliorare')).toBeTruthy();
    });

    it('should render the instructions text', () => {
      const { getByText } = render(<FeedbackScreen />);
      expect(getByText(/Descrivi il tuo feedback/)).toBeTruthy();
    });

    it('should render the feedback text input', () => {
      const { getByTestId } = render(<FeedbackScreen />);
      expect(getByTestId('feedback-input')).toBeTruthy();
    });

    it('should render the text input with correct placeholder', () => {
      const { getByPlaceholderText } = render(<FeedbackScreen />);
      expect(getByPlaceholderText('Scrivi qui il tuo messaggio...')).toBeTruthy();
    });

    it('should render the send feedback button', () => {
      const { getByTestId } = render(<FeedbackScreen />);
      expect(getByTestId('send-feedback-button')).toBeTruthy();
    });

    it('should render the add screenshot button', () => {
      const { getByLabelText } = render(<FeedbackScreen />);
      expect(getByLabelText('Aggiungi Screenshot')).toBeTruthy();
    });

    it('should render the back button', () => {
      const { getByTestId } = render(<FeedbackScreen />);
      expect(getByTestId('feedback-back-button')).toBeTruthy();
    });

    it('should render "Invia Feedback" text when no screenshot is selected', () => {
      const { getByText } = render(<FeedbackScreen />);
      expect(getByText('Invia Feedback')).toBeTruthy();
    });

    it('should render the screenshot label', () => {
      const { getByText } = render(<FeedbackScreen />);
      expect(getByText('Screenshot (opzionale)')).toBeTruthy();
    });

    it('should not render the remove screenshot button initially', () => {
      const { queryByLabelText } = render(<FeedbackScreen />);
      expect(queryByLabelText('Rimuovi screenshot')).toBeNull();
    });

    it('should not render the remove screenshot button initially (accessibilityRole check)', () => {
      const { queryByRole } = render(<FeedbackScreen />);
      // "Rimuovi" button should not exist before screenshot selection
      expect(queryByRole('button', { name: /Rimuovi screenshot/ })).toBeNull();
    });
  });

  // ── User Interactions ──────────────────────────────────────────────

  describe('user interactions', () => {
    it('should update feedback text when user types', () => {
      const { getByTestId } = render(<FeedbackScreen />);
      fireEvent.changeText(getByTestId('feedback-input'), 'Questo è un test di feedback');
      expect(getByTestId('feedback-input').props.value).toBe('Questo è un test di feedback');
    });

    it('should navigate back when back button is pressed', async () => {
      jest.useFakeTimers();
      const { getByTestId } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByTestId('feedback-back-button'));
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/settings');
      jest.useRealTimers();
    });

    it('should dismiss keyboard when back button is pressed', async () => {
      const Keyboard = require('react-native').Keyboard;
      const { getByTestId } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByTestId('feedback-back-button'));
      });
      expect(Keyboard.dismiss).toHaveBeenCalled();
    });
  });

  // ── Screenshot Selection (Android path — no ActionSheetIOS) ────────

  describe('screenshot selection', () => {
    it('should request media library permissions when "Aggiungi Screenshot" is pressed', async () => {
      const { getByLabelText } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });
      expect(mockRequestMediaLibraryPermissions).toHaveBeenCalled();
    });

    it('should show alert when permission is denied', async () => {
      mockRequestMediaLibraryPermissions.mockResolvedValueOnce({ status: 'denied' });

      const { getByLabelText } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permesso Negato',
          expect.stringContaining('galleria')
        );
      });
    });

    it('should call launchImageLibraryAsync on Android when permission is granted', async () => {
      const { getByLabelText } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });
      expect(mockedLaunchImageLibraryAsync).toHaveBeenCalled();
    });

    it('should show toast when image selection is cancelled', async () => {
      mockedLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const { getByLabelText, getByTestId } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        expect(getByTestId('toast-message').props.children).toBe('Selezione annullata');
      });
    });

    it('should handle error during image selection', async () => {
      mockedLaunchImageLibraryAsync.mockRejectedValueOnce(new Error('Image picker error'));

      const { getByLabelText, getByTestId } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        expect(mockLoggingError).toHaveBeenCalled();
        expect(getByTestId('toast-message').props.children).toContain("selezione dell'immagine");
      });
    });

    it('should re-enable the add screenshot button after error (finally block)', async () => {
      mockedLaunchImageLibraryAsync.mockRejectedValueOnce(new Error('error'));

      const { getByLabelText } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        // The button should be re-enabled after the finally block
        expect(getByLabelText('Aggiungi Screenshot')).toBeTruthy();
      });
    });
  });

  // ── Screenshot Selection (iOS path — ActionSheetIOS) ───────────────

  describe('screenshot selection (iOS)', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('should call ActionSheetIOS on iOS when permission is granted', async () => {
      const { getByLabelText } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        expect(mockShowActionSheetWithOptions).toHaveBeenCalled();
      });
    });

    it('should call handleImageSelection when user picks from gallery (buttonIndex=0)', async () => {
      mockShowActionSheetWithOptions.mockImplementationOnce(
        (_options: any, callback: (buttonIndex: number) => void) => {
          callback(0);
        }
      );

      const { getByLabelText } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        expect(mockedLaunchImageLibraryAsync).toHaveBeenCalled();
      });
    });

    it('should hide loading when user cancels ActionSheet (buttonIndex=1)', async () => {
      mockShowActionSheetWithOptions.mockImplementationOnce(
        (_options: any, callback: (buttonIndex: number) => void) => {
          callback(1); // Cancel
        }
      );

      const { getByLabelText } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        // Button should be re-enabled after cancel
        expect(getByLabelText('Aggiungi Screenshot')).toBeTruthy();
      });
    });
  });

  // ── Screenshot Management ─────────────────────────────────────────

  describe('screenshot management', () => {
    it('should show remove button after image selection', async () => {
      mockedLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///test-image.jpg' }],
      });

      const { getByLabelText, queryByLabelText } = render(<FeedbackScreen />);
      expect(queryByLabelText('Rimuovi screenshot')).toBeNull();

      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        expect(getByLabelText('Rimuovi screenshot')).toBeTruthy();
      });
    });

    it('should show "Invia Feedback con Screenshot" when screenshot is selected', async () => {
      mockedLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///test-image.jpg' }],
      });

      const { getByLabelText, getByText } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        expect(getByText('Invia Feedback con Screenshot')).toBeTruthy();
      });
    });

    it('should remove screenshot and show toast when remove button is pressed', async () => {
      mockedLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///test-image.jpg' }],
      });

      const { getByLabelText, queryByLabelText, getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        expect(getByLabelText('Rimuovi screenshot')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByLabelText('Rimuovi screenshot'));
      });

      await waitFor(() => {
        expect(queryByLabelText('Rimuovi screenshot')).toBeNull();
        expect(getByTestId('toast-message').props.children).toBe('Screenshot rimosso');
      });
    });

    it('should go back to "Invia Feedback" after removing screenshot', async () => {
      mockedLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///test-image.jpg' }],
      });

      const { getByLabelText, getByText } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        expect(getByText('Invia Feedback con Screenshot')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByLabelText('Rimuovi screenshot'));
      });

      await waitFor(() => {
        expect(getByText('Invia Feedback')).toBeTruthy();
      });
    });
  });

  // ── Send Feedback: Validation ──────────────────────────────────────

  describe('send feedback validation', () => {
    it('should show error toast when feedback text is empty', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(getByTestId('toast-message').props.children).toContain('corto');
        expect(getByTestId('toast-type').props.children).toBe('error');
      });
    });

    it('should show error toast when feedback text is too short (< 10 chars)', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Short');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(getByTestId('toast-message').props.children).toContain('corto');
        expect(getByTestId('toast-type').props.children).toBe('error');
      });
    });

    it('should show error toast when feedback text is only whitespace', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), '     ');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(getByTestId('toast-message').props.children).toContain('corto');
      });
    });

    it('should NOT call supabase when text is too short', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Short');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      // Allow timers to flush (showToast uses setTimeout 100ms)
      await waitFor(() => {
        expect(mockedInvoke).not.toHaveBeenCalled();
      });
    });

    it('should accept feedback with exactly 10 characters', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), '1234567890');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(mockedInvoke).toHaveBeenCalledWith('send-feedback', expect.any(Object));
      });
    });

    it('should accept feedback with more than 10 characters', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Questo è un feedback valido');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(mockedInvoke).toHaveBeenCalled();
      });
    });
  });

  // ── Send Feedback: Success Flow ────────────────────────────────────

  describe('send feedback success', () => {
    it('should call supabase.functions.invoke with correct payload', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Bug trovato nella scansione');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(mockedInvoke).toHaveBeenCalledWith('send-feedback', {
          body: {
            feedbackText: 'Bug trovato nella scansione',
            screenshot: null,
          },
        });
      });
    });

    it('should show success toast on successful submission', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Feedback valido con almeno 10 caratteri');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(getByTestId('toast-message').props.children).toContain('successo');
        expect(getByTestId('toast-type').props.children).toBe('success');
      });
    });

    it('should clear the feedback text after successful submission', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Feedback da pulire dopo invio');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(getByTestId('feedback-input').props.value).toBe('');
      });
    });

    it('should navigate back after successful submission', async () => {
      jest.useFakeTimers();
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Feedback per test navigazione');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      // Wait for supabase call to complete
      await waitFor(() => {
        expect(mockedInvoke).toHaveBeenCalled();
      });

      // Advance past the setTimeout(50) in the component
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockBack).toHaveBeenCalled();
    });

    it('should dismiss keyboard after successful submission', async () => {
      const Keyboard = require('react-native').Keyboard;
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test dismiss keyboard');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(Keyboard.dismiss).toHaveBeenCalled();
      });
    });

    it('should include base64 screenshot in payload when screenshot is present', async () => {
      mockedLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///screenshot.jpg' }],
      });

      const { getByTestId, getByLabelText } = render(<FeedbackScreen />);

      // Add screenshot
      await act(async () => {
        fireEvent.press(getByLabelText('Aggiungi Screenshot'));
      });

      await waitFor(() => {
        expect(getByLabelText('Rimuovi screenshot')).toBeTruthy();
      });

      // Type feedback and send
      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Feedback con screenshot');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(mockedInvoke).toHaveBeenCalledWith('send-feedback', {
          body: {
            feedbackText: 'Feedback con screenshot',
            screenshot: 'data:image/jpeg;base64,base64EncodedData',
          },
        });
      });
    });
  });

  // ── Send Feedback: Error Flow ──────────────────────────────────────

  describe('send feedback errors', () => {
    it('should show error toast when supabase returns an error response', async () => {
      mockedInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'Server error' },
      });

      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test errore supabase');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(getByTestId('toast-message').props.children).toContain("Errore nell'invio");
        expect(getByTestId('toast-type').props.children).toBe('error');
      });
    });

    it('should show error toast when supabase.functions.invoke throws', async () => {
      mockedInvoke.mockRejectedValueOnce(new Error('Network error'));

      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test errore rete');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(getByTestId('toast-message').props.children).toContain("Errore nell'invio");
        expect(getByTestId('toast-type').props.children).toBe('error');
      });
    });

    it('should log the error when supabase call fails', async () => {
      const error = new Error('Supabase failure');
      mockedInvoke.mockRejectedValueOnce(error);

      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test log errore');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(mockLoggingError).toHaveBeenCalledWith(
          'FeedbackScreen',
          'Errore invio feedback',
          error
        );
      });
    });

    it('should handle non-Error thrown values gracefully', async () => {
      mockedInvoke.mockRejectedValueOnce('string error');

      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test errore non-Error');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(getByTestId('toast-message').props.children).toContain('Errore sconosciuto');
      });
    });

    it('should not clear form on error', async () => {
      mockedInvoke.mockRejectedValueOnce(new Error('Failure'));

      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test preserva testo errore');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(getByTestId('feedback-input').props.value).toBe('Test preserva testo errore');
      });
    });

    it('should log info when send feedback starts', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test info logging');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(mockLoggingInfo).toHaveBeenCalledWith(
          'FeedbackScreen',
          'Invio feedback iniziato',
          expect.objectContaining({ length: expect.any(Number), hasScreenshot: expect.any(Boolean) })
        );
      });
    });
  });

  // ── Loading State ──────────────────────────────────────────────────

  describe('loading state', () => {
    it('should disable send button during submission', async () => {
      // Make invoke hang to keep loading state
      mockedInvoke.mockReturnValueOnce(new Promise(() => {}));

      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test bottone disabilitato');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      expect(getByTestId('send-feedback-button').props.accessibilityState.disabled).toBe(true);
    });

    it('should disable text input during submission', async () => {
      mockedInvoke.mockReturnValueOnce(new Promise(() => {}));

      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test input disabilitato');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      expect(getByTestId('feedback-input').props.editable).toBe(false);
    });

    it('should re-enable input after submission completes', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test riabilitazione');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(getByTestId('feedback-input').props.editable).toBe(true);
      });
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────

  describe('accessibility', () => {
    it('should have correct accessibilityLabel on back button', () => {
      const { getByLabelText } = render(<FeedbackScreen />);
      expect(getByLabelText('Torna indietro')).toBeTruthy();
    });

    it('should have correct accessibilityLabel on send button', () => {
      const { getByLabelText } = render(<FeedbackScreen />);
      expect(getByLabelText('Invia Feedback')).toBeTruthy();
    });

    it('should have correct accessibilityLabel on add screenshot button', () => {
      const { getByLabelText } = render(<FeedbackScreen />);
      expect(getByLabelText('Aggiungi Screenshot')).toBeTruthy();
    });

    it('should have correct accessibilityRole on buttons', () => {
      const { getByTestId } = render(<FeedbackScreen />);
      expect(getByTestId('feedback-back-button').props.accessibilityRole).toBe('button');
      expect(getByTestId('send-feedback-button').props.accessibilityRole).toBe('button');
    });
  });

  // ── Logging ────────────────────────────────────────────────────────

  describe('logging', () => {
    it('should log back button press', async () => {
      const { getByTestId } = render(<FeedbackScreen />);
      await act(async () => {
        fireEvent.press(getByTestId('feedback-back-button'));
      });

      expect(mockLoggingInfo).toHaveBeenCalledWith(
        'FeedbackScreen',
        'Back button pressed'
      );
    });

    it('should log feedback send info with correct data', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test log dati');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(mockLoggingInfo).toHaveBeenCalledWith(
          'FeedbackScreen',
          'Invio feedback iniziato',
          { length: 13, hasScreenshot: false }
        );
      });
    });

    it('should log success after feedback is sent', async () => {
      const { getByTestId } = render(<FeedbackScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('feedback-input'), 'Test log successo');
      });

      await act(async () => {
        fireEvent.press(getByTestId('send-feedback-button'));
      });

      await waitFor(() => {
        expect(mockLoggingInfo).toHaveBeenCalledWith(
          'FeedbackScreen',
          'Feedback inviato con successo',
          { success: true }
        );
      });
    });
  });
});
