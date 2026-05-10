// ProductCardDetails.tsx — ProductCardDetails module.
//
// exports: ProductCardDetails
// used_by: components\ProductCard.tsx
// rules:   - All style objects must be memoized with `useMemo` and depend on the `colors` prop
//          - Date formatting must be passed as formatted props, not computed inside the component
//          - The component must be wrapped with `React.memo` for performance optimization
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Package, ShoppingCart } from 'lucide-react-native';
import { Product } from '@/types/Product';
import { QuantityDisplay } from './QuantityDisplay';
import { scaleFont } from '@/utils/scaleFont';

interface ProductCardDetailsProps {
  /** Product data */
  product: Product;
  /** Theme colors */
  colors: {
    textPrimary: string;
    textSecondary: string;
  };
  /** Formatted purchase date string */
  formattedPurchaseDate: string;
  /** Formatted expiration date string */
  formattedExpirationDate: string;
}

/**
 * ProductCardDetails Component
 * @description Details section of ProductCard containing:
 * - Purchase date
 * - Expiration date
 * - Quantity information
 * - Notes (if available)
 */
export const ProductCardDetails = React.memo(({
  product,
  colors,
  formattedPurchaseDate,
  formattedExpirationDate,
}: ProductCardDetailsProps) => {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: 12,
        },
        detailRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        detailItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        detailText: {
          fontSize: scaleFont(14),
          fontFamily: 'Inter-Regular',
          color: colors.textSecondary,
        },
        dateText: {
          fontSize: scaleFont(14),
          fontFamily: 'Inter-Medium',
          color: colors.textPrimary,
        },
        notes: {
          fontSize: scaleFont(14),
          fontFamily: 'Inter-Regular',
          color: colors.textSecondary,
          fontStyle: 'italic',
        },
      }),
    [colors]
  );

  const hasQuantities = Array.isArray(product.quantities) && product.quantities.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <ShoppingCart size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>Acquisto</Text>
        </View>
        <Text style={styles.dateText}>{formattedPurchaseDate}</Text>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>Scadenza</Text>
        </View>
        <Text style={styles.dateText}>{formattedExpirationDate}</Text>
      </View>

      {hasQuantities && (
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Package size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>Quantità</Text>
          </View>
          <QuantityDisplay quantities={product.quantities} style={styles.dateText} />
        </View>
      )}

      {product.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {product.notes}
        </Text>
      )}
    </View>
  );
});

ProductCardDetails.displayName = 'ProductCardDetails';
