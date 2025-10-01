import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export const ProductDetailSkeleton: React.FC = memo(() => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.categoryIconSkeleton} />
          <View style={styles.productInfo}>
            <View style={styles.productNameSkeleton} />
            <View style={styles.brandNameSkeleton} />
            <View style={styles.categoryBadgeSkeleton} />
          </View>
        </View>
        <View style={styles.productImageSkeleton} />
      </View>

      {/* Details skeleton */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <View style={styles.detailIconSkeleton} />
          <View style={styles.detailLabelSkeleton} />
          <View style={styles.detailValueSkeleton} />
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailIconSkeleton} />
          <View style={styles.detailLabelSkeleton} />
          <View style={styles.detailValueSkeleton} />
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailIconSkeleton} />
          <View style={styles.detailLabelSkeleton} />
          <View style={styles.detailValueSkeleton} />
        </View>
      </View>

      {/* Actions skeleton */}
      <View style={styles.actionsSection}>
        <View style={styles.actionButtonSkeleton} />
        <View style={styles.actionButtonSkeleton} />
        <View style={styles.actionButtonSkeleton} />
      </View>
    </View>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  productCard: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIconSkeleton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productNameSkeleton: {
    height: 24,
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  brandNameSkeleton: {
    height: 16,
    width: '60%',
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryBadgeSkeleton: {
    height: 20,
    width: '40%',
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 8,
  },
  productImageSkeleton: {
    width: '100%',
    height: 200,
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 12,
    marginBottom: 12,
  },
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
  detailIconSkeleton: {
    width: 20,
    height: 20,
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 10,
    marginRight: 12,
  },
  detailLabelSkeleton: {
    height: 16,
    flex: 1,
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 4,
    marginRight: 12,
  },
  detailValueSkeleton: {
    height: 16,
    width: '40%',
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 4,
  },
  actionsSection: {
    gap: 8,
    marginTop: 10,
  },
  actionButtonSkeleton: {
    height: 48,
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 12,
  },
});