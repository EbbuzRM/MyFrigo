import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '@/services/StorageService';
import { Product } from '@/types/Product';
import { HistoryCard } from '@/components/HistoryCard';
import { HistoryStats } from '@/components/HistoryStats';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function History() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [consumedProducts, setConsumedProducts] = useState<Product[]>([]);
  const [expiredProducts, setExpiredProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allProducts = await StorageService.getProducts();
      const now = new Date();
      const expired = allProducts
        .filter(p => p.status === 'expired' || (p.status === 'active' && new Date(p.expirationDate) < now))
        .sort((a, b) => new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime());
      setExpiredProducts(expired);

      const history = await StorageService.getHistory();
      setConsumedProducts(history);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>Storico Prodotti</Text>
        <Text style={styles.subtitle}>
          Analisi dei tuoi consumi e prodotti scaduti
        </Text>
      </View>

      <HistoryStats
        totalProducts={consumedProducts.length + expiredProducts.length}
        expiredProducts={expiredProducts.length}
        consumedProducts={consumedProducts.length}
      />

      <View style={styles.listsContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prodotti Consumati</Text>
          <FlatList
            data={consumedProducts.slice(0, 10)}
            renderItem={({ item }) => <HistoryCard product={item} type="consumed" />}
            keyExtractor={(item) => `consumed-${item.id}`}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Nessun prodotto consumato registrato</Text>
              </View>
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prodotti Scaduti</Text>
          <FlatList
            data={expiredProducts.slice(0, 10)}
            renderItem={({ item }) => <HistoryCard product={item} type="expired" />}
            keyExtractor={(item) => `expired-${item.id}`}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Nessun prodotto scaduto</Text>
              </View>
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8fafc',
  },
  listsContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#8b949e' : '#64748B',
  },
  header: {
    padding: 20,
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
    marginBottom: 5, // Reduced margin
  },
  section: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 5,
  },
  emptyState: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#f1f5f9',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    textAlign: 'center',
  },
});
