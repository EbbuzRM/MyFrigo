import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Product } from '@/types/Product';
import { Calendar, Package } from 'lucide-react-native';
import { scaleFont } from '@/utils/scaleFont';

interface ProductDetailInfoProps {
  product: Product;
}

export const ProductDetailInfo: React.FC<ProductDetailInfoProps> = memo(({ product }) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const formatDate = useMemo(() => (dateString: string | undefined) => {
    if (!dateString || typeof dateString !== 'string' || dateString.length === 0) {
      return 'Data non disponibile';
    }

    try {
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Data non valida';
    }
  }, []);

  const quantityItems = useMemo(() => {
    if (!product.quantities || !Array.isArray(product.quantities)) {
      return [];
    }

    return product.quantities.map((q, index) => (
      <View style={styles.detailRow} key={index}>
        <Package size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
        <Text style={styles.detailLabel}>
          Quantità {product.quantities!.length > 1 ? index + 1 : ''}:
        </Text>
        <Text style={styles.detailValue}>
          {q.quantity} {q.unit}
        </Text>
      </View>
    ));
  }, [product.quantities, isDarkMode, styles]);

  return (
    <View style={styles.detailsSection}>
      {quantityItems}

      <View style={styles.detailRow}>
        <Calendar size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
        <Text style={styles.detailLabel}>Scadenza:</Text>
        <Text
          style={styles.detailValue}
          accessibilityLabel={`Data di scadenza: ${formatDate(product.expirationDate)}`}
        >
          {formatDate(product.expirationDate)}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Calendar size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
        <Text style={styles.detailLabel}>Acquistato:</Text>
        <Text
          style={styles.detailValue}
          accessibilityLabel={`Data di acquisto: ${formatDate(product.purchaseDate)}`}
        >
          {formatDate(product.purchaseDate)}
        </Text>
      </View>

      {product.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Note:</Text>
          <Text
            style={styles.notesText}
            accessibilityLabel={`Note del prodotto: ${product.notes}`}
          >
            {typeof product.notes === 'string' ? product.notes : ''}
          </Text>
        </View>
      )}
    </View>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  detailsSection: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: scaleFont(16),
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginLeft: 12,
    flex: 1,
    flexWrap: 'wrap',
  },
  detailValue: {
    fontSize: scaleFont(16),
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  notesLabel: {
    fontSize: scaleFont(16),
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginBottom: 8,
  },
  notesText: {
    fontSize: scaleFont(16),
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    lineHeight: scaleFont(24),
  },
});