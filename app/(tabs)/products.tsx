import React, { useState, useEffect } from 'react';
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
import { Search, Filter } from 'lucide-react-native';
import { StorageService } from '@/services/StorageService';
import { Product, ProductCategory, PRODUCT_CATEGORIES } from '@/types/Product';
import { useFocusEffect, router, useLocalSearchParams } from 'expo-router';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { useTheme } from '@/context/ThemeContext';

type ProductFilter = 'all' | 'expired' | 'expiring';

export default function Products() {
  const { isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>(PRODUCT_CATEGORIES);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentFilter, setCurrentFilter] = useState<ProductFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = StorageService.listenToProducts((storedProducts) => {
      setProducts(storedProducts.filter(p => p.status !== 'consumed'));
      setLoading(false);
    });

    const loadCategories = async () => {
      try {
        const storedCategories = await StorageService.getCategories();
        const combined = [...PRODUCT_CATEGORIES];
        storedCategories.forEach(storedCat => {
          if (!combined.some(defaultCat => defaultCat.id === storedCat.id)) {
            combined.push(storedCat);
          }
        });
        setCategories(combined);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    
    loadCategories();

    return () => unsubscribe();
  }, []);

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
    filterProducts();
  }, [products, searchQuery, selectedCategory, currentFilter]);

  const filterProducts = () => {
    let filtered = [...products];

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
    if (currentFilter === 'expired') {
      filtered = filtered.filter(product => new Date(product.expirationDate) < now);
    } else if (currentFilter === 'expiring') {
      const notificationDaysForExpiring = 7;
      const notificationPeriod = new Date(now.getTime() + notificationDaysForExpiring * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(product => {
        const expirationDate = new Date(product.expirationDate);
        return expirationDate <= notificationPeriod && expirationDate >= now;
      });
    }

    filtered.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

    setFilteredProducts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await StorageService.deleteProduct(productId);
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert("Errore", "Impossibile eliminare il prodotto.");
    }
  };

  const handleConsumeProduct = async (productId: string) => {
    try {
      await StorageService.updateProductStatus(productId, 'consumed');
      Alert.alert("Prodotto Consumato", "Il prodotto è stato segnato come consumato e spostato nello storico.");
    } catch (error) {
      console.error('Error consuming product:', error);
      Alert.alert("Errore", "Impossibile segnare il prodotto come consumato.");
    }
  };

  const styles = getStyles(isDarkMode);

  if (loading) {
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
        <Text style={styles.subtitle}>{filteredProducts.length} prodotti attivi trovati</Text>
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

      {/* Filter buttons for product status */}
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
        products={products}
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
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={() => handleDeleteProduct(product.id)}
                onConsume={() => handleConsumeProduct(product.id)}
                onPress={() => router.push({ pathname: '/manual-entry', params: { productId: product.id } })}
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
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8fafc',
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
    paddingBottom: 20,
  },
  emptyState: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#f1f5f9',
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
    backgroundColor: isDarkMode ? '#21262d' : '#E2E8F0',
  },
  statusFilterButtonActive: {
    backgroundColor: '#2563EB',
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
