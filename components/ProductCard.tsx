import React, { useMemo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Product, ProductCategory } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';
import { useCardAnimation } from '@/hooks/useCardAnimation';
import { useProductStatus } from '@/hooks/useProductStatus';
import { ProductCardHeader } from './ProductCardHeader';
import { ProductCardDetails } from './ProductCardDetails';
import { getProductCardStyles } from './ProductCard.styles';
import { LoggingService } from '@/services/LoggingService';
import { getProductCardAccessibilityProps } from '@/utils/accessibility';
import Animated from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';

/**
 * Props for ProductCard component
 */
interface ProductCardProps {
  /** Product data to display */
  product: Product;
  /** Category information for the product */
  categoryInfo: ProductCategory | undefined;
  /** Callback when product is deleted */
  onDelete: () => void;
  /** Callback when product is consumed */
  onConsume: () => void;
  /** Optional callback when card is pressed */
  onPress?: () => void;
  /** Index for staggered animation */
  index: number;
}

/**
 * Status indicator width constant
 */
const STATUS_INDICATOR_WIDTH = 5;

/**
 * Border opacity hex suffix (33 = 20% opacity)
 */
const BORDER_OPACITY_SUFFIX = '33';

/**
 * ProductCard Component
 * @description Displays a product card with category icon, product details,
 * expiration status indicator, and action buttons.
 * Features smooth entry animations and supports both light and dark themes.
 */
export const ProductCard = React.memo(({
  product,
  categoryInfo,
  onDelete,
  onConsume,
  onPress,
  index,
}: ProductCardProps) => {
  const { isDarkMode, colors } = useTheme();
  const { animatedStyle } = useCardAnimation(index);

  const { expirationInfo, formattedExpirationDate, formattedPurchaseDate } = useProductStatus(
    product.expirationDate,
    isDarkMode,
    product.isFrozen
  );

  const styles = useMemo(() => getProductCardStyles(isDarkMode, colors), [isDarkMode, colors]);

  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  const handleConsume = useCallback(() => {
    onConsume();
  }, [onConsume]);

  const cardBackgroundColor = expirationInfo.backgroundColor;
  const cardBorderColor = `${expirationInfo.color}${BORDER_OPACITY_SUFFIX}`;

  if (!product || !categoryInfo) {
    LoggingService.warning('ProductCard', 'Rendering skipped due to missing product or category data');
    return null;
  }

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        testID={`product-item-${index}`}
        style={[
          styles.card,
          { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={getProductCardAccessibilityProps(product, categoryInfo).accessibilityLabel}
      >
        <View
          style={[styles.statusIndicator, { backgroundColor: expirationInfo.color, width: STATUS_INDICATOR_WIDTH }]}
        />
        <View style={styles.content}>
          <ProductCardHeader
            product={product}
            categoryInfo={categoryInfo}
            colors={colors}
            onConsume={handleConsume}
            onDelete={handleDelete}
            onPress={onPress}
            index={index}
          />
          <ProductCardDetails
            product={product}
            colors={colors}
            formattedPurchaseDate={formattedPurchaseDate(product.purchaseDate)}
            formattedExpirationDate={formattedExpirationDate}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

ProductCard.displayName = 'ProductCard';
