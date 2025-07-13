import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, Package } from 'lucide-react-native';
import { Product } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { useExpirationStatus } from '@/hooks/useExpirationStatus';

interface ExpirationCardProps {
  product: Product;
  onPress?: () => void;
}

export function ExpirationCard({ product, onPress }: ExpirationCardProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { getCategoryById } = useCategories();
  const expirationInfo = useExpirationStatus(product.expirationDate);
  
  const categoryInfo = getCategoryById(product.category);

  if (!categoryInfo) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.productInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
              {categoryInfo.iconUrl ? (
                <Image source={{ uri: categoryInfo.iconUrl }} style={styles.categoryImage} />
              ) : (
                <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.productName} numberOfLines={1}>
                {product.name}
              </Text>
              {product.brand && (
                <Text style={styles.brandName} numberOfLines={1}>
                  {product.brand}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: expirationInfo.backgroundColor }]}>
            <Text style={[styles.statusText, { color: expirationInfo.color }]}>
              {expirationInfo.text}
            </Text>
          </View>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Package size={16} color="#64748B" />
            <Text style={styles.detailText}>
              {product.quantity} {product.unit}
            </Text>
          </View>
          <View style={[styles.detailItem, { marginLeft: 8 }]}>
            <Calendar size={16} color="#64748B" />
            <Text style={styles.detailText}>
              {new Date(product.expirationDate).toLocaleDateString('it-IT')}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  card: {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  categoryEmoji: {
    fontSize: 20,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  textContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 2,
  },
  brandName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginLeft: 6,
  },
});
