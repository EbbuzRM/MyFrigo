import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, CheckCircle, XCircle } from 'lucide-react-native';
import { Product, PRODUCT_CATEGORIES } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0', // Added dark mode border
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff', // Added dark mode background
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
  statusContainer: {
    padding: 4,
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
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
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginLeft: 6,
  },
  consumedIcon: {
    color: isDarkMode ? '#10B981' : '#10B981',
  },
  expiredIcon: {
    color: isDarkMode ? '#EF4444' : '#EF4444',
  },
});

interface HistoryCardProps {
  product: Product;
  type: 'consumed' | 'expired';
}

export function HistoryCard({ product, type }: HistoryCardProps) {
  const { isDarkMode } = useTheme();
  const componentStyles = getStyles(isDarkMode);
  
  const getCategoryInfo = () => {
    return PRODUCT_CATEGORIES.find(cat => cat.id === product.category) || PRODUCT_CATEGORIES[PRODUCT_CATEGORIES.length - 1];
  };

  const getStatusInfo = () => {
    if (type === 'consumed') {
      return {
        icon: <CheckCircle size={24} color={componentStyles.consumedIcon.color} />,
        backgroundColor: isDarkMode ? '#162d21' : '#F0FDF4', // Dark green for consumed in dark mode
        borderColor: isDarkMode ? '#22402d' : '#DCFCE7', // Darker green border
        statusText: 'Consumato',
        date: product.consumedDate,
      };
    } else {
      return {
        icon: <XCircle size={24} color={componentStyles.expiredIcon.color} />,
        backgroundColor: isDarkMode ? '#2a1212' : '#FEF2F2', // Dark red for expired in dark mode
        borderColor: isDarkMode ? '#4d1a1a' : '#FECACA', // Darker red border
        statusText: 'Scaduto',
        date: product.expirationDate,
      };
    }
  };

  const categoryInfo = getCategoryInfo();
  const statusInfo = getStatusInfo();

  return (
    <View style={[componentStyles.card, { backgroundColor: statusInfo.backgroundColor, borderColor: statusInfo.borderColor }]}>
      <View style={componentStyles.content}>
        <View style={componentStyles.header}>
          <View style={componentStyles.productInfo}>
            <View style={[componentStyles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={[componentStyles.categoryEmoji, { color: isDarkMode ? '#c9d1d9' : '#1e293b' }]}>{categoryInfo.icon}</Text>
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
        </View>
      </View>
    </View>
  );
}
