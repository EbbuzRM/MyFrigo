import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { HistoryCard } from '@/components/HistoryCard';
import { Product } from '@/types/Product';
import { ArrowLeft } from 'lucide-react-native';
import { StorageService } from '@/services/StorageService';
import { LoggingService } from '@/services/LoggingService';

export default function HistoryDetailScreen() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { filterType, title } = useLocalSearchParams<{ filterType: string, title: string }>();
  
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica i dati direttamente dal servizio
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const { data: products, error } = await StorageService.getProducts();
        
        if (error) {
          throw error;
        }
        
        if (products) {
          const now = new Date();
          let filteredProducts: Product[] = [];
          
          // Filtra i prodotti in base al tipo selezionato
          if (filterType === 'all') {
            filteredProducts = products.filter(p =>
              p.status === 'consumed' || p.status === 'expired' ||
              (p.status === 'active' && new Date(p.expirationDate) < now)
            );
          } else if (filterType === 'consumed') {
            filteredProducts = products.filter(p => p.status === 'consumed');
          } else if (filterType === 'expired') {
            filteredProducts = products.filter(p =>
              p.status === 'expired' ||
              (p.status === 'active' && new Date(p.expirationDate) < now)
            );
          }
          
          setProductList(filteredProducts);
        } else {
          setProductList([]);
        }
      } catch (err) {
        LoggingService.error('HistoryDetail', 'Failed to load products:', err);
        setError("Si è verificato un errore durante il caricamento dei prodotti.");
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [filterType]);

  const sortedProducts = useMemo(() => {
    return [...productList].sort((a, b) => {
      const dateA = new Date(a.status === 'consumed' ? a.consumedDate! : a.expirationDate);
      const dateB = new Date(b.status === 'consumed' ? b.consumedDate! : b.expirationDate);
      return dateB.getTime() - dateA.getTime();
    });
  }, [productList]);

  const handleRestoreProduct = useCallback(async (productId: string) => {
    try {
      await StorageService.restoreConsumedProduct(productId);
      // Rimuovi il prodotto dalla lista corrente invece di ricaricare tutto
      setProductList(currentProducts => currentProducts.filter(p => p.id !== productId));
      Alert.alert('Prodotto Ripristinato', 'Il prodotto è stato spostato nuovamente nella tua dispensa.');
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore durante il ripristino del prodotto.');
      LoggingService.error('HistoryDetail', 'Error restoring product:', error);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={styles.title}>{title || 'Dettaglio Storico'}</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
          <Text style={styles.loadingText}>Caricamento prodotti...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              // Ricarica i dati
              StorageService.getProducts().then(({data, error}) => {
                if (error) {
                  setError("Si è verificato un errore durante il caricamento dei prodotti.");
                } else if (data) {
                  setProductList(data);
                }
                setLoading(false);
              });
              
              const styles = StyleSheet.create({
                // Existing styles
                errorText: {
                  color: 'red',
                  textAlign: 'center',
                  marginTop: 20,
                },
              });
            }}
          >
            <Text style={styles.retryButtonText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedProducts}
          renderItem={({ item, index }) => (
            <HistoryCard
              product={item}
              type={item.status as 'consumed' | 'expired'}
              onRestore={item.status === 'consumed' ? handleRestoreProduct : undefined}
              index={index}
            />
          )}
          keyExtractor={(item) => `${item.id}-${item.status}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nessun prodotto da mostrare.</Text>
            </View>
          }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Aumentato per garantire che l'ultima card sia completamente visibile
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748b',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#f85149' : '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});
