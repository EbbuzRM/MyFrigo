import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '@/services/StorageService';
import { Product } from '@/types/Product';
import { HistoryCard } from '@/components/HistoryCard';
import { HistoryStats } from '@/components/HistoryStats';
import { useFocusEffect } from 'expo-router'; // Import useFocusEffect

export default function History() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // useEffect(() => { // Replaced by useFocusEffect
  //   loadProducts();
  // }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      loadProducts();
      return () => {
        // Optional: cleanup
      };
    }, [])
  );

  const loadProducts = async () => {
    try {
      const storedProducts = await StorageService.getProducts();
      const historyProducts = await StorageService.getProductHistory();
      setProducts([...storedProducts, ...historyProducts]);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const getExpiredProducts = () => {
    const now = new Date();
    return products
      .filter(product => new Date(product.expirationDate) < now)
      .sort((a, b) => new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime());
  };

  const getConsumedProducts = () => {
    return products
      .filter(product => product.status === 'consumed')
      .sort((a, b) => new Date(b.consumedDate || 0).getTime() - new Date(a.consumedDate || 0).getTime());
  };

  const expiredProducts = getExpiredProducts();
  const consumedProducts = getConsumedProducts();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento storico...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Storico Prodotti</Text>
          <Text style={styles.subtitle}>
            Analisi dei tuoi consumi e prodotti scaduti
          </Text>
        </View>

        <HistoryStats
          totalProducts={products.length}
          expiredProducts={expiredProducts.length}
          consumedProducts={consumedProducts.length}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prodotti Consumati</Text>
          {consumedProducts.length > 0 ? (
            consumedProducts.slice(0, 10).map((product) => (
              <HistoryCard
                key={`consumed-${product.id}`}
                product={product}
                type="consumed"
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Nessun prodotto consumato registrato
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prodotti Scaduti</Text>
          {expiredProducts.length > 0 ? (
            expiredProducts.slice(0, 10).map((product) => (
              <HistoryCard
                key={`expired-${product.id}`}
                product={product}
                type="expired"
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Nessun prodotto scaduto
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
});
