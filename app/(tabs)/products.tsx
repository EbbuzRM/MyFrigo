import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ConsumeQuantityModal } from '@/components/ConsumeQuantityModal';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { useSettings } from '@/context/SettingsContext';
import { router } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { ProductStorage } from '@/services/ProductStorage';
import { LoggingService } from '@/services/LoggingService';
import { Product } from '@/types/Product';

const Products = () => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { products: allProducts, refreshProducts } = useProducts();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'fresh' | 'expiring' | 'expired'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isConsumeModalVisible, setIsConsumeModalVisible] = useState(false);
  const [productToConsume, setProductToConsume] = useState<Product | null>(null);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState(Date.now());

  // Funzione per determinare se fare auto-refresh intelligente
  const shouldAutoRefresh = useCallback(() => {
    const now = Date.now();
    const lastRefresh = lastRefreshTimestamp;

    // Refresh automatico dopo 2 minuti dall'ultimo refresh
    return (now - lastRefresh) > 120000; // 2 minuti
  }, [lastRefreshTimestamp]);

  // Funzione per spostare i prodotti scaduti nella cronologia
  const moveExpiredToHistory = useCallback(async () => {
    try {
      const expiredProducts = await ProductStorage.getExpiredProducts();
      if (expiredProducts.length > 0) {
        const productIds = expiredProducts.map(p => p.id!);
        await ProductStorage.moveProductsToHistory(productIds);
        const count = expiredProducts.length;
        LoggingService.info('ProductsScreen', `Moved ${count} expired products to history`);
      }
    } catch (error) {
      LoggingService.error('Products', 'Error moving expired products to history:', error);
    }
  }, []);

  // Usa un approccio più semplice - refresh intelligente basato su focus
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // CONSOLIDAMENTO: unico useFocusEffect per gestire tutte le operazioni al focus
  useFocusEffect(
    useCallback(() => {
      const handleScreenFocus = async () => {
        LoggingService.info('ProductsScreen', 'Screen focused');

        if (isFirstLoad) {
          LoggingService.info('ProductsScreen', 'First load - performing full setup');

          // 1. Sposta i prodotti scaduti nella cronologia
          await moveExpiredToHistory();

          // 2. Aggiorna i prodotti
          await refreshProducts();

          setLastRefreshTimestamp(Date.now());
          setIsFirstLoad(false);
        } else {
          // Dopo il primo carico, usa refresh intelligente
          const shouldRefresh = shouldAutoRefresh();
          if (shouldRefresh) {
            LoggingService.info('ProductsScreen', 'Auto-refresh triggered');
            await refreshProducts();
            setLastRefreshTimestamp(Date.now());
          }
        }
      };

      handleScreenFocus();
    }, [refreshProducts, shouldAutoRefresh, isFirstLoad, moveExpiredToHistory])
  );

  const onRefresh = useCallback(async () => {
    LoggingService.info('ProductsScreen', 'User triggered pull-to-refresh.');
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);


  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter(p => p.status === 'active');

    // Filtro per categorie multiple
    if (!selectedCategories.includes('all')) {
      filtered = filtered.filter(product =>
        selectedCategories.includes(product.category)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(product => {
        const expirationDate = new Date(product.expirationDate);
        expirationDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const notificationDays = settings?.notificationDays || 4;

        switch (selectedStatus) {
          case 'fresh':
            return diffDays > notificationDays;
          case 'expiring':
            return diffDays >= 0 && diffDays <= notificationDays;
          case 'expired':
            return diffDays < 0;
          default:
            return true;
        }
      });

      // Secondary filter: exclude frozen products from 'expiring' and 'expired' status
      if (selectedStatus === 'expiring' || selectedStatus === 'expired') {
        filtered = filtered.filter(p => !p.isFrozen);
      }
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.expirationDate).getTime();
      const dateB = new Date(b.expirationDate).getTime();
      return dateA - dateB;
    });

    LoggingService.info('ProductsScreen', `Filtering complete. ${filtered.length} products displayed.`);
    return filtered;
  }, [allProducts, selectedCategories, searchQuery, selectedStatus, settings?.notificationDays]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {searchQuery || !selectedCategories.includes('all')
          ? 'Nessun prodotto trovato'
          : 'Nessun prodotto ancora aggiunto'}
      </Text>
    </View>
  );

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const handleConsumeConfirm = async (consumedQuantity: number) => {
    if (!productToConsume) return;

    try {
      // Calcola la quantità totale attuale
      const currentTotalQuantity = productToConsume.quantities.reduce((sum, q) => sum + q.quantity, 0);
      const remainingQuantity = currentTotalQuantity - consumedQuantity;

      if (remainingQuantity > 0) {
        // Gestisce il consumo da quantità multiple
        const newQuantities = [...productToConsume.quantities];
        let remainingToDeduct = consumedQuantity;

        // Itera sulle quantità dal più grande al più piccolo
        newQuantities.sort((a, b) => b.quantity - a.quantity);

        for (let i = 0; i < newQuantities.length && remainingToDeduct > 0; i++) {
          if (newQuantities[i].quantity >= remainingToDeduct) {
            newQuantities[i].quantity -= remainingToDeduct;
            remainingToDeduct = 0;
          } else {
            remainingToDeduct -= newQuantities[i].quantity;
            newQuantities[i].quantity = 0;
          }
        }

        // Rimuovi le quantità con valore 0
        const filteredQuantities = newQuantities.filter(q => q.quantity > 0);

        // Create a full product object with the updated quantities to avoid not-null constraint violations
        const productToUpdate = {
          ...productToConsume,
          quantities: filteredQuantities
        };
        await ProductStorage.saveProduct(productToUpdate);
        LoggingService.info('ProductsScreen', `Updated quantity for ${productToConsume.name}. Remaining: ${remainingQuantity}`);
      } else {
        await ProductStorage.updateProductStatus(productToConsume.id!, 'consumed');
        LoggingService.info('ProductsScreen', `Product ${productToConsume.name} marked as consumed.`);
      }
      await refreshProducts();
    } catch (error) {
      LoggingService.error('ProductsScreen', 'Error consuming product', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il consumo del prodotto.');
    } finally {
      setIsConsumeModalVisible(false);
      setProductToConsume(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prodotti</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/add')}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca per nome o marca..."
            placeholderTextColor={isDarkMode ? '#8b949e' : '#64748B'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.statusFilters}>
          {[
            { key: 'all', label: 'Tutti' },
            { key: 'fresh', label: 'Freschi' },
            { key: 'expiring', label: 'In Scadenza' },
            { key: 'expired', label: 'Scaduti' }
          ].map((status) => (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.statusFilter,
                selectedStatus === status.key && styles.statusFilterActive
              ]}
              onPress={() => {
                LoggingService.info('ProductsScreen', `Status filter changed to: ${status.key}`);
                setSelectedStatus(status.key as 'all' | 'fresh' | 'expiring' | 'expired');
              }}
            >
              <Text style={[
                styles.statusFilterText,
                selectedStatus === status.key && styles.statusFilterTextActive
              ]}>
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <CategoryFilter
        selectedCategories={selectedCategories}
        onCategoryChange={(category) => {
          LoggingService.info('ProductsScreen', `Category filter toggled: ${category}`);

          setSelectedCategories(prev => {
            // Se si clicca "all", resetta tutto a ['all']
            if (category === 'all') {
              return ['all'];
            }

            // Se era selezionato solo "all", rimuovilo e inizia con la nuova categoria
            let newSelection = prev.includes('all') ? [] : [...prev];

            if (newSelection.includes(category)) {
              // Se la categoria è già presente, rimuovila
              newSelection = newSelection.filter(c => c !== category);
            } else {
              // Altrimenti aggiungila
              newSelection.push(category);
            }

            // Se non rimane nessuna categoria selezionata, torna a "all"
            if (newSelection.length === 0) {
              return ['all'];
            }

            return newSelection;
          });
        }}
        products={allProducts.filter(p => p.status === 'active')}
        categories={categories}
      />

      <FlatList
        testID="products-list"
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ProductCard
            product={item}
            categoryInfo={getCategoryInfo(item.category)}
            onPress={() => router.push({ pathname: '/manual-entry', params: { productId: item.id } })}
            onConsume={async () => {
              const unit = item.quantities && item.quantities.length > 0 ? item.quantities[0].unit : 'pezzi';
              const totalQuantity = item.quantities.reduce((sum, q) => sum + q.quantity, 0);

              // Always show modal when quantity > 1 to allow user to choose how much to consume
              if (totalQuantity > 1) {
                setProductToConsume(item);
                setIsConsumeModalVisible(true);
              } else {
                // For single quantity items, consume directly
                try {
                  await ProductStorage.updateProductStatus(item.id!, 'consumed');
                  await refreshProducts();
                  LoggingService.info('ProductsScreen', `Product ${item.name} marked as consumed directly.`);
                } catch (error) {
                  LoggingService.error('ProductsScreen', 'Error consuming product', error);
                  Alert.alert('Errore', 'Si è verificato un errore durante il consumo del prodotto.');
                }
              }
            }}
            onDelete={async () => {
              LoggingService.info('ProductsScreen', `User initiated deletion for product: ${item.id}`);
              try {
                await ProductStorage.deleteProduct(item.id!);
                await refreshProducts();
                LoggingService.info('Products', `Prodotto ${item.name} eliminato con successo`);
              } catch (error) {
                LoggingService.error('Products', `Errore durante l'eliminazione del prodotto: ${error}`);
              }
            }}
            index={index}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#c9d1d9' : '#64748B'}
          />
        }
      />

      {productToConsume && (
        <ConsumeQuantityModal
          visible={isConsumeModalVisible}
          product={productToConsume}
          onConfirm={handleConsumeConfirm}
          onCancel={() => {
            setIsConsumeModalVisible(false);
            setProductToConsume(null);
          }}
        />
      )}

    </SafeAreaView>
  );
};

export default Products;

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Aumentato per garantire che l'ultima card sia completamente visibile
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#21262d' : '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  statusFilters: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#21262d' : '#f1f5f9',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  statusFilterActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusFilterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
  statusFilterTextActive: {
    color: '#ffffff',
  },
});
