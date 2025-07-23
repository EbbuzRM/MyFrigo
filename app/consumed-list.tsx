import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '@/services/StorageService';
import { HistoryCard } from '@/components/HistoryCard';
import { useFocusEffect, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Product } from '@/types/Product';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ArrowLeft } from 'lucide-react-native';

export default function ConsumedListScreen() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [consumedProducts, setConsumedProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const history = await StorageService.getHistory();
      const consumed = history.filter(p => p.status === 'consumed');
      setConsumedProducts(consumed);
    } catch (error) {
      console.error("Failed to load consumed products:", error);
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

  const handleRestoreProduct = useCallback(async (productId: string) => {
    try {
      await StorageService.restoreConsumedProduct(productId);
      Alert.alert('Prodotto Ripristinato', 'Il prodotto è stato spostato nuovamente nella tua dispensa.');
      loadData(); // Ricarica la lista per riflettere il cambiamento
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore durante il ripristino del prodotto.');
      console.error('Error restoring product:', error);
    }
  }, [loadData]);

  const renderHistoryItem = ({ item }: { item: Product }) => (
    <HistoryCard
      product={item}
      type="consumed"
      onRestore={handleRestoreProduct}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={styles.title}>Prodotti Consumati</Text>
      </View>
      <FlatList
        data={consumedProducts}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nessun prodotto consumato di recente.</Text>
          </View>
        )}
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
    padding: 4,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
  },
});
