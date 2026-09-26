// types.ts — i18n shared types and constants.
//
// exports: SUPPORTED_LANGUAGES, SupportedLanguage, FALLBACK_LANGUAGE,
//          TRANSLATION_DOMAINS, TranslationDomain, FORMAT_LOCALES
// used_by: i18n/*
// rules:   Language comes from the device only — never persisted in app_settings.
// agent:   executor | 2026-09-22 | Fase A i18n | initial infrastructure

/** Languages the app ships translations for. */
export const SUPPORTED_LANGUAGES = ['it', 'en'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Used when the device preferences resolve to no supported language (plan: fallback `en`). */
export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

/** Catalog domains — exact list from the i18n plan, one directory pair (it/en) each. */
export const TRANSLATION_DOMAINS = [
  'common',
  'auth',
  'dashboard',
  'products',
  'categories',
  'history',
  'settings',
  'scanner',
  'errors',
  'accessibility',
  'notifications',
] as const;

export type TranslationDomain = (typeof TRANSLATION_DOMAINS)[number];

/**
 * Locale used for formatting (metric units, day/month dates):
 * `it-IT` for Italian, `en-GB` for English.
 */
export const FORMAT_LOCALES: Readonly<Record<SupportedLanguage, string>> = {
  it: 'it-IT',
  en: 'en-GB',
};
