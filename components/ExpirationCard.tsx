import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, Calendar, Package } from 'lucide-react-native';
import { Product, PRODUCT_CATEGORIES } from '@/types/Product';

interface ExpirationCardProps {
  product: Product;
  onPress?: () => void;
}

export function ExpirationCard({ product, onPress }: ExpirationCardProps) {
  const getExpirationStatus = () => {
    const now = new Date();
    const expirationDate = new Date(product.expirationDate);
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      return { status: 'expired', color: '#EF4444', backgroundColor: '#FEF2F2', text: 'Scaduto' };
    } else if (daysUntilExpiration === 0) {
      return { status: 'today', color: '#F59E0B', backgroundColor: '#FFFBEB', text: 'Scade oggi' };
    } else if (daysUntilExpiration <= 3) {
      return { status: 'soon', color: '#F59E0B', backgroundColor: '#FFFBEB', text: `${daysUntilExpiration} giorni` };
    } else {
      return { status: 'good', color: '#10B981', backgroundColor: '#F0FDF4', text: `${daysUntilExpiration} giorni` };
    }
  };

  const getCategoryInfo = () => {
    return PRODUCT_CATEGORIES.find(cat => cat.id === product.category) || PRODUCT_CATEGORIES[PRODUCT_CATEGORIES.length - 1];
  };

  const expirationInfo = getExpirationStatus();
  const categoryInfo = getCategoryInfo();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.productInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
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
          <View style={styles.detailItem}>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  categoryEmoji: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  brandName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
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
    color: '#64748B',
    marginLeft: 6,
  },
});