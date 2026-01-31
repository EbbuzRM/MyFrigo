import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { useSettings } from '@/context/SettingsContext';
import { router } from 'expo-router';

import { Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';
import { ProductStatusFilter } from '@/constants/productFilters';

import { useProductSearch } from '@/hooks/useProductSearch';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useProductActions } from '@/hooks/useProductActions';
import { useProductRefresh } from '@/hooks/useProductRefresh';

import { ProductsHeader } from '@/components/products/ProductsHeader';
import { SearchBar } from '@/components/products/SearchBar';
import { StatusFilterBar } from '@/components/products/StatusFilterBar';
import { CategoryFilterBar } from '@/components/products/CategoryFilterBar';
import { ProductList } from '@/components/products/ProductList';
import { ConsumeQuantityModal } from '@/components/ConsumeQuantityModal';

/**
 * Products screen component
 * Main screen for viewing and managing products in the fridge
 * Features: search, category/status filters, consume/delete actions
 */
export default function ProductsScreen(): React.ReactElement {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  // Context data
  const { products: allProducts, refreshProducts: refreshProductsFromContext } = useProducts();
  const { categories } = useCategories();
  const { settings } = useSettings();

  // Local state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [selectedStatus, setSelectedStatus] = useState<ProductStatusFilter>('all');
  const [productToConsume, setProductToConsume] = useState<Product | null>(null);
  const [isConsumeModalVisible, setIsConsumeModalVisible] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);

  // Custom hooks
  const { searchQuery, setSearchQuery, hasSearchQuery } = useProductSearch();
  const { filteredProducts } = useProductFilters({
    allProducts,
    selectedCategories,
    searchQuery,
    selectedStatus,
    notificationDays: settings?.notificationDays,
  });
  const { refreshing, onRefresh, shouldAutoRefresh, moveExpiredToHistory, refreshProducts } = useProductRefresh({
    refreshProductsFromContext,
  });

  // Product actions
  const handleShowConsumeModal = useCallback((product: Product): void => {
    setProductToConsume(product);
    setIsConsumeModalVisible(true);
  }, []);

  const handleCloseConsumeModal = useCallback((): void => {
    setIsConsumeModalVisible(false);
    setProductToConsume(null);
  }, []);

  const { handleDirectConsume, handleDelete, handleConsumeConfirm } = useProductActions({
    refreshProducts,
    onShowConsumeModal: handleShowConsumeModal,
  });

  // Handle consume with quantity from modal
  const handleConsumeWithQuantity = useCallback(async (consumedQuantity: number): Promise<void> => {
    if (!productToConsume) return;
    await handleConsumeConfirm(productToConsume, consumedQuantity);
    handleCloseConsumeModal();
  }, [productToConsume, handleConsumeConfirm, handleCloseConsumeModal]);

  // Handle consume button press - decides between direct consume or modal
  const handleConsume = useCallback((product: Product): void => {
    const totalQuantity = product.quantities.reduce((sum, q) => sum + q.quantity, 0);

    if (totalQuantity > 1) {
      handleShowConsumeModal(product);
    } else {
      handleDirectConsume(product);
    }
  }, [handleShowConsumeModal, handleDirectConsume]);

  // Handle product press - navigate to detail
  const handleProductPress = useCallback((product: Product): void => {
    router.push({
      pathname: '/manual-entry',
      params: { productId: product.id },
    });
  }, []);

  // Screen focus effect - auto-refresh and move expired products
  useFocusEffect(
    useCallback(() => {
      const handleScreenFocus = async (): Promise<void> => {
        LoggingService.info('ProductsScreen', 'Screen focused');

        if (isFirstLoad) {
          LoggingService.info('ProductsScreen', 'First load - performing full setup');
          await moveExpiredToHistory();
          await refreshProductsFromContext();
          setIsFirstLoad(false);
        } else if (shouldAutoRefresh()) {
          LoggingService.info('ProductsScreen', 'Auto-refresh triggered');
          await refreshProductsFromContext();
        }
      };

      handleScreenFocus();
    }, [isFirstLoad, refreshProductsFromContext, shouldAutoRefresh, moveExpiredToHistory])
  );

  const activeProducts = allProducts.filter(p => p.status === 'active');

  return (
    <SafeAreaView style={styles.container}>
      <ProductsHeader />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <StatusFilterBar
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <CategoryFilterBar
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        products={activeProducts}
        categories={categories}
      />

      <ProductList
        products={filteredProducts}
        categories={categories}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onProductPress={handleProductPress}
        onConsume={handleConsume}
        onDelete={handleDelete}
        hasSearchQuery={hasSearchQuery}
        hasCategoryFilter={!selectedCategories.includes('all')}
      />

      {productToConsume && (
        <ConsumeQuantityModal
          visible={isConsumeModalVisible}
          product={productToConsume}
          onConfirm={handleConsumeWithQuantity}
          onCancel={handleCloseConsumeModal}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
  },
});
