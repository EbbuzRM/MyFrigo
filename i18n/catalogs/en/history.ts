// history.ts — english catalog for the `history` domain.
//
// exports: historyEn
// used_by: i18n/catalogs/en/index.ts
// rules:   Must expose exactly the same keys as `historyIt` — enforced at
//          compile time by the `satisfies` constraint (missing/extra keys fail tsc).
// agent:   executor | 2026-09-22 | Fase B i18n | gruppo 3a: storico
//          (gruppo 1: caricamenti HistoryLoadingState)

import { historyIt } from '../it/history';

export const historyEn = {
  title: 'History',
  empty: 'No entries in history',
  loadingStats: 'Loading statistics...',
  loadingStatsSubtitle: 'Analysing your products and habits',
  headerTitle: 'Your Habits',
  headerSubtitle: 'Analysis of your consumption and waste',
  statsTotal: 'Total Managed',
  statsConsumed: 'Consumed',
  statsWasted: 'Wasted',
  statsWasteRate: 'Waste %',
  historyAllTitle: 'Full History',
  consumedTitle: 'Consumed Products',
  expiredTitle: 'Expired Products',
  detailFallbackTitle: 'History Detail',
  consumedEmpty: 'No recently consumed products.',
  detailEmpty: 'No products to show.',
  loadError: 'An error occurred while loading the products.',
  dataLoadError: 'An error occurred while loading history data.',
  loadTimeoutError: 'Loading took too long. Try again later.',
  restoreTitle: 'Product Restored',
  restoreMessage: 'The product has been moved back to your pantry.',
  restoreErrorTitle: 'Error',
  restoreErrorMessage: 'An error occurred while restoring the product.',
  restoreProductLabel: 'Restore product',
  restoreProduct: 'Restore',
  restoreHint: 'Move this product back to your pantry.',
  cardStatusLabel: 'Status: {{status}}',
  cardDateLabel: '{{status}}: {{date}}',
  statusConsumed: 'Consumed',
  statusExpired: 'Expired',
  backLabel: 'Go back',
  suggestionInfoTitle: 'Item consumed by mistake?',
  suggestionInfoText: "Tap the 'Consumed' card to view the list and restore products.",
  suggestionWarningTitle: 'Watch Out for Expired Products',
  suggestionWarningText: 'About {{waste}}% of your products have expired. Try checking dates more often.',
  suggestionPositiveTitle: 'Great Management!',
  suggestionPositiveText: 'Fewer than {{waste}}% of your products expire. Keep it up!',
} satisfies Record<keyof typeof historyIt, string>;
