import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { ProductCategory } from '@/types/Product';
import { scaleFont } from '@/utils/scaleFont';
import { getImageAccessibilityProps } from '@/utils/accessibility';

/**
 * Size variants for the category icon
 */
type IconSize = 'small' | 'medium';

interface CategoryIconProps {
  /** Category information containing icon details */
  categoryInfo: ProductCategory;
  /** Size variant for the icon container */
  size?: IconSize;
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Size configuration for each variant
 */
const SIZE_CONFIG: Record<IconSize, { container: number; image: number; emoji: number }> = {
  small: {
    container: 40,
    image: 24,
    emoji: 20,
  },
  medium: {
    container: 48,
    image: 32,
    emoji: 24,
  },
};

/**
 * CategoryIcon Component
 * @description Reusable component for displaying category icons.
 * Supports local icons, remote URLs, and emoji fallbacks.
 * Used by ProductCard, HistoryCard, and ExpirationCard.
 */
export const CategoryIcon = React.memo(({ categoryInfo, size = 'medium', testID }: CategoryIconProps) => {
  const sizeConfig = SIZE_CONFIG[size];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: sizeConfig.container,
          height: sizeConfig.container,
          borderRadius: size === 'medium' ? 12 : 8,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: `${categoryInfo.color}20`,
        },
        image: {
          width: sizeConfig.image,
          height: sizeConfig.image,
          borderRadius: size === 'medium' ? 8 : 4,
        },
        emoji: {
          fontSize: scaleFont(sizeConfig.emoji),
        },
      }),
    [size, sizeConfig, categoryInfo.color]
  );

  const accessibilityLabel = `Icona categoria ${categoryInfo.name}`;

  if (categoryInfo.localIcon) {
    return (
      <View style={styles.container} testID={testID}>
        <Image
          source={categoryInfo.localIcon}
          style={styles.image}
          {...getImageAccessibilityProps(accessibilityLabel)}
        />
      </View>
    );
  }

  if (categoryInfo.icon && categoryInfo.icon.startsWith('http')) {
    return (
      <View style={styles.container} testID={testID}>
        <Image
          source={{ uri: categoryInfo.icon }}
          style={styles.image}
          {...getImageAccessibilityProps(accessibilityLabel)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.emoji}>{categoryInfo.icon}</Text>
    </View>
  );
});

CategoryIcon.displayName = 'CategoryIcon';
