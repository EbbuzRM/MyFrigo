// languageReactivity.test.tsx — foreground language sync preserves app state (Fase A i18n).
//
// exports: none
// used_by: jest
// rules:   Deterministic — `expo-localization` is mocked; the AppState listener
//          registration is asserted, the foreground handler is invoked directly.
// agent:   executor | 2026-09-22 | Fase A i18n | TDD

import { useEffect, useState } from 'react';
import { AppState, Text, TextInput, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { getLocales } from 'expo-localization';
import { enCatalogs } from '../catalogs/en';
import { itCatalogs } from '../catalogs/it';
import { getFormattingLocale, initI18n } from '../index';
import { handleAppStateChange, startLanguageSync, stopLanguageSync } from '../sync';

const mockLocale = { languageTag: 'it-IT' };

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: mockLocale.languageTag }]),
}));

let mountCount = 0;

function LanguageProbe() {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  useEffect(() => {
    mountCount += 1;
  }, []);

  return (
    <View>
      <Text testID="label">{t('common.loading')}</Text>
      <Text testID="welcome">{t('dashboard.welcomeBack', { name: 'Ada' })}</Text>
      <TextInput testID="draft" value={draft} onChangeText={setDraft} />
    </View>
  );
}

describe('language reactivity on foreground', () => {
  beforeEach(() => {
    mockLocale.languageTag = 'it-IT';
    mountCount = 0;
    initI18n();
  });

  afterEach(async () => {
    stopLanguageSync();
    await i18next.changeLanguage('it');
  });

  it('registers an AppState change listener', () => {
    const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');

    startLanguageSync();

    expect(addEventListenerSpy).toHaveBeenCalledWith('change', handleAppStateChange);

    addEventListenerSpy.mockRestore();
  });

  it('updates texts and formats on return to foreground without losing form state or remounting', async () => {
    const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');
    startLanguageSync();

    const screen = render(<LanguageProbe />);
    expect(screen.getByTestId('label').props.children).toBe(itCatalogs.common.loading);
    expect(screen.getByTestId('welcome').props.children).toBe('Bentornato, Ada!');

    fireEvent.changeText(screen.getByTestId('draft'), 'bozza salvata');

    // Device language switched to english while the app was in background.
    mockLocale.languageTag = 'en-GB';

    await act(async () => {
      handleAppStateChange('active');
    });

    await waitFor(() => {
      expect(screen.getByTestId('label').props.children).toBe(enCatalogs.common.loading);
    });
    expect(screen.getByTestId('welcome').props.children).toBe('Welcome back, Ada!');
    expect(screen.getByTestId('draft').props.value).toBe('bozza salvata');
    expect(getFormattingLocale()).toBe('en-GB');
    // No forced remount of the tree: the probe mounted exactly once.
    expect(mountCount).toBe(1);
    expect(addEventListenerSpy).toHaveBeenCalledWith('change', handleAppStateChange);

    addEventListenerSpy.mockRestore();
  });

  it('keeps the current language when system preferences are unchanged', async () => {
    const changeLanguageSpy = jest.spyOn(i18next, 'changeLanguage');

    await act(async () => {
      handleAppStateChange('active');
    });

    expect(changeLanguageSpy).not.toHaveBeenCalled();

    changeLanguageSpy.mockRestore();
  });

  it('ignores background transitions', async () => {
    const changeLanguageSpy = jest.spyOn(i18next, 'changeLanguage');

    handleAppStateChange('background');

    expect(changeLanguageSpy).not.toHaveBeenCalled();

    changeLanguageSpy.mockRestore();
  });
});
