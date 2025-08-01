import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { useProducts } from '@/context/ProductContext'; // Importa il contesto
import { StorageService } from '@/services/StorageService'; // Mantenuto per delete/update
import * as Haptics from 'expo-haptics';

type ProductFilter = 'all' | 'expired' | 'expiring';

const Products = () => {
  const { isDarkMode } = useTheme();
  const { categories, getCategoryById, loading: categoriesLoading } = useCategories();
  const { products: allProducts, loading: productsLoading, refreshProducts } = useProducts(); // Usa il contesto
  const params = useLocalSearchParams();
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentFilter, setCurrentFilter] = useState<ProductFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (params.filter && typeof params.filter === 'string') {
        setCurrentFilter(params.filter as ProductFilter);
      } else {
        setCurrentFilter('all');
      }
    }, [params.filter])
  );

  useEffect(() => {
    const filterProducts = () => {
      // Inizia con i prodotti non consumati
      let filtered = allProducts.filter(p => p.status !== 'consumed');

      if (searchQuery.trim()) {
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (selectedCategory !== 'all') {
        filtered = filtered.filter(product => product.category === selectedCategory);
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (currentFilter === 'expired') {
        filtered = filtered.filter(product => {
          const expirationDate = new Date(product.expirationDate);
          expirationDate.setHours(0, 0, 0, 0);
          return expirationDate < now;
        });
      } else if (currentFilter === 'expiring') {
        const notificationDaysForExpiring = 7; // O leggere dalle impostazioni se necessario
        const limitDate = new Date(now.getTime() + notificationDaysForExpiring * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(product => {
          const expirationDate = new Date(product.expirationDate);
          expirationDate.setHours(0, 0, 0, 0);
          return expirationDate >= now && expirationDate <= limitDate;
        });
      }

      filtered.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
      setFilteredProducts(filtered);
    };

    filterProducts();
  }, [allProducts, searchQuery, selectedCategory, currentFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      await StorageService.deleteProduct(productId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error deleting product:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Errore", "Impossibile eliminare il prodotto.");
    }
  }, []);

  const handleConsumeProduct = useCallback(async (productId: string) => {
    try {
      await StorageService.updateProductStatus(productId, 'consumed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Prodotto Consumato", "Il prodotto è stato segnato come consumato e spostato nello storico.");
    } catch (error) {
      console.error('Error consuming product:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Errore", "Impossibile segnare il prodotto come consumato.");
    }
  }, []);

  const styles = getStyles(isDarkMode);

  if (productsLoading || categoriesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento prodotti...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>I Miei Prodotti</Text>
        <Text style={styles.subtitle}>{filteredProducts.length} prodotti trovati</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca prodotti..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      <View style={styles.statusFilterContainer}>
        <TouchableOpacity
          style={[styles.statusFilterButton, currentFilter === 'all' && styles.statusFilterButtonActive]}
          onPress={() => setCurrentFilter('all')}
        >
          <Text style={[styles.statusFilterText, currentFilter === 'all' && styles.statusFilterTextActive]}>Tutti</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusFilterButton, currentFilter === 'expiring' && styles.statusFilterButtonActive]}
          onPress={() => setCurrentFilter('expiring')}
        >
          <Text style={[styles.statusFilterText, currentFilter === 'expiring' && styles.statusFilterTextActive]}>In Scadenza</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusFilterButton, currentFilter === 'expired' && styles.statusFilterButtonActive]}
          onPress={() => setCurrentFilter('expired')}
        >
          <Text style={[styles.statusFilterText, currentFilter === 'expired' && styles.statusFilterTextActive]}>Scaduti</Text>
        </TouchableOpacity>
      </View>

      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        products={allProducts.filter(p => p.status !== 'consumed')}
        categories={categories}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.productsContainer}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryInfo={getCategoryById(product.category)}
                onDelete={() => handleDeleteProduct(product.id)}
                onConsume={() => handleConsumeProduct(product.id)}
                onPress={() => router.push({ pathname: '/manual-entry', params: { productId: product.id } })}
                index={index}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery || selectedCategory !== 'all'
                  ? 'Nessun prodotto trovato con i filtri applicati'
                  : 'Nessun prodotto attivo. Inizia aggiungendo il tuo primo prodotto!'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Esportazione predefinita del componente
export default Products;

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#c9d1d9' : '#64748B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  productsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Aggiunto spazio in fondo
  },
  emptyState: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    textAlign: 'center',
  },
  statusFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  statusFilterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusFilterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#c9d1d9' : '#64748B',
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
  },
});
