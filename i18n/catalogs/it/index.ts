// index.ts — italian catalogs, one entry per translation domain.
//
// exports: itCatalogs, ItCatalogs
// used_by: i18n/index.ts, i18n/i18next.d.ts, i18n/__tests__/*
// rules:   Must cover exactly TRANSLATION_DOMAINS (compile-time via `satisfies`,
//          parity with `en` re-checked in tests).
// agent:   executor | 2026-09-22 | Fase A i18n | initial infrastructure

import { type TranslationDomain } from '../../types';
import { accessibilityIt } from './accessibility';
import { authIt } from './auth';
import { categoriesIt } from './categories';
import { commonIt } from './common';
import { dashboardIt } from './dashboard';
import { errorsIt } from './errors';
import { historyIt } from './history';
import { notificationsIt } from './notifications';
import { productsIt } from './products';
import { scannerIt } from './scanner';
import { settingsIt } from './settings';

export const itCatalogs = {
  common: commonIt,
  auth: authIt,
  dashboard: dashboardIt,
  products: productsIt,
  categories: categoriesIt,
  history: historyIt,
  settings: settingsIt,
  scanner: scannerIt,
  errors: errorsIt,
  accessibility: accessibilityIt,
  notifications: notificationsIt,
} satisfies Record<TranslationDomain, Record<string, string>>;

export type ItCatalogs = typeof itCatalogs;
