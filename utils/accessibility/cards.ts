// cards.ts — cards module.
//
// exports: ExpirationStatus | getProductCardAccessibilityProps | getSettingsCardAccessibilityProps | getStatsCardAccessibilityProps | getExpirationCardAccessibilityProps
// used_by: none
// rules:   No architectural constraints detected for this module.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Card accessibility utilities for React Native
 * @module utils/accessibility/cards
 * 
 * @example
 * ```tsx
 * import { getProductCardAccessibilityProps, getStatsCardAccessibilityProps } from '@/utils/accessibility/cards';
 * 
 * // Product card
 * const productProps = getProductCardAccessibilityProps(product, category, t);
 * 
 * // Stats card
 * const statsProps = getStatsCardAccessibilityProps('Total Products', '42', true, t);
 * ```
 */

import { Product, ProductCategory } from '@/types/Product';
import { createAccessibilityProps, AccessibilityAttributes } from './buttons';
import type { TFunction } from 'i18next';
import { getCurrentLanguage } from '@/i18n';
import { formatDisplayDate } from '@/i18n/format';
import { getCategoryLabel } from '@/utils/categoryLabels';

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
function formatExpirationDate(dateString: string | Date | undefined, t: TFunction): string {
  if (!dateString) return '';
  const date = formatDisplayDate(dateString, getCurrentLanguage());
  return t('accessibility.productExpirationDateLabel', {
    date: date ?? '',
  });
}

function formatExpirationDateValue(dateString: string | Date): string {
  return formatDisplayDate(dateString, getCurrentLanguage()) ?? '';
}

/**
 * Creates accessibility props for a product card
 * 
 * @param product - Product data
 * @param category - Optional product category, or `undefined`
 * @param t - Translation function for localized accessibility copy
 * @returns AccessibilityAttributes for product card
 * 
 * @example
 * ```tsx
 * const product = { name: 'Milk', brand: 'Brand', expirationDate: '2024-12-31' };
 * const category = { name: 'Dairy' };
 * <TouchableOpacity {...getProductCardAccessibilityProps(product, category, t)}>
 *   <ProductCardContent product={product} />
 * </TouchableOpacity>
 * // Screen reader: "Milk, marca Brand, categoria Dairy, scade il 31/12/2024. Tocca per visualizzare i dettagli del prodotto"
 * ```
 */
export function getProductCardAccessibilityProps(
  product: Product,
  category: ProductCategory | undefined,
  t: TFunction,
): AccessibilityAttributes {
  const productName = product.name || t('dashboard.unnamedProduct');
  const brandInfo = product.brand ? t('accessibility.productBrandLabel', { brand: product.brand }) : '';
  const categoryInfo = category
    ? t('accessibility.productCategoryLabel', { category: getCategoryLabel(category, getCurrentLanguage()) })
    : '';
  const expirationInfo = formatExpirationDate(product.expirationDate, t);

  return createAccessibilityProps({
    role: 'button',
    label: `${productName}${brandInfo}${categoryInfo}${expirationInfo}`,
    hint: t('accessibility.productCardHint'),
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
 * @param t - Translation function for localized accessibility copy
 * @returns AccessibilityAttributes for statistics card
 * 
 * @example
 * ```tsx
 * // Clickable stats card
 * <TouchableOpacity {...getStatsCardAccessibilityProps('Expiring Soon', '5 items', true, t)}>
 *   <StatDisplay title="Expiring Soon" value="5" />
 * </TouchableOpacity>
 * 
 * // Non-clickable stats card
 * <View {...getStatsCardAccessibilityProps('Total Products', '42', false, t)}>
 *   <StatDisplay title="Total Products" value="42" />
 * </View>
 * ```
 */
export function getStatsCardAccessibilityProps(
  title: string,
  value: string,
  isClickable: boolean,
  t: TFunction,
): AccessibilityAttributes {
  const label = `${title}: ${value}`;
  const hint = isClickable ? t('accessibility.statsCardHint') : undefined;

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
  expirationStatus: ExpirationStatus,
  t: TFunction,
): AccessibilityAttributes {
  const productName = product.name || t('dashboard.unnamedProduct');
  const brand = product.brand ? t('dashboard.expiringProductBrand', { brand: product.brand }) : '';
  const labelOptions = { name: productName, brand, status: expirationStatus.text };
  const formattedDate = product.expirationDate
    ? formatExpirationDateValue(product.expirationDate)
    : '';
  const label = formattedDate
    ? t('dashboard.expiringProductLabel', { ...labelOptions, date: formattedDate })
    : t('dashboard.expiringProductWithoutDateLabel', labelOptions);

  return createAccessibilityProps({
    role: 'button',
    label,
    hint: t('dashboard.expiringProductHint'),
  });
}
