// i18next.d.ts — type-safe translation keys.
//
// exports: module augmentation for i18next CustomTypeOptions
// used_by: tsc (compile-time only)
// rules:   Keys are the union derived from the `it` catalogs (source of truth);
//          `en` is type-checked against `it` at each catalog import site.
//          Adding a language = add its catalogs + this resource entry + tests.
// agent:   executor | 2026-09-22 | Fase A i18n | initial infrastructure

import type { ItCatalogs } from './catalogs/it';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: ItCatalogs;
    };
  }
}
