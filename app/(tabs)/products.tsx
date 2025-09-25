import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { useSettings } from '@/context/SettingsContext';
import { router } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { StorageService } from '@/services/StorageService';
import { LoggingService } from '@/services/LoggingService';

const Products = () => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { products: allProducts, refreshProducts } = useProducts();
  const { categories } = useCategories();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'fresh' | 'expiring' | 'expired'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      LoggingService.info('ProductsScreen', 'Screen focused, refreshing products.');
      refreshProducts();
    }, [refreshProducts])
  );

  const onRefresh = useCallback(async () => {
    LoggingService.info('ProductsScreen', 'User triggered pull-to-refresh.');
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);


  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter(p => p.status === 'active');

    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category === selectedCategory
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
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.expirationDate).getTime();
      const dateB = new Date(b.expirationDate).getTime();
      return dateA - dateB;
    });

    LoggingService.info('ProductsScreen', `Filtering complete. ${filtered.length} products displayed.`);
    return filtered;
  }, [allProducts, selectedCategory, searchQuery, selectedStatus, settings?.notificationDays]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {searchQuery || selectedCategory 
          ? 'Nessun prodotto trovato' 
          : 'Nessun prodotto ancora aggiunto'}
      </Text>
    </View>
  );

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  

  const handleMoveExpiredToHistory = useCallback(async () => {
    try {
      const expiredProducts = await StorageService.getExpiredProducts();
      if (expiredProducts.length > 0) {
        const productIds = expiredProducts.map(p => p.id!);
        await StorageService.moveProductsToHistory(productIds);
        await refreshProducts();
        Alert.alert('Successo', `${expiredProducts.length} prodotti scaduti sono stati spostati nella cronologia.`);
      }
    } catch (error) {
      LoggingService.error('Products', 'Errore durante lo spostamento dei prodotti scaduti nella cronologia:', error);
      Alert.alert('Errore', 'Errore durante lo spostamento dei prodotti scaduti.');
    }
  }, [refreshProducts]);

  useFocusEffect(
    useCallback(() => {
      handleMoveExpiredToHistory();
    }, [handleMoveExpiredToHistory])
  );

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
        selectedCategory={selectedCategory || 'all'}
        onCategoryChange={(category) => {
          const newCategory = category === 'all' ? null : category;
          LoggingService.info('ProductsScreen', `Category filter changed to: ${newCategory}`);
          setSelectedCategory(newCategory);
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
            onPress={() => router.push(`/product-detail?id=${item.id}`)}
            onDelete={async () => {
              LoggingService.info('ProductsScreen', `User initiated deletion for product: ${item.id}`);
              try {
                setIsDeleting(true);
                await StorageService.deleteProduct(item.id!);
                await refreshProducts();
                LoggingService.info('Products', `Prodotto ${item.name} eliminato con successo`);
              } catch (error) {
                LoggingService.error('Products', `Errore durante l'eliminazione del prodotto: ${error}`);
              } finally {
                setIsDeleting(false);
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
