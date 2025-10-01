import React, { memo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { Product } from '@/types/Product';

interface ProductDetailHeaderProps {
  product: Product;
}

export const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = memo(({ product }) => {
  const { isDarkMode } = useTheme();
  const { getCategoryById } = useCategories();
  const styles = getStyles(isDarkMode);

  const categoryInfo = product.category ? getCategoryById(product.category) : null;
  const displayName = typeof product.name === 'string' ? product.name : 'Nome non disponibile';

   return (
     <View style={styles.productCard}>
       <View style={styles.productHeader}>
         <View style={[
           styles.categoryIcon,
           { backgroundColor: categoryInfo ? categoryInfo.color + '20' : '#80808020' }
         ]}>
           {categoryInfo && categoryInfo.localIcon ? (
             <Image source={categoryInfo.localIcon} style={styles.categoryImage} />
           ) : categoryInfo && categoryInfo.icon && categoryInfo.icon.startsWith('http') ? (
             <Image source={{ uri: categoryInfo.icon }} style={styles.categoryImage} />
           ) : (
             <Text style={styles.categoryEmoji}>
               {categoryInfo ? categoryInfo.icon || '?' : '?'}
             </Text>
           )}
         </View>

         <View style={styles.productInfo}>
           <Text
             style={styles.productName}
             testID="product-name"
             accessibilityLabel={`Nome prodotto: ${displayName}`}
           >
             {displayName}
           </Text>

          {typeof product.brand === 'string' && product.brand.length > 0 && (
            <Text
              style={styles.brandName}
              accessibilityLabel={`Marca: ${product.brand}`}
            >
              {product.brand}
            </Text>
          )}

          <View style={[
            styles.categoryBadge,
            { backgroundColor: (categoryInfo?.color || '#808080') + '33' }
          ]}>
            <Text style={[
              styles.categoryName,
              { color: categoryInfo?.color || '#808080' }
            ]}>
              {categoryInfo?.name || 'Categoria sconosciuta'}
            </Text>
          </View>
        </View>
      </View>

      {product.imageUrl && (
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.productImage}
          accessibilityLabel={`Immagine di ${product.name}`}
          accessibilityRole="image"
        />
      )}
    </View>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  productCard: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover',
  },
});