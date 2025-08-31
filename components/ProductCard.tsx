import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Calendar, Package, Trash2 } from 'lucide-react-native';
import { Product, ProductCategory } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { useExpirationStatus } from '@/hooks/useExpirationStatus';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { LoggingService } from '@/services/LoggingService';
import { COLORS } from '@/constants/colors';
import {
  getProductCardAccessibilityProps,
  getDeleteButtonAccessibilityProps,
  getActionButtonAccessibilityProps,
  getImageAccessibilityProps
} from '@/utils/accessibility';

interface ProductCardProps {
  product: Product;
  categoryInfo: ProductCategory | undefined;
  onDelete: () => void;
  onConsume?: () => void;
  onPress?: () => void;
  index: number;
}

export const ProductCard = React.memo(({ product, categoryInfo, onDelete, onConsume, onPress, index }: ProductCardProps) => {
  // Verifica subito che product e categoryInfo siano definiti
  if (!product || !categoryInfo) {
    LoggingService.warning('ProductCard', 'Rendering skipped due to missing product or category data');
    return null;
  }

  const { isDarkMode, colors } = useTheme();
  
  // Gestione sicura della data di scadenza
  const safeExpirationDate = React.useMemo(() => {
    if (!product.expirationDate) return null;
    
    try {
      const date = new Date(product.expirationDate);
      // Verifica che la data sia valida
      if (isNaN(date.getTime())) {
        LoggingService.warning('ProductCard', `Invalid expiration date: ${product.expirationDate}`);
        return null;
      }
      return date;
    } catch (error) {
      LoggingService.error('ProductCard', `Error parsing expiration date: ${product.expirationDate}`, error);
      return null;
    }
  }, [product.expirationDate]);
  
  // Passa la data sicura al hook
  const expirationInfo = useExpirationStatus(safeExpirationDate ? safeExpirationDate.toISOString() : undefined);
  
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
  
  // Memoizziamo gli stili per evitare ricalcoli inutili
  const styles = React.useMemo(() => getStyles(isDarkMode, colors), [isDarkMode, colors]);

  const handleDeletePress = () => {
    const productName = product.name || 'questo prodotto';
    Alert.alert(
      'Elimina Prodotto',
      `Sei sicuro di voler eliminare "${productName}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        testID={`product-item-${index}`}
        style={[styles.card, { backgroundColor: expirationInfo.backgroundColor, borderColor: expirationInfo.color + '33' }]}
        onPress={onPress}
        activeOpacity={0.7}
        {...getProductCardAccessibilityProps(product, categoryInfo)}
      >
        <View style={[styles.statusIndicator, { backgroundColor: expirationInfo.color }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.productInfo}>
              <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                {categoryInfo.localIcon ? (
                  <Image
                    source={categoryInfo.localIcon}
                    style={styles.categoryImage}
                    {...getImageAccessibilityProps(`Icona categoria ${categoryInfo.name}`)}
                  />
                ) : categoryInfo.icon && categoryInfo.icon.startsWith('http') ? (
                  <Image
                    source={{ uri: categoryInfo.icon }}
                    style={styles.categoryImage}
                    {...getImageAccessibilityProps(`Icona categoria ${categoryInfo.name}`)}
                  />
                ) : (
                  <Text style={styles.categoryEmoji}>{categoryInfo.icon}</Text>
                )}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                {product.brand && <Text style={styles.brandName} numberOfLines={1}>{product.brand}</Text>}
                <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '33' }]}>
                  <Text
                    style={[
                      styles.categoryName,
                      { color: isDarkMode ? COLORS.DARK.textPrimary : categoryInfo.color }
                    ]}
                  >
                    {categoryInfo.name}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.actionsContainer}>
              {onConsume && product.status === 'active' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onConsume}
                  {...getActionButtonAccessibilityProps("Segna come consumato", product.name || "prodotto")}
                >
                  <Text style={styles.consumeText}>Consumato</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeletePress}
                testID="delete-button"
                {...getDeleteButtonAccessibilityProps(product.name || "prodotto")}
              >
                <Trash2 size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Package size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>{product.quantity} {product.unit}</Text>
              </View>
              <View style={styles.detailItem}>
                <Calendar size={16} color={colors.textSecondary} />
                <Text style={styles.dateText}>
                  {safeExpirationDate
                    ? safeExpirationDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Data non valida'}
                </Text>
              </View>
            </View>
            {product.notes && <Text style={styles.notes} numberOfLines={2}>{product.notes}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Utilizziamo una tipizzazione più precisa per i colori
const getStyles = (isDarkMode: boolean, colors: {
  textPrimary: string;
  textSecondary: string;
  primary: string;
  error: string;
  cardBackground: string;
  background: string;
}) => StyleSheet.create({
    card: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: COLORS.LIGHT.textPrimary,
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
    color: colors.textPrimary,
  },
  brandName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
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
    backgroundColor: colors.cardBackground,
    marginRight: 8,
  },
  consumeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: colors.primary,
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
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  notes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
