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
