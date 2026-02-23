import React, { useMemo, useCallback } from 'react';
import { RefreshControl, StyleSheet } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Product, ProductCategory } from '@/types/Product';
import { ProductCard } from '@/components/ProductCard';
import { useTheme } from '@/context/ThemeContext';
import { EmptyProductState } from './EmptyProductState';

/**
 * Props for ProductList component
 */
interface ProductListProps {
  /** Filtered products to display */
  products: Product[];
  /** Available categories for product info lookup */
  categories: ProductCategory[];
  /** Whether list is refreshing */
  refreshing: boolean;
  /** Callback to refresh products */
  onRefresh: () => void;
  /** Callback when product is pressed (navigate to detail) */
  onProductPress: (product: Product) => void;
  /** Callback when consume action is triggered */
  onConsume: (product: Product) => void;
  /** Callback when delete action is triggered */
  onDelete: (product: Product) => void;
  /** Whether a search query is active */
  hasSearchQuery: boolean;
  /** Whether categories are filtered */
  hasCategoryFilter: boolean;
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Product list component
 * Renders FlashList of ProductCard components with pull-to-refresh
 * 
 * @param props - Component props
 * @returns ProductList component
 */
export function ProductList({
  products,
  categories,
  refreshing,
  onRefresh,
  onProductPress,
  onConsume,
  onDelete,
  hasSearchQuery,
  hasCategoryFilter,
  testID = "products-list",
}: ProductListProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  /**
   * Memoized category map for O(1) lookup
   */
  const categoryMap = useMemo(() => {
    const map = new Map<string, ProductCategory>();
    categories.forEach(cat => map.set(cat.id, cat));
    return map;
  }, [categories]);

  /**
   * Get category info for a product (O(1) lookup)
   */
  const getCategoryInfo = (categoryId: string): ProductCategory | undefined => {
    return categoryMap.get(categoryId);
  };

  /**
   * Render individual product item
   */
  const renderItem: ListRenderItem<Product> = useCallback(({ item, index }) => (
    <ProductCard
      product={item}
      categoryInfo={getCategoryInfo(item.category)}
      onPress={() => onProductPress(item)}
      onConsume={() => onConsume(item)}
      onDelete={() => onDelete(item)}
      index={index}
    />
  ), [onProductPress, onConsume, onDelete]);

  /**
   * Render empty state when no products
   */
  const renderEmptyComponent = (): React.ReactElement => (
    <EmptyProductState
      hasSearchQuery={hasSearchQuery}
      hasCategoryFilter={hasCategoryFilter}
    />
  );

  const keyExtractor = (item: Product): string => item.id;

  return (
    <FlashList
      testID={testID}
      data={products}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmptyComponent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={isDarkMode ? '#c9d1d9' : '#64748B'}
          accessibilityLabel="Aggiorna lista prodotti"
        />
      }
      accessibilityRole="list"
      accessibilityLabel="Lista dei prodotti"
    />
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
});
