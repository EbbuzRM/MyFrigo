import { act, renderHook } from '@testing-library/react-native';
import i18next from 'i18next';
import { Alert } from 'react-native';
import { initI18n } from '@/i18n';
import { itCatalogs } from '@/i18n/catalogs/it';
import { usePostRegistration } from '../usePostRegistration';
import { REGISTRATION_ERROR_CODES } from '../useRegistration.types';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'it-IT' }]),
}));

describe('usePostRegistration', () => {
  const onSuccess = jest.fn();
  const onNeedsConfirmation = jest.fn();
  const onLogin = jest.fn();
  const onPasswordRecovery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    initI18n();
  });

  afterEach(async () => {
    await i18next.changeLanguage('it');
  });

  it('shows the same neutral next-step alert for an unconfirmed signup', () => {
    const { result } = renderHook(() =>
      usePostRegistration({
        onSuccess,
        onNeedsConfirmation,
        onLogin,
        onPasswordRecovery,
      })
    );

    act(() => {
      result.current(
        { success: true, userId: 'opaque-user-id', emailConfirmed: false },
        'person@example.com'
      );
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      itCatalogs.auth.alertTitles_checkEmail,
      itCatalogs.auth.postRegistration_checkEmailNeutral,
      expect.arrayContaining([
        expect.objectContaining({ text: itCatalogs.auth.postRegistration_enterCodeButton }),
        expect.objectContaining({ text: itCatalogs.auth.postRegistration_loginButton }),
        expect.objectContaining({ text: itCatalogs.auth.postRegistration_recoverPasswordButton }),
      ])
    );
  });

  it.each([
    [itCatalogs.auth.postRegistration_enterCodeButton, 'onNeedsConfirmation'],
    [itCatalogs.auth.postRegistration_loginButton, 'onLogin'],
    [itCatalogs.auth.postRegistration_recoverPasswordButton, 'onPasswordRecovery'],
  ] as const)('routes the %s action without exposing account existence', (buttonText, callbackName) => {
    const callbacks = {
      onSuccess,
      onNeedsConfirmation,
      onLogin,
      onPasswordRecovery,
    };
    const { result } = renderHook(() => usePostRegistration(callbacks));

    act(() => {
      result.current({ success: true, emailConfirmed: false }, 'person@example.com');
    });

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const button = buttons.find((candidate: { text: string }) => candidate.text === buttonText);

    act(() => {
      button?.onPress?.();
    });

    if (callbackName === 'onNeedsConfirmation') {
      expect(onNeedsConfirmation).toHaveBeenCalledWith('person@example.com');
    } else {
      expect(callbacks[callbackName]).toHaveBeenCalledTimes(1);
    }
  });

  it('maps a registration error code to the catalog text (never the raw code)', () => {
    const { result } = renderHook(() =>
      usePostRegistration({
        onSuccess,
        onNeedsConfirmation,
        onLogin,
        onPasswordRecovery,
      })
    );

    let out: { error?: string } | undefined;
    act(() => {
      out = result.current(
        { success: false, error: REGISTRATION_ERROR_CODES.REGISTRATION_FAILED },
        'person@example.com'
      ) as { error?: string };
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      itCatalogs.auth.alertTitles_registrationError,
      itCatalogs.auth.errors_registrationFailed,
      expect.arrayContaining([expect.objectContaining({ text: itCatalogs.auth.ok })])
    );
    expect(out?.error).toBe(itCatalogs.auth.errors_registrationFailed);
  });

  it('falls back to the unknown-error catalog text for unrecognized codes', () => {
    const { result } = renderHook(() =>
      usePostRegistration({
        onSuccess,
        onNeedsConfirmation,
        onLogin,
        onPasswordRecovery,
      })
    );

    act(() => {
      result.current({ success: false, error: 'not_a_real_code' }, 'person@example.com');
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      itCatalogs.auth.alertTitles_registrationError,
      itCatalogs.auth.errors_unknownError,
      expect.anything()
    );
  });
});
