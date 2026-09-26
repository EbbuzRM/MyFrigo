// index.ts — english catalogs, one entry per translation domain.
//
// exports: enCatalogs, EnCatalogs
// used_by: i18n/index.ts, i18n/__tests__/*
// rules:   Must cover exactly TRANSLATION_DOMAINS; per-domain key equivalence with
//          `it` is enforced at compile time by each catalog's `satisfies` constraint
//          and re-checked at runtime by i18n/__tests__/catalogs.test.ts.
// agent:   executor | 2026-09-22 | Fase A i18n | initial infrastructure

import { type TranslationDomain } from '../../types';
import { accessibilityEn } from './accessibility';
import { authEn } from './auth';
import { categoriesEn } from './categories';
import { commonEn } from './common';
import { dashboardEn } from './dashboard';
import { errorsEn } from './errors';
import { historyEn } from './history';
import { notificationsEn } from './notifications';
import { productsEn } from './products';
import { scannerEn } from './scanner';
import { settingsEn } from './settings';

export const enCatalogs = {
  common: commonEn,
  auth: authEn,
  dashboard: dashboardEn,
  products: productsEn,
  categories: categoriesEn,
  history: historyEn,
  settings: settingsEn,
  scanner: scannerEn,
  errors: errorsEn,
  accessibility: accessibilityEn,
  notifications: notificationsEn,
} satisfies Record<TranslationDomain, Record<string, string>>;

export type EnCatalogs = typeof enCatalogs;
