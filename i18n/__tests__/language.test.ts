// language.test.ts — system language resolution (Fase A i18n).
//
// exports: none
// used_by: jest
// rules:   Deterministic — `expo-localization` is mocked, no network.
// agent:   executor | 2026-09-22 | Fase A i18n | TDD

import { getLocales } from 'expo-localization';
import { getPreferredLanguageTags, getSystemLanguage, resolveSystemLanguage } from '../language';
import { FALLBACK_LANGUAGE, FORMAT_LOCALES, SUPPORTED_LANGUAGES } from '../types';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(),
}));

const mockGetLocales = getLocales as jest.Mock;

describe('resolveSystemLanguage', () => {
  it('maps it-IT to it', () => {
    expect(resolveSystemLanguage(['it-IT'])).toBe('it');
  });

  it('maps it-CH to it', () => {
    expect(resolveSystemLanguage(['it-CH'])).toBe('it');
  });

  it('maps any italian variant to it', () => {
    expect(resolveSystemLanguage(['it'])).toBe('it');
    expect(resolveSystemLanguage(['IT-x'])).toBe('it');
  });

  it('maps en-GB to en', () => {
    expect(resolveSystemLanguage(['en-GB'])).toBe('en');
  });

  it('maps en-US to en', () => {
    expect(resolveSystemLanguage(['en-US'])).toBe('en');
  });

  it('maps any english variant to en', () => {
    expect(resolveSystemLanguage(['en-AU'])).toBe('en');
  });

  it('picks the first supported preference when multiple are listed', () => {
    expect(resolveSystemLanguage(['fr-FR', 'it-CH', 'en-US'])).toBe('it');
    expect(resolveSystemLanguage(['de-DE', 'en-AU', 'it-IT'])).toBe('en');
  });

  it('falls back to en when no preference is supported', () => {
    expect(resolveSystemLanguage(['fr-FR', 'de-DE', 'ja-JP'])).toBe(FALLBACK_LANGUAGE);
  });

  it('falls back to en for an empty preference list', () => {
    expect(resolveSystemLanguage([])).toBe(FALLBACK_LANGUAGE);
  });
});

describe('getSystemLanguage', () => {
  beforeEach(() => {
    mockGetLocales.mockReset();
  });

  it('reads the ordered language tags via expo-localization', () => {
    mockGetLocales.mockReturnValue([{ languageTag: 'it-CH' }, { languageTag: 'en-GB' }]);
    expect(getPreferredLanguageTags()).toEqual(['it-CH', 'en-GB']);
    expect(getSystemLanguage()).toBe('it');
  });

  it('falls back to en for unsupported system locales', () => {
    mockGetLocales.mockReturnValue([{ languageTag: 'pt-BR' }]);
    expect(getSystemLanguage()).toBe('en');
  });
});

describe('formatting locales', () => {
  it('uses it-IT for italian and en-GB for english', () => {
    expect(FORMAT_LOCALES.it).toBe('it-IT');
    expect(FORMAT_LOCALES.en).toBe('en-GB');
  });

  it('covers exactly the supported languages', () => {
    expect(Object.keys(FORMAT_LOCALES).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
  });
});
