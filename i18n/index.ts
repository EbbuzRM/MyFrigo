// index.ts — i18next bootstrap: bundled catalogs, typed keys, language resolution.
//
// exports: initI18n, getCurrentLanguage, getFormattingLocale
// used_by: i18n/setup.ts (app entry), i18n/sync.ts, i18n/__tests__/*
// rules:   Catalogs are bundled (zero network). Fallback language is `en`.
//          Language comes from the device only — never persisted.
//          Nothing language-dependent is resolved at module scope: texts/formats
//          must stay reactive (read via t()/getFormattingLocale() at use time).
// agent:   executor | 2026-09-22 | Fase A i18n | initial infrastructure

import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createI18nOptions } from './options';
import { getSystemLanguage, resolveSystemLanguage } from './language';
import { FORMAT_LOCALES, type SupportedLanguage } from './types';

/**
 * Initialize (or re-align) i18next with the bundled catalogs BEFORE the first
 * render, so login and early errors are already translated. Idempotent: calling
 * it again only re-syncs the language with the current device preferences.
 */
export function initI18n(): I18nInstance {
  const language: SupportedLanguage = getSystemLanguage();

  if (!i18next.isInitialized) {
    void i18next.use(initReactI18next).init(createI18nOptions(language));
  } else if (i18next.language !== language) {
    void i18next.changeLanguage(language);
  }

  return i18next;
}

/** Active language, normalized to a {@link SupportedLanguage} (fallback `en`). */
export function getCurrentLanguage(): SupportedLanguage {
  return resolveSystemLanguage([i18next.language]);
}

/**
 * Formatting locale for the active language (`it-IT` / `en-GB`: metric units,
 * day/month dates). Read live on every call — never cached, so it follows
 * foreground language changes.
 */
export function getFormattingLocale(language: SupportedLanguage = getCurrentLanguage()): string {
  return FORMAT_LOCALES[language];
}
