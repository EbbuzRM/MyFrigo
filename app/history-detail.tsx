import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { HistoryCard } from '@/components/HistoryCard';
import { Product } from '@/types/Product';
import { ArrowLeft } from 'lucide-react-native';
import { StorageService } from '@/services/StorageService';

export default function HistoryDetailScreen() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { products: productsJson, title } = useLocalSearchParams<{ products: string, title: string }>();

  // Usiamo useState per poter aggiornare la lista dopo il ripristino
  const [productList, setProductList] = useState<Product[]>(() => {
    try {
      return productsJson ? JSON.parse(productsJson) : [];
    } catch (e) {
      console.error("Failed to parse initial products:", e);
      return [];
    }
  });

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
      console.error('Error restoring product:', error);
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
      <FlatList
        data={sortedProducts}
        renderItem={({ item }) => (
          <HistoryCard
            product={item}
            type={item.status as 'consumed' | 'expired'}
            onRestore={item.status === 'consumed' ? handleRestoreProduct : undefined}
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
});
