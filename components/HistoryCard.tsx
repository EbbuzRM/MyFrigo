import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Calendar, CheckCircle, XCircle, RotateCcw } from 'lucide-react-native';
import { Product } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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
  categoryImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restoreButton: {
    padding: 4,
    marginLeft: 8,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

interface HistoryCardProps {
  product: Product;
  type: 'consumed' | 'expired';
  onRestore?: (productId: string) => void;
}

export function HistoryCard({ product, type, onRestore }: HistoryCardProps) {
  const { isDarkMode } = useTheme();
  const { getCategoryById } = useCategories();
  const componentStyles = getStyles(isDarkMode);

  const categoryInfo = getCategoryById(product.category);

  const getStatusInfo = () => {
    const themeColors = {
      consumed: {
        icon: <CheckCircle size={24} color={isDarkMode ? '#4ade80' : '#16a34a'} />,
        backgroundColor: isDarkMode ? '#142e1f' : '#f0fdf4',
        borderColor: isDarkMode ? '#1c4b2a' : '#bbf7d0',
      },
      expired: {
        icon: <XCircle size={24} color={isDarkMode ? '#f87171' : '#dc2626'} />,
        backgroundColor: isDarkMode ? '#311919' : '#fee2e2',
        borderColor: isDarkMode ? '#5b2121' : '#fecaca',
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
    <View style={[componentStyles.card, { backgroundColor: statusInfo.backgroundColor, borderColor: statusInfo.borderColor }]}>
      <View style={componentStyles.content}>
        <View style={componentStyles.header}>
          <View style={componentStyles.productInfo}>
            <View style={[componentStyles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
              {categoryInfo.iconUrl ? (
                <Image source={{ uri: categoryInfo.iconUrl }} style={componentStyles.categoryImage} />
              ) : (
                <Text style={componentStyles.categoryEmoji}>{categoryInfo.icon}</Text>
              )}
            </View>
            <View style={componentStyles.textContainer}>
              <Text style={componentStyles.productName} numberOfLines={1}>
                {product.name}
              </Text>
              {product.brand && (
                <Text style={componentStyles.brandName} numberOfLines={1}>
                  {product.brand}
                </Text>
              )}
            </View>
          </View>
          <View style={componentStyles.statusContainer}>
            {statusInfo.icon}
          </View>
        </View>
        
        <View style={componentStyles.details}>
          <View style={componentStyles.detailItem}>
            <Calendar size={16} color={componentStyles.detailText.color} />
            <Text style={componentStyles.detailText}>
              {statusInfo.statusText}: {new Date(statusInfo.date || '').toLocaleDateString('it-IT')}
            </Text>
          </View>
          {type === 'consumed' && onRestore && (
            <TouchableOpacity style={componentStyles.restoreButton} onPress={() => onRestore(product.id)}>
              <RotateCcw size={20} color={isDarkMode ? '#4ade80' : '#16a34a'} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
