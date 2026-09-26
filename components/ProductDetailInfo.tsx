// ProductDetailInfo.tsx — ProductDetailInfo module.
//
// exports: ProductDetailInfo
// used_by: none
// rules:   - Module components must use `memo` for performance optimization and follow the established pattern of `const { isDarkMode } = useTheme()` with dynamic styles via `getStyles(isDarkMode)`
//          - All textual fallbacks and date formatting must be in Italian (`it-IT` locale) with consistent "Data non disponibile" / "Data non valida" patterns
//          - Icon imports from `lucide-react-native` must maintain consistent size (20) and color scheme based on `isDarkMode` with specific hex values
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Product } from '@/types/Product';
import { Calendar, Package } from 'lucide-react-native';
import { scaleFont } from '@/utils/scaleFont';
import { useTranslation } from 'react-i18next';
import { useAppLanguage } from '@/i18n/useAppLanguage';
import { formatDisplayDate, formatDisplayNumber } from '@/i18n/format';
import { getUnitLabel } from '@/i18n/units';

interface ProductDetailInfoProps {
  product: Product;
}

export const ProductDetailInfo: React.FC<ProductDetailInfoProps> = memo(({ product }) => {
  const { t } = useTranslation();
  const language = useAppLanguage();
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const formatDate = useMemo(() => (dateString: string | undefined) => {
    if (!dateString || typeof dateString !== 'string' || dateString.length === 0) {
      return t('products.dateUnavailable');
    }

    try {
      return formatDisplayDate(dateString, language) ?? t('products.dateInvalid');
    } catch {
      return t('products.dateInvalid');
    }
  }, [language, t]);

  const quantityItems = useMemo(() => {
    if (!product.quantities || !Array.isArray(product.quantities)) {
      return [];
    }

    return product.quantities.map((q, index) => (
      <View style={styles.detailRow} key={index}>
        <Package size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
        <Text style={styles.detailLabel}>
          {product.quantities!.length > 1 ? t('products.quantityNumber', { number: index + 1 }) : t('products.quantityLabel')}:
        </Text>
        <Text style={styles.detailValue}>
          {formatDisplayNumber(q.quantity, language)} {getUnitLabel(q.unit, language)}
        </Text>
      </View>
    ));
  }, [product.quantities, isDarkMode, styles, language, t]);

  return (
    <View style={styles.detailsSection}>
      {quantityItems}

      <View style={styles.detailRow}>
        <Calendar size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
        <Text style={styles.detailLabel}>{t('products.expirationDateLabel')}:</Text>
        <Text
          style={styles.detailValue}
          accessibilityLabel={t('products.expirationDateA11y', { date: formatDate(product.expirationDate) })}
        >
          {formatDate(product.expirationDate)}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Calendar size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
        <Text style={styles.detailLabel}>{t('products.purchasedLabel')}:</Text>
        <Text
          style={styles.detailValue}
          accessibilityLabel={t('products.purchaseDateA11y', { date: formatDate(product.purchaseDate) })}
        >
          {formatDate(product.purchaseDate)}
        </Text>
      </View>

      {product.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>{t('products.notesLabel')}:</Text>
          <Text
            style={styles.notesText}
            accessibilityLabel={t('products.notesA11y', { notes: product.notes })}
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
