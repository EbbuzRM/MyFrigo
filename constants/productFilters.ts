// productFilters.ts — productFilters module.
//
// exports: ProductStatusFilter | StatusFilterConfig | STATUS_FILTERS | DEFAULT_NOTIFICATION_DAYS | AUTO_REFRESH_INTERVAL
// used_by: app\(tabs)\products.tsx
//                   components\products\StatusFilterBar.tsx
//                   hooks\useProductFilters.ts
// rules:   - Adding new product status filter categories requires extending both the `ProductStatusFilter` type union and the `STATUS_FILTERS` constant array in tandem to maintain type safety.
//          - All filter keys must have corresponding entries in `StatusFilterConfig` with valid label and accessibilityLabel properties for UI rendering.
//          - Any changes to filter configurations must keep the 'all' key as the first entry and default filter option.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Status filter types for product filtering
 */
export type ProductStatusFilter = 'all' | 'fresh' | 'expiring' | 'expired';

/**
 * Configuration interface for status filter buttons
 */
export interface StatusFilterConfig {
  key: ProductStatusFilter;
  label: string;
  accessibilityLabel: string;
}

/**
 * Status filter button configurations
 * Defines the available status filters with their labels and accessibility properties
 */
export const STATUS_FILTERS: StatusFilterConfig[] = [
  { key: 'all', label: 'Tutti', accessibilityLabel: 'Mostra tutti i prodotti' },
  { key: 'fresh', label: 'Freschi', accessibilityLabel: 'Mostra prodotti freschi' },
  { key: 'expiring', label: 'In Scadenza', accessibilityLabel: 'Mostra prodotti in scadenza' },
  { key: 'expired', label: 'Scaduti', accessibilityLabel: 'Mostra prodotti scaduti' },
];

/**
 * Default notification days threshold
 * Used when calculating if a product is expiring
 */
export const DEFAULT_NOTIFICATION_DAYS = 4;

/**
 * Auto-refresh interval in milliseconds (2 minutes)
 */
export const AUTO_REFRESH_INTERVAL = 120000;
