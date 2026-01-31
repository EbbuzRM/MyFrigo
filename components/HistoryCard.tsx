import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';
import { Product } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { HistoryCardHeader } from './HistoryCardHeader';
import { HistoryCardDetails } from './HistoryCardDetails';
import { useStatusInfo, formatHistoryDate, HistoryStatus } from './HistoryCardStatus';
import { getHistoryCardStyles } from './HistoryCard.styles';

interface HistoryCardProps {
  /** Product data to display */
  product: Product;
  /** History entry type */
  type: HistoryStatus;
  /** Callback when restore button is pressed */
  onRestore?: (productId: string) => void;
  /** Index for staggered animation */
  index?: number;
}

/**
 * Animation delay per item (ms)
 */
const ANIMATION_DELAY_PER_ITEM = 100;

/**
 * Animation duration (ms)
 */
const ANIMATION_DURATION = 400;

/**
 * HistoryCard Component
 * @description Displays a history entry card for consumed or expired products.
 * Features animated entry, category icon, quantity display, and restore functionality.
 */
export const HistoryCard = React.memo(({
  product,
  type,
  onRestore,
  index = 0,
}: HistoryCardProps) => {
  const { isDarkMode } = useTheme();
  const { getCategoryById } = useCategories();
  const styles = getHistoryCardStyles(isDarkMode);

  const categoryInfo = getCategoryById(product.category);

  // Animation setup
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    opacity.value = withDelay(
      index * ANIMATION_DELAY_PER_ITEM,
      withTiming(1, { duration: ANIMATION_DURATION })
    );
    translateY.value = withDelay(
      index * ANIMATION_DELAY_PER_ITEM,
      withTiming(0, { duration: ANIMATION_DURATION })
    );
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Status info with memoization
  const date = type === 'consumed' ? product.consumedDate : product.expirationDate;
  const statusInfo = useStatusInfo({ type, isDarkMode, date });

  // Memoized handlers
  const handleRestore = useCallback(() => {
    onRestore?.(product.id);
  }, [onRestore, product.id]);

  // Memoized formatted date
  const formattedDate = useMemo(() => formatHistoryDate(date), [date]);

  if (!categoryInfo) {
    return null;
  }

  return (
    <Animated.View style={animatedStyle} testID="history-card">
      <View style={[styles.card, { borderColor: statusInfo.borderColor }]}>
        <View
          style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]}
          accessibilityLabel={`Status: ${statusInfo.statusText}`}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <HistoryCardHeader
              productName={product.name}
              brand={product.brand}
              categoryInfo={categoryInfo}
            />
            <View style={styles.statusContainer}>{statusInfo.icon}</View>
          </View>
          <HistoryCardDetails
            quantities={product.quantities}
            statusText={statusInfo.statusText}
            formattedDate={formattedDate}
            statusColor={statusInfo.color}
            type={type}
            onRestore={handleRestore}
          />
        </View>
      </View>
    </Animated.View>
  );
});

HistoryCard.displayName = 'HistoryCard';
