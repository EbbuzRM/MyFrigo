// dashboard.ts — english catalog for the `dashboard` domain.
//
// exports: dashboardEn
// used_by: i18n/catalogs/en/index.ts
// rules:   Must expose exactly the same keys as `dashboardIt` — enforced at
//          compile time by the `satisfies` constraint (missing/extra keys fail tsc).
//          Plural forms follow i18next `_one`/`_other` suffixes with `{{count}}`.
// agent:   executor | 2026-09-22 | Fase B i18n | gruppo 3a: dashboard

import { dashboardIt } from '../it/dashboard';

export const dashboardEn = {
  title: 'Dashboard',
  welcomeBack: 'Welcome back, {{name}}!',
  pantryTitle: 'Your Pantry',
  subtitle: 'Everything under control',
  titleExpiring: 'Expiring Soon',
  titleStats: 'Quick Stats',
  statsActive: 'Active Products',
  statsExpired: 'Expired Products',
  emptyExpiring_one: 'No products are due to expire in the next {{count}} day. Well done!',
  emptyExpiring_other: 'No products are due to expire in the next {{count}} days. Well done!',
  expiringProductBrand: ', brand {{brand}}',
  expiringProductLabel: 'Product {{name}}{{brand}}, expires {{date}}. Status: {{status}}.',
  expiringProductWithoutDateLabel: 'Product {{name}}{{brand}}. Status: {{status}}.',
  expiringProductHint: 'Tap to view product details',
  unnamedProduct: 'Unnamed product',
  statusFrozen: 'Frozen',
  statusDateNotSet: 'Date not set',
  statusDateInvalid: 'Invalid date',
  statusExpired: 'Expired',
  statusExpiresToday: 'Expires today',
  statusExpiresInDays_one: '{{count}} day',
  statusExpiresInDays_other: '{{count}} days',
  notificationsLabel: 'Notifications',
  profileLabel: 'Profile',
  addProduct: 'Add',
  scanProduct: 'Scan',
  addProductLabel: 'Add product',
  scanBarcodeLabel: 'Scan barcode',
  menuSettings: 'Settings',
  menuLogout: 'Log out',
  closeMenuLabel: 'Close menu',
  settingsLabel: 'Settings',
  logoutLabel: 'Log out',
} satisfies Record<keyof typeof dashboardIt, string>;
