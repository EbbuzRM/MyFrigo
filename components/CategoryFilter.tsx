import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Product, ProductCategory } from '@/types/Product';
import { useTheme } from '@/context/ThemeContext';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  products: Product[];
  categories: ProductCategory[];
}

export function CategoryFilter({ selectedCategory, onCategoryChange, products, categories: customCategories }: CategoryFilterProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') {
      return products.length;
    }
    // Gestisce sia 'category' che 'categoryId' per robustezza
    return products.filter(product => product.categoryId === categoryId || product.category === categoryId).length;
  };

  const categories = [
    { id: 'all', name: 'Tutti', icon: '📦', color: '#64748B' },
    ...customCategories,
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.categoriesContainer}>
          {categories.map((category) => {
            const count = getCategoryCount(category.id);
            const isSelected = selectedCategory === category.id;
            
            if (count === 0 && category.id !== 'all') {
              return null; // Don't show categories with no products
            }

            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  isSelected && styles.selectedCategoryButton,
                  { borderColor: isSelected ? category.color : '#e2e8f0' }
                ]}
                onPress={() => onCategoryChange(category.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    isSelected && { color: category.color }
                  ]}
                >
                  {category.name}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: isSelected ? category.color : '#f1f5f9' }
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: isSelected ? '#ffffff' : '#64748B' }
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

  const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  selectedCategoryButton: {
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  categoryName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginRight: 6,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    backgroundColor: isDarkMode ? '#30363d' : '#f1f5f9',
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#64748B',
  },
});
