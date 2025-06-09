import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Product, PRODUCT_CATEGORIES } from '@/types/Product';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  products: Product[];
}

export function CategoryFilter({ selectedCategory, onCategoryChange, products }: CategoryFilterProps) {
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') {
      return products.length;
    }
    return products.filter(product => product.category === categoryId).length;
  };

  const categories = [
    { id: 'all', name: 'Tutti', icon: '📦', color: '#64748B' },
    ...PRODUCT_CATEGORIES,
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

const styles = StyleSheet.create({
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedCategoryButton: {
    backgroundColor: '#ffffff',
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
  },
  categoryName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginRight: 6,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
});