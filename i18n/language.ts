// language.ts — system language resolution.
//
// exports: resolveSystemLanguage, getPreferredLanguageTags, getSystemLanguage
// used_by: i18n/index.ts, i18n/sync.ts, i18n/__tests__/*
// rules:   First supported system preference wins; no supported preference or an
//          empty list falls back to `en`. All italian variants (it-IT, it-CH, it-…)
//          map to `it`, all english variants (en-GB, en-US, en-AU, …) to `en`.
// agent:   executor | 2026-09-22 | Fase A i18n | initial infrastructure

import { getLocales } from 'expo-localization';
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from './types';

function toBaseLanguage(tag: string): string {
  return tag.toLowerCase().split(/[-_]/)[0];
}

function findSupported(baseLanguage: string): SupportedLanguage | undefined {
  return SUPPORTED_LANGUAGES.find((supported) => supported === baseLanguage);
}

/**
 * Resolve the app language from the ordered list of system language tags
 * (i.e. `expo-localization` `languageTag`s): picks the FIRST supported
 * preference, otherwise falls back to {@link FALLBACK_LANGUAGE}.
 */
export function resolveSystemLanguage(
  preferredLanguageTags: readonly (string | undefined)[],
): SupportedLanguage {
  for (const tag of preferredLanguageTags) {
    if (!tag) continue;
    const supported = findSupported(toBaseLanguage(tag));
    if (supported !== undefined) return supported;
  }
  return FALLBACK_LANGUAGE;
}

/** System preferred language tags, in device preference order. */
export function getPreferredLanguageTags(): string[] {
  return getLocales().map((locale) => locale.languageTag);
}

/** Language resolved from the live device preferences (no persistence). */
export function getSystemLanguage(): SupportedLanguage {
  return resolveSystemLanguage(getPreferredLanguageTags());
}
