import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, Package, CheckCircle, XCircle, RotateCcw } from 'lucide-react-native';
import { Product } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withDelay } from 'react-native-reanimated';
import { LoggingService } from '@/services/LoggingService';

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restoreButton: {
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
});

interface HistoryCardProps {
  product: Product;
  type: 'consumed' | 'expired';
  onRestore?: (productId: string) => void;
  index?: number;
}

export function HistoryCard({ product, type, onRestore, index = 0 }: HistoryCardProps) {
  const { isDarkMode } = useTheme();
  const { getCategoryById } = useCategories();
  const styles = getStyles(isDarkMode);

  const categoryInfo = getCategoryById(product.category);
  
  // Animazione
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

  const getStatusInfo = () => {
    const themeColors = {
      consumed: {
        icon: <CheckCircle size={24} color={isDarkMode ? '#4ade80' : '#16a34a'} />,
        backgroundColor: isDarkMode ? '#142e1f' : '#f0fdf4',
        borderColor: isDarkMode ? '#1c4b2a' : '#bbf7d0',
        color: isDarkMode ? '#4ade80' : '#16a34a'
      },
      expired: {
        icon: <XCircle size={24} color={isDarkMode ? '#f87171' : '#dc2626'} />,
        backgroundColor: isDarkMode ? '#311919' : '#fee2e2',
        borderColor: isDarkMode ? '#5b2121' : '#fecaca',
        color: isDarkMode ? '#f87171' : '#dc2626'
      },
    };
    const date = type === 'consumed' ? product.consumedDate : product.expirationDate;
    const statusText = type === 'consumed' ? 'Consumato' : 'Scaduto';
    
    return { ...themeColors[type], date, statusText };
  };

  const statusInfo = getStatusInfo();

  if (!categoryInfo) {
    return null; // or a placeholder
  }

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.card, { borderColor: statusInfo.borderColor }]}>
        <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.productInfo}>
              <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                {categoryInfo.localIcon ? (
                  <Image source={categoryInfo.localIcon} style={styles.categoryImage} />
                ) : categoryInfo.icon && categoryInfo.icon.startsWith('http') ? (
                  <Image source={{ uri: categoryInfo.icon }} style={styles.categoryImage} />
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
                <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '33' }]}>
                  <Text style={[styles.categoryName, { color: isDarkMode ? '#ffffff' : categoryInfo.color }]}>
                    {categoryInfo.name}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.statusContainer}>
              {statusInfo.icon}
            </View>
          </View>
          
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Package size={16} color={isDarkMode ? '#8b949e' : '#64748B'} />
                <Text style={styles.detailText}>
                  {product.quantity} {product.unit}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Calendar size={16} color={isDarkMode ? '#8b949e' : '#64748B'} />
                <Text style={styles.dateText}>
                  {statusInfo.statusText}: {new Date(statusInfo.date || '').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </Text>
              </View>
            </View>
            
            {type === 'consumed' && onRestore && (
              <TouchableOpacity
                testID="restore-button"
                style={[styles.restoreButton, { alignSelf: 'flex-end' }]}
                onPress={() => onRestore(product.id)}
              >
                <RotateCcw size={20} color={isDarkMode ? '#4ade80' : '#16a34a'} />
                <Text style={{ color: isDarkMode ? '#4ade80' : '#16a34a', fontFamily: 'Inter-Medium', fontSize: 14 }}>
                  Ripristina
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
