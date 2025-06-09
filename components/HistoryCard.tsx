import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, CheckCircle, XCircle } from 'lucide-react-native';
import { Product, PRODUCT_CATEGORIES } from '@/types/Product';

interface HistoryCardProps {
  product: Product;
  type: 'consumed' | 'expired';
}

export function HistoryCard({ product, type }: HistoryCardProps) {
  const getCategoryInfo = () => {
    return PRODUCT_CATEGORIES.find(cat => cat.id === product.category) || PRODUCT_CATEGORIES[PRODUCT_CATEGORIES.length - 1];
  };

  const getStatusInfo = () => {
    if (type === 'consumed') {
      return {
        icon: <CheckCircle size={24} color="#10B981" />,
        backgroundColor: '#F0FDF4',
        borderColor: '#DCFCE7',
        statusText: 'Consumato',
        date: product.consumedDate,
      };
    } else {
      return {
        icon: <XCircle size={24} color="#EF4444" />,
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
        statusText: 'Scaduto',
        date: product.expirationDate,
      };
    }
  };

  const categoryInfo = getCategoryInfo();
  const statusInfo = getStatusInfo();

  return (
    <View style={[styles.card, { backgroundColor: statusInfo.backgroundColor, borderColor: statusInfo.borderColor }]}>
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
          <View style={styles.statusContainer}>
            {statusInfo.icon}
          </View>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Calendar size={16} color="#64748B" />
            <Text style={styles.detailText}>
              {statusInfo.statusText}: {new Date(statusInfo.date || '').toLocaleDateString('it-IT')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
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
  statusContainer: {
    padding: 4,
  },
  details: {
    flexDirection: 'row',
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