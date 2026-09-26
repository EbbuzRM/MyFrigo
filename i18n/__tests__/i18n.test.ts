// i18n.test.ts — i18next bootstrap, fallback and formatting locale (Fase A i18n).
//
// exports: none
// used_by: jest
// rules:   Deterministic — `expo-localization` is mocked, catalogs are bundled (no network).
// agent:   executor | 2026-09-22 | Fase A i18n | TDD

import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { enCatalogs } from '../catalogs/en';
import { itCatalogs } from '../catalogs/it';
import { getFormattingLocale, initI18n } from '../index';
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from '../types';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(),
}));

const mockGetLocales = getLocales as jest.Mock;

describe('initI18n', () => {
  beforeEach(() => {
    mockGetLocales.mockReset();
    mockGetLocales.mockReturnValue([{ languageTag: 'it-IT' }]);
    initI18n();
  });

  afterEach(async () => {
    await i18next.changeLanguage('it');
  });

  it('initializes i18next with the bundled catalogs before any render', () => {
    expect(i18next.isInitialized).toBe(true);
    expect(i18next.language).toBe('it');
  });

  it('translates typed keys with the italian catalog, never the raw key', () => {
    expect(i18next.t('products.empty')).toBe(itCatalogs.products.empty);
    expect(i18next.t('products.empty')).not.toBe('products.empty');
    expect(i18next.t('common.loading')).toBe(itCatalogs.common.loading);
  });

  it('interpolates parameters at call time', () => {
    expect(i18next.t('dashboard.welcomeBack', { name: 'Ada' })).toBe('Bentornato, Ada!');
  });

  it('resolves italian plural forms through {{count}}', () => {
    expect(i18next.t('products.count', { count: 1 })).toBe('1 prodotto');
    expect(i18next.t('products.count', { count: 3 })).toBe('3 prodotti');
  });

  it('uses en as i18next fallback language with both languages supported', () => {
    // i18next normalizes fallbackLng internally (string → array).
    const configuredFallback = i18next.options.fallbackLng;
    const fallbackList = Array.isArray(configuredFallback) ? configuredFallback : [configuredFallback];
    expect(fallbackList).toContain(FALLBACK_LANGUAGE);

    // i18next appends its internal 'cimode' probe language to supportedLngs.
    const configuredSupported = i18next.options.supportedLngs;
    const supportedList = Array.isArray(configuredSupported)
      ? configuredSupported.filter((language) => language !== 'cimode')
      : [];
    expect(supportedList).toEqual([...SUPPORTED_LANGUAGES]);
  });

  it('falls back to the english catalog when a key is missing in italian', async () => {
    const itCatalogsWithoutProducts = Object.fromEntries(
      Object.entries(itCatalogs).filter(([domain]) => domain !== 'products'),
    );
    const probe = i18next.createInstance();
    await probe.init({
      lng: 'it',
      fallbackLng: FALLBACK_LANGUAGE,
      resources: {
        it: { translation: itCatalogsWithoutProducts },
        en: { translation: enCatalogs },
      },
    });

    expect(probe.t('products.empty')).toBe(enCatalogs.products.empty);
  });

  it('is idempotent: re-initializing keeps the same instance', () => {
    expect(initI18n()).toBe(i18next);
    expect(i18next.isInitialized).toBe(true);
  });
});

describe('getFormattingLocale', () => {
  beforeEach(() => {
    mockGetLocales.mockReset();
    mockGetLocales.mockReturnValue([{ languageTag: 'it-IT' }]);
    initI18n();
  });

  afterEach(async () => {
    await i18next.changeLanguage('it');
  });

  it('reads the active language live: it-IT for italian, en-GB for english', async () => {
    expect(getFormattingLocale()).toBe('it-IT');

    await i18next.changeLanguage('en');

    expect(getFormattingLocale()).toBe('en-GB');
  });
});
