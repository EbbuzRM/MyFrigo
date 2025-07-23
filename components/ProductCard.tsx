import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Trash2, Calendar, Package } from 'lucide-react-native';
import { Product, ProductCategory } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';
import { useExpirationStatus } from '@/hooks/useExpirationStatus';

interface ProductCardProps {
  product: Product;
  categoryInfo: ProductCategory | undefined;
  onDelete: () => void;
  onConsume?: () => void;
  onPress?: () => void;
  index: number;
}

export const ProductCard = React.memo(({ product, categoryInfo, onDelete, onConsume, onPress, index }: ProductCardProps) => {
  const { isDarkMode } = useTheme();
  const expirationInfo = useExpirationStatus(product.expirationDate);
  
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(index * 100, withTiming(0, { duration: 400 }));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });
  
  const styles = getStyles(isDarkMode);

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

  if (!product || !categoryInfo) {
    return null;
  }

  return (
    <Animated.View style={animatedStyle}>
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
                {categoryInfo.localIcon ? (
                  <Image source={categoryInfo.localIcon} style={styles.categoryImage} />
                ) : categoryInfo.iconUrl ? (
                  <Image source={{ uri: categoryInfo.iconUrl }} style={styles.categoryImage} />
                ) : (
                  <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
                )}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                {product.brand && <Text style={styles.brandName} numberOfLines={1}>{product.brand}</Text>}
                <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '33' }]}>
                  <Text style={[styles.categoryName, { color: isDarkMode ? '#ffffff' : categoryInfo.color }]}>{categoryInfo.name}</Text>
                </View>
              </View>
            </View>
            <View style={styles.actionsContainer}>
              {onConsume && product.status === 'active' && (
                <TouchableOpacity style={styles.actionButton} onPress={onConsume}>
                  <Text style={styles.consumeText}>Consumato</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress} testID="delete-button">
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Package size={16} color="#64748B" />
                <Text style={styles.detailText}>{product.quantity} {product.unit}</Text>
              </View>
              <View style={styles.detailItem}>
                <Calendar size={16} color="#64748B" />
                <Text style={styles.dateText}>{new Date(product.expirationDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
              </View>
            </View>
            {product.notes && <Text style={styles.notes} numberOfLines={2}>{product.notes}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
    card: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    alignItems: 'center',
    marginBottom: 16,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 4,
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
  categoryImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
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
});
