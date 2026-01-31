import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CategoryIcon } from './CategoryIcon';
import { Product, ProductCategory } from '@/types/Product';
import { scaleFont } from '@/utils/scaleFont';

/**
 * Props for the ExpirationCardHeader component
 */
interface ExpirationCardHeaderProps {
  /** Product information to display */
  product: Product;
  /** Category information for the icon */
  categoryInfo: ProductCategory;
  /** Background color for the status badge */
  statusBackgroundColor: string;
  /** Text color for the status badge */
  statusTextColor: string;
  /** Status text to display */
  statusText: string;
  /** Whether dark mode is enabled */
  isDarkMode: boolean;
}

/**
 * ExpirationCardHeader Component
 * @description Displays the header section of an expiration card with category icon,
 * product name, brand, and expiration status badge.
 */
export const ExpirationCardHeader = React.memo(({
  product,
  categoryInfo,
  statusBackgroundColor,
  statusTextColor,
  statusText,
  isDarkMode,
}: ExpirationCardHeaderProps) => {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        },
        productInfo: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          marginRight: 12,
        },
        textContainer: {
          flex: 1,
        },
        productName: {
          fontSize: scaleFont(16),
          fontFamily: 'Inter-SemiBold',
          color: isDarkMode ? '#c9d1d9' : '#1e293b',
          marginBottom: 2,
        },
        brandName: {
          fontSize: scaleFont(14),
          fontFamily: 'Inter-Regular',
          color: isDarkMode ? '#8b949e' : '#64748B',
        },
        statusBadge: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: statusBackgroundColor,
        },
        statusText: {
          fontSize: scaleFont(12),
          fontFamily: 'Inter-Medium',
          color: statusTextColor,
        },
      }),
    [isDarkMode, statusBackgroundColor, statusTextColor]
  );

  return (
    <View style={styles.header}>
      <View style={styles.productInfo}>
        <CategoryIcon categoryInfo={categoryInfo} size="small" />
        <View style={styles.textContainer}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          {product.brand && (
            <Text style={styles.brandName} numberOfLines={1}>
              {product.brand}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    </View>
  );
});

ExpirationCardHeader.displayName = 'ExpirationCardHeader';
