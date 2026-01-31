/**
 * Card accessibility utilities for React Native
 * @module utils/accessibility/cards
 * 
 * @example
 * ```tsx
 * import { getProductCardAccessibilityProps, getStatsCardAccessibilityProps } from '@/utils/accessibility/cards';
 * 
 * // Product card
 * const productProps = getProductCardAccessibilityProps(product, category);
 * 
 * // Stats card
 * const statsProps = getStatsCardAccessibilityProps('Total Products', '42', true);
 * ```
 */

import { Product, ProductCategory } from '@/types/Product';
import { createAccessibilityProps, AccessibilityAttributes } from './buttons';

/**
 * Expiration status information interface
 * @interface
 */
export interface ExpirationStatus {
  /** Display text for the expiration status */
  text: string;
}

/**
 * Formats a date for accessibility labels
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in Italian locale
 * @internal
 */
function formatExpirationDate(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return `, scade il ${date.toLocaleDateString('it-IT')}`;
}

/**
 * Creates accessibility props for a product card
 * 
 * @param product - Product data
 * @param category - Optional product category
 * @returns AccessibilityAttributes for product card
 * 
 * @example
 * ```tsx
 * const product = { name: 'Milk', brand: 'Brand', expirationDate: '2024-12-31' };
 * const category = { name: 'Dairy' };
 * <TouchableOpacity {...getProductCardAccessibilityProps(product, category)}>
 *   <ProductCardContent product={product} />
 * </TouchableOpacity>
 * // Screen reader: "Milk, marca Brand, categoria Dairy, scade il 31/12/2024. Tocca per visualizzare i dettagli del prodotto"
 * ```
 */
export function getProductCardAccessibilityProps(
  product: Product,
  category?: ProductCategory
): AccessibilityAttributes {
  const productName = product.name || 'Prodotto senza nome';
  const brandInfo = product.brand ? `, marca ${product.brand}` : '';
  const categoryInfo = category ? `, categoria ${category.name}` : '';
  const expirationInfo = formatExpirationDate(product.expirationDate);

  return createAccessibilityProps({
    role: 'button',
    label: `${productName}${brandInfo}${categoryInfo}${expirationInfo}`,
    hint: 'Tocca per visualizzare i dettagli del prodotto',
  });
}

/**
 * Creates accessibility props for a settings card
 * 
 * @param title - Setting title
 * @param description - Optional setting description
 * @param hasControl - Whether the card contains an interactive control (e.g., Switch)
 * @returns AccessibilityAttributes for settings card
 * 
 * @example
 * ```tsx
 * // Settings card with switch
 * <View {...getSettingsCardAccessibilityProps('Dark Mode', 'Enable dark theme', true)}>
 *   <Text>Dark Mode</Text>
 *   <Switch value={isDarkMode} />
 * </View>
 * 
 * // Settings card without control (navigates to sub-screen)
 * <TouchableOpacity {...getSettingsCardAccessibilityProps('Notifications', 'Manage notification preferences', false)}>
 *   <Text>Notifications</Text>
 *   <Icon name="chevron-right" />
 * </TouchableOpacity>
 * ```
 */
export function getSettingsCardAccessibilityProps(
  title: string,
  description?: string,
  hasControl?: boolean
): AccessibilityAttributes {
  const label = description ? `${title}, ${description}` : title;
  const hint = hasControl
    ? "Contiene un controllo interattivo"
    : "Tocca per modificare questa impostazione";

  return createAccessibilityProps({
    role: hasControl ? 'none' : 'button',
    label,
    hint,
  });
}

/**
 * Creates accessibility props for a statistics card
 * 
 * @param title - Statistic title
 * @param value - Statistic value
 * @param isClickable - Whether the card is clickable for more details
 * @returns AccessibilityAttributes for statistics card
 * 
 * @example
 * ```tsx
 * // Clickable stats card
 * <TouchableOpacity {...getStatsCardAccessibilityProps('Expiring Soon', '5 items', true)}>
 *   <StatDisplay title="Expiring Soon" value="5" />
 * </TouchableOpacity>
 * 
 * // Non-clickable stats card
 * <View {...getStatsCardAccessibilityProps('Total Products', '42', false)}>
 *   <StatDisplay title="Total Products" value="42" />
 * </View>
 * ```
 */
export function getStatsCardAccessibilityProps(
  title: string,
  value: string,
  isClickable: boolean
): AccessibilityAttributes {
  const label = `${title}: ${value}`;
  const hint = isClickable ? "Tocca per visualizzare maggiori dettagli" : undefined;

  return createAccessibilityProps({
    role: isClickable ? 'button' : 'text',
    label,
    hint,
  });
}

/**
 * Creates accessibility props for an expiration card
 * 
 * @param product - Product data
 * @param expirationStatus - Expiration status with display text
 * @returns AccessibilityAttributes for expiration card
 * 
 * @example
 * ```tsx
 * const status = { text: 'Scade domani' };
 * <TouchableOpacity {...getExpirationCardAccessibilityProps(product, status)}>
 *   <ExpirationCardContent product={product} status={status} />
 * </TouchableOpacity>
 * // Screen reader: "Milk, marca Brand, scade il 31/12/2024, stato: Scade domani. Tocca per visualizzare i dettagli del prodotto"
 * ```
 */
export function getExpirationCardAccessibilityProps(
  product: Product,
  expirationStatus: ExpirationStatus
): AccessibilityAttributes {
  const productName = product.name || 'Prodotto senza nome';
  const brandInfo = product.brand ? `, marca ${product.brand}` : '';
  const expirationInfo = formatExpirationDate(product.expirationDate);
  const statusInfo = `, stato: ${expirationStatus.text}`;

  return createAccessibilityProps({
    role: 'button',
    label: `${productName}${brandInfo}${expirationInfo}${statusInfo}`,
    hint: 'Tocca per visualizzare i dettagli del prodotto',
  });
}
