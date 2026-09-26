// options.ts - i18next initialization options, single source of truth.
//
// exports: TRANSLATION_NAMESPACE, createI18nOptions
// used_by: i18n/index.ts (app bootstrap), jest.setup.js (test bootstrap)
// rules:   Pure module: must never import `expo-localization` or `./language`,
//          so tests can build the options before any per-suite mock exists.
//          Bundled catalogs (zero network), fallback language `en`.
// agent:   executor | 2026-09-22 | Fase B i18n | shared init options for app + jest

import type { InitOptions } from 'i18next';
import { enCatalogs } from './catalogs/en';
import { itCatalogs } from './catalogs/it';
import {
  FALLBACK_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './types';

export const TRANSLATION_NAMESPACE = 'translation';

/** i18next `.init()` options for the given active language (bundled catalogs). */
export function createI18nOptions(language: SupportedLanguage): InitOptions {
  return {
    lng: language,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: TRANSLATION_NAMESPACE,
    ns: [TRANSLATION_NAMESPACE],
    resources: {
      it: { [TRANSLATION_NAMESPACE]: itCatalogs },
      en: { [TRANSLATION_NAMESPACE]: enCatalogs },
    },
    interpolation: { escapeValue: false },
    returnNull: false,
  };
}
