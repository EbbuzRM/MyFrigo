import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { HistoryCard } from '@/components/HistoryCard';
import { Product } from '@/types/Product';
import { ArrowLeft } from 'lucide-react-native';
import { StorageService } from '@/services/StorageService';

export default function HistoryDetailScreen() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { } = useCategories();
  const { type, title } = useLocalSearchParams<{ type: 'consumed' | 'expired' | 'all', title: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAndFilterProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await StorageService.getProducts();
        const now = new Date();

        const finalProducts = allProducts
          .map(p => {
            // Assegna uno stato 'expired' temporaneo ai prodotti attivi ma la cui data di scadenza è passata
            if (p.status === 'active' && new Date(p.expirationDate) < now) {
              return { ...p, status: 'expired' as const }; 
            }
            return p;
          })
          .filter(p => {
            // Filtra in base al tipo richiesto
            if (type === 'all') {
              return p.status === 'consumed' || p.status === 'expired';
            }
            return p.status === type;
          })
          .sort((a, b) => {
            // Ordina usando la data corretta in base allo stato
            const dateA = new Date(a.status === 'consumed' ? a.consumedDate! : a.expirationDate);
            const dateB = new Date(b.status === 'consumed' ? b.consumedDate! : b.expirationDate);
            return dateB.getTime() - dateA.getTime();
          });
          
        setProducts(finalProducts);

      } catch (error) {
        console.error("Failed to load history details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (type) {
      loadAndFilterProducts();
    }
  }, [type]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={styles.title}>{title || 'Dettaglio Storico'}</Text>
      </View>
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <HistoryCard
            product={item}
            type={item.status as 'consumed' | 'expired'}
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
