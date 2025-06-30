import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Trash2, MoreVertical, Calendar, Package } from 'lucide-react-native';
import { Product, PRODUCT_CATEGORIES } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';

interface ProductCardProps {
  product: Product;
  onDelete: () => void;
  onConsume?: () => void; // Added onConsume prop
  onPress?: () => void;
}

export function ProductCard({ product, onDelete, onConsume, onPress }: ProductCardProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  
  // Controllo di sicurezza per product undefined
  if (!product) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>Prodotto non disponibile</Text>
      </View>
    );
  }

  const getExpirationStatus = () => {
    const now = new Date();
    const expirationDate = new Date(product.expirationDate);
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      return { status: 'expired', color: '#EF4444', backgroundColor: isDarkMode ? '#4B1A1A' : '#FEE2E2' };
    } else if (daysUntilExpiration <= 3) {
      return { status: 'warning', color: '#F59E0B', backgroundColor: isDarkMode ? '#4B3B1A' : '#FEF3C7' };
    } else {
      return { status: 'good', color: '#10B981', backgroundColor: isDarkMode ? '#1A4B3A' : '#D1FAE5' };
    }
  };

  const getCategoryInfo = () => {
    return PRODUCT_CATEGORIES.find(cat => cat.id === product.category) || PRODUCT_CATEGORIES[PRODUCT_CATEGORIES.length - 1];
  };

  const expirationInfo = getExpirationStatus();
  const categoryInfo = getCategoryInfo();

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

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: expirationInfo.backgroundColor, borderColor: expirationInfo.color + '33' }]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[styles.statusIndicator, { backgroundColor: expirationInfo.color }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.productInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              {product.brand && (
                <Text style={styles.brandName} numberOfLines={1}>
                  {product.brand}
                </Text>
              )}
              <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '33' }]}>
                <Text style={[styles.categoryName, { color: isDarkMode ? '#ffffff' : categoryInfo.color }]}>
                  {categoryInfo.name}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.actionsContainer}>
            {onConsume && product.status === 'active' && (
              <TouchableOpacity style={styles.actionButton} onPress={onConsume}>
                <Text style={styles.consumeText}>Consumato</Text>
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
              <Text style={styles.dateText}>
                {new Date(product.expirationDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statusIndicator: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  brandName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: isDarkMode ? '#1e2530' : '#ffffff',
    marginRight: 8,
  },
  consumeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#8b949e' : '#0EA5E9',
  },
  deleteButton: {
    padding: 8,
  },
  details: {
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
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#c9d1d9' : '#334155',
  },
  notes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#EF4444' : '#B91C1C',
    textAlign: 'center',
    padding: 16,
  },
});
