import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Trash2, MoreVertical, Calendar, Package } from 'lucide-react-native';
import { Product, PRODUCT_CATEGORIES } from '@/types/Product';

interface ProductCardProps {
  product: Product;
  onDelete: () => void;
  onConsume?: () => void; // Added onConsume prop
  onPress?: () => void;
}

export function ProductCard({ product, onDelete, onConsume, onPress }: ProductCardProps) {
  const getExpirationStatus = () => {
    const now = new Date();
    const expirationDate = new Date(product.expirationDate);
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      return { status: 'expired', color: '#EF4444', backgroundColor: '#FEF2F2' };
    } else if (daysUntilExpiration <= 3) {
      return { status: 'warning', color: '#F59E0B', backgroundColor: '#FFFBEB' };
    } else {
      return { status: 'good', color: '#10B981', backgroundColor: '#F0FDF4' };
    }
  };

  const getCategoryInfo = () => {
    return PRODUCT_CATEGORIES.find(cat => cat.id === product.category) || PRODUCT_CATEGORIES[PRODUCT_CATEGORIES.length - 1];
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Elimina Prodotto',
      `Sei sicuro di voler eliminare "${product.name}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const expirationInfo = getExpirationStatus();
  const categoryInfo = getCategoryInfo();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.statusIndicator, { backgroundColor: expirationInfo.color }]} />
      
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
              <Text style={styles.categoryName}>
                {categoryInfo.name}
              </Text>
            </View>
          </View>
          
          <View style={styles.actionsContainer}>
            {onConsume && product.status === 'active' && (
              <TouchableOpacity style={styles.actionButton} onPress={onConsume}>
                <Text style={styles.consumeText}>Consuma</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
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
          
          {product.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              {product.notes}
            </Text>
          )}
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
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statusIndicator: {
    width: 4,
  },
  content: {
    flex: 1,
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
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#E0F2FE', // Light blue
    marginRight: 8,
  },
  consumeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#0EA5E9', // Blue
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    // backgroundColor: '#FEF2F2', // Keep or remove if only icon
  },
  details: {
    gap: 8,
  },
  detailRow: {
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
  notes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    fontStyle: 'italic',
  },
});
