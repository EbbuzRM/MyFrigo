import React, { useCallback, useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Product } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { useExpirationStatus } from '@/hooks/useExpirationStatus';
import { getExpirationCardAccessibilityProps } from '@/utils/accessibility';
import { ExpirationCardHeader } from './ExpirationCardHeader';
import { ExpirationCardDetails } from './ExpirationCardDetails';
import { getExpirationCardStyles, getExpirationCardColors } from './ExpirationCard.styles';

/**
 * Props for the ExpirationCard component
 */
interface ExpirationCardProps {
  /** Product information to display */
  product: Product;
  /** Callback when card is pressed */
  onPress?: () => void;
}

/**
 * ExpirationCard Component
 * @description Displays a product card with expiration status, category icon,
 * and details. Used in expiration lists to show products nearing expiration.
 * 
 * @example
 * ```tsx
 * <ExpirationCard 
 *   product={product} 
 *   onPress={() => navigation.navigate('ProductDetail', { id: product.id })} 
 * />
 * ```
 */
export const ExpirationCard = React.memo(({ product, onPress }: ExpirationCardProps) => {
  const { isDarkMode } = useTheme();
  const colors = useMemo(() => getExpirationCardColors(isDarkMode), [isDarkMode]);
  const styles = useMemo(() => getExpirationCardStyles(isDarkMode, colors), [isDarkMode, colors]);
  const { getCategoryById } = useCategories();
  const expirationInfo = useExpirationStatus(product.expirationDate, isDarkMode);
  
  const categoryInfo = useMemo(
    () => getCategoryById(product.category),
    [getCategoryById, product.category]
  );

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  if (!categoryInfo) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
      {...getExpirationCardAccessibilityProps(product, expirationInfo)}
    >
      <View style={styles.content}>
        <ExpirationCardHeader
          product={product}
          categoryInfo={categoryInfo}
          statusBackgroundColor={expirationInfo.backgroundColor}
          statusTextColor={expirationInfo.color}
          statusText={expirationInfo.text}
          isDarkMode={isDarkMode}
        />
        <ExpirationCardDetails
          quantities={product.quantities}
          expirationDate={product.expirationDate}
          isDarkMode={isDarkMode}
        />
      </View>
    </TouchableOpacity>
  );
});

ExpirationCard.displayName = 'ExpirationCard';
