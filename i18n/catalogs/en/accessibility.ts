// accessibility.ts — english catalog for the `accessibility` domain.
//
// exports: accessibilityEn
// used_by: i18n/catalogs/en/index.ts
// rules:   Must expose exactly the same keys as `accessibilityIt` — enforced at
//          compile time by the `satisfies` constraint (missing/extra keys fail tsc).
// agent:   executor | 2026-09-22 | Fase A i18n | base keys (content migrates in Fase B)

import { accessibilityIt } from '../it/accessibility';

export const accessibilityEn = {
  categoryFilterCount_one: 'Category {{name}}, {{count}} product',
  categoryFilterCount_other: 'Category {{name}}, {{count}} products',
  categoryFilterSelected: 'Category already selected',
  categoryFilterHint: 'Tap to filter products by category {{name}}',
  loadingIndicator: 'Loading content',
  closeButtonLabel: 'Close button',
  categoryIconLabel: 'Category icon: {{name}}',
  statsCardHint: 'Tap to view more details',
  productCardHint: 'Tap to view product details',
  productBrandLabel: ', brand {{brand}}',
  productCategoryLabel: ', category {{category}}',
  productExpirationDateLabel: ', expires {{date}}',
  productsListLabel: 'Product list',
  refreshProductsListLabel: 'Refresh product list',
  consumeProductLabel: 'Mark {{name}} as consumed',
  consumeProductHint: 'Tap to mark {{name}} as consumed',
  deleteProductLabel: 'Delete {{name}}',
  deleteProductHint: 'Tap to delete {{name}}',
} satisfies Record<keyof typeof accessibilityIt, string>;
