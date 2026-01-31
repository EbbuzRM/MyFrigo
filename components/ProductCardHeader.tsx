import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { Product, ProductCategory } from '@/types/Product';
import { CategoryIcon } from './CategoryIcon';
import { scaleFont } from '@/utils/scaleFont';
import {
  getProductCardAccessibilityProps,
  getDeleteButtonAccessibilityProps,
  getActionButtonAccessibilityProps,
} from '@/utils/accessibility';

interface ProductCardHeaderProps {
  /** Product data */
  product: Product;
  /** Category information */
  categoryInfo: ProductCategory;
  /** Theme colors */
  colors: {
    textPrimary: string;
    textSecondary: string;
    success: string;
    error: string;
  };
  /** Handler for consume action */
  onConsume: () => void;
  /** Handler for delete action */
  onDelete: () => void;
  /** Handler for card press */
  onPress?: () => void;
  /** Index for testing */
  index: number;
}

/**
 * Frozen indicator color
 */
const FROZEN_COLOR = '#2563EB';

/**
 * ProductCardHeader Component
 * @description Header section of ProductCard containing:
 * - Category icon
 * - Product name and brand
 * - Frozen indicator
 * - Action buttons (consume, delete)
 */
export const ProductCardHeader = React.memo(({
  product,
  categoryInfo,
  colors,
  onConsume,
  onDelete,
  index,
}: ProductCardHeaderProps) => {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        },
        productInfo: {
          flexDirection: 'row',
          alignItems: 'center',
          flexShrink: 1,
          marginRight: 4,
        },
        textContainer: {
          flex: 1,
          gap: 4,
        },
        productName: {
          fontSize: scaleFont(17),
          fontFamily: 'Inter-SemiBold',
          color: colors.textPrimary,
        },
        brandRow: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
        },
        brandName: {
          fontSize: scaleFont(14),
          fontFamily: 'Inter-Regular',
          color: colors.textSecondary,
        },
        frozenIndicator: {
          color: FROZEN_COLOR,
          fontSize: 14,
          fontWeight: 'bold',
        },
        actionsContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          flexShrink: 0,
        },
        actionButton: {
          padding: 8,
        },
        deleteButton: {
          padding: 8,
        },
      }),
    [colors]
  );

  const handleDeletePress = useCallback(() => {
    const productName = product.name || 'questo prodotto';
    Alert.alert(
      'Elimina Prodotto',
      `Sei sicuro di voler eliminare "${productName}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: onDelete },
      ]
    );
  }, [product.name, onDelete]);

  return (
    <View style={styles.container}>
      <View style={styles.productInfo}>
        <CategoryIcon categoryInfo={categoryInfo} size="medium" testID={`category-icon-${index}`} />
        <View style={styles.textContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.brandRow}>
            {product.brand && <Text style={styles.brandName}>{product.brand}</Text>}
            {product.isFrozen && (
              <Text style={styles.frozenIndicator}>(Freezer)</Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onConsume}
          {...getActionButtonAccessibilityProps('consumato', product.name || 'prodotto')}
        >
          <Check size={22} color={colors.success} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeletePress}
          {...getDeleteButtonAccessibilityProps(product.name || 'prodotto')}
        >
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

ProductCardHeader.displayName = 'ProductCardHeader';
