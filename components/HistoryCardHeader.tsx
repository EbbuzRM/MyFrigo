import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProductCategory } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';
import { CategoryIcon } from './CategoryIcon';
import { scaleFont } from '@/utils/scaleFont';

interface HistoryCardHeaderProps {
  productName: string;
  brand?: string;
  categoryInfo: ProductCategory;
}

const SPACING = { xs: 4, sm: 8 };

/** HistoryCardHeader - Displays product name, brand, category icon and badge */
export const HistoryCardHeader = React.memo(({
  productName, brand, categoryInfo,
}: HistoryCardHeaderProps) => {
  const { isDarkMode } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    productInfo: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: SPACING.xs },
    textContainer: { flex: 1, gap: SPACING.xs },
    productName: {
      fontSize: scaleFont(17), fontFamily: 'Inter-SemiBold',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    brandName: {
      fontSize: scaleFont(14), fontFamily: 'Inter-Regular',
      color: isDarkMode ? '#8b949e' : '#64748B',
    },
    categoryBadge: {
      alignSelf: 'flex-start', paddingHorizontal: SPACING.sm, paddingVertical: 4,
      borderRadius: 6, backgroundColor: `${categoryInfo.color}33`,
    },
    categoryName: {
      fontSize: scaleFont(14), fontFamily: 'Inter-Medium',
      color: isDarkMode ? '#ffffff' : categoryInfo.color,
    },
  }), [isDarkMode, categoryInfo.color]);

  return (
    <View style={styles.productInfo}>
      <CategoryIcon categoryInfo={categoryInfo} size="medium" testID="history-category-icon" />
      <View style={styles.textContainer}>
        <Text style={styles.productName} numberOfLines={1} accessibilityRole="header">
          {productName}
        </Text>
        {brand && <Text style={styles.brandName} numberOfLines={1}>{brand}</Text>}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryName}>{categoryInfo.name}</Text>
        </View>
      </View>
    </View>
  );
});

HistoryCardHeader.displayName = 'HistoryCardHeader';
