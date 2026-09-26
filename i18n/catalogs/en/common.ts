// common.ts — english catalog for the `common` domain.
//
// exports: commonEn
// used_by: i18n/catalogs/en/index.ts
// rules:   Must expose exactly the same keys as `commonIt` — enforced at
//          compile time by the `satisfies` constraint (missing/extra keys fail tsc).
// agent:   executor | 2026-09-22 | Fase B i18n | gruppo 1: navigazione, pulsanti, dialoghi, caricamenti, stati vuoti

import { commonIt } from '../it/common';

export const commonEn = {
  loading: 'Loading…',
  loadingProducts: 'Loading products...',
  retry: 'Retry',
  cancel: 'Cancel',
  ok: 'OK',
  error: 'Error',
  done: 'Done',
  continue: 'Continue',
  delete: 'Delete',
  back: 'Back',
  goBack: 'Go back',
  requiredField: 'Required field',
  optionalField: 'Optional field',
  confirm: 'Confirm',
  save: 'Save',
  close: 'Close',

  // Navigation: tab bar labels (visible + accessibility)
  tabHome: 'Home',
  tabProducts: 'Products',
  tabAdd: 'Add',
  tabHistory: 'History',
  tabSettings: 'Settings',
  tabHomeLabel: 'Home tab',
  tabProductsLabel: 'Products tab',
  tabAddLabel: 'Add tab',
  tabHistoryLabel: 'History tab',
  tabSettingsLabel: 'Settings tab',

  // Navigation: not-found screen
  notFoundTitle: 'Page not found',
  redirectingMessage: 'Redirecting you shortly...',

  // Error boundary fallback
  errorTitle: 'Something went wrong',
  errorRetryMessage: 'Try reopening the app',
  errorRetryHint: 'Tries to restore the app after an error',

  // Shared modal actions / headers
  saving: 'Saving...',
  closeModalLabel: 'Close modal',
  tapToCloseHint: 'Tap to close',

  // Shared password input
  passwordPlaceholder: 'Enter password',
  showPasswordLabel: 'Show password',
  hidePasswordLabel: 'Hide password',

  // Shared form action buttons
  saveProduct: 'Save product',
  updateProduct: 'Update product',
  saveProductHint: 'Saves the new product',
  updateProductHint: 'Updates the existing product',

  // Global update modal
  closeUpdateModalLabel: 'Close update modal',
  updateAvailableTitle: 'Update available',
  updateDownloading: 'Downloading... {{percent}}%',
  updateInstalling: 'Installation in progress...',
  updateInstallComplete: 'Installation complete!',
  updateDownloaded: 'Update downloaded successfully!',
  updateError: 'Error while updating. Try again later.',
  updateNewVersion: 'New version available: {{version}}',
  currentVersion: 'Current version:',
  newVersion: 'New version:',
  notAvailable: 'N/A',
  restartApp: 'Restart app',
  later: 'Later',
  installNow: 'Install now',
} satisfies Record<keyof typeof commonIt, string>;
