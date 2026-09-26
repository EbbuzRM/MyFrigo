// history-detail.tsx — history-detail module.
//
// exports: HistoryDetailScreen | function
// used_by: none
// rules:   This module is a screen-level component that directly consumes `ProductStorage` and `LoggingService` services for data operations, and it must remain a self-contained screen without being imported by other modules.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { HistoryCard } from '@/components/HistoryCard';
import { Product } from '@/types/Product';
import { ArrowLeft } from 'lucide-react-native';
import { ProductStorage } from '@/services/ProductStorage';
import { LoggingService } from '@/services/LoggingService';
import { useTranslation } from 'react-i18next';

export default function HistoryDetailScreen() {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { filterType } = useLocalSearchParams<{ filterType: string }>();
  
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  // Carica i dati direttamente dal servizio
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const { data: products, error } = await ProductStorage.getProducts();
        
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
        setHasLoadError(true);
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
      const restoreResult = await ProductStorage.restoreConsumedProduct(productId);
      if (!restoreResult.success) {
        throw new Error(restoreResult.error);
      }
      // Rimuovi il prodotto dalla lista corrente invece di ricaricare tutto
      setProductList(currentProducts => currentProducts.filter(p => p.id !== productId));
      Alert.alert(t('history.restoreTitle'), t('history.restoreMessage'));
    } catch (error) {
      Alert.alert(t('history.restoreErrorTitle'), t('history.restoreErrorMessage'));
      LoggingService.error('HistoryDetail', 'Error restoring product:', error);
    }
  }, [t]);

  const headerTitle = filterType === 'all'
    ? t('history.historyAllTitle')
    : filterType === 'consumed'
      ? t('history.consumedTitle')
      : filterType === 'expired'
        ? t('history.expiredTitle')
        : t('history.detailFallbackTitle');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel={t('history.backLabel')} accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={styles.title}>{headerTitle}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
          <Text style={styles.loadingText}>{t('common.loadingProducts')}</Text>
        </View>
      ) : hasLoadError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('history.loadError')}</Text>
          <TouchableOpacity
            accessibilityLabel={t('common.retry')}
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => {
              setHasLoadError(false);
              setLoading(true);
              // Ricarica i dati
              ProductStorage.getProducts().then(({data, error}) => {
                if (error) {
                  setHasLoadError(true);
                } else if (data) {
                  setProductList(data);
                }
                setLoading(false);
              });
            }}
          >
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
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
              <Text style={styles.emptyStateText}>{t('history.detailEmpty')}</Text>
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
