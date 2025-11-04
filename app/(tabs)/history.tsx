import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductStorage } from '@/services/ProductStorage';
import { HistoryStats } from '@/components/HistoryStats';
import { SuggestionCard } from '@/components/SuggestionCard';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { Product } from '@/types/Product';

// Costanti per il timeout e la memorizzazione
const LOADING_TIMEOUT = 15000; // 15 secondi di timeout invece di 5
const THROTTLE_TIME = 5000; // 5 secondi di throttling

// Componente per la visualizzazione della cronologia
const History = () => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [allHistory, setAllHistory] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Riferimenti per il timeout e la memorizzazione
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadTimeRef = useRef<number>(0);
  const dataLoadedRef = useRef<boolean>(false);

  const loadData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && now - lastLoadTimeRef.current < THROTTLE_TIME) {
      LoggingService.info('History', 'Throttling data load - skipped');
      setRefreshing(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (loading) {
        LoggingService.error('History', 'Loading timeout reached');
        setLoading(false);
        setError('Caricamento troppo lungo, riprova più tardi');
        setRefreshing(false);
      }
    }, LOADING_TIMEOUT);

    LoggingService.info('History', 'Starting data load');

    try {
      const [consumedProducts, activeExpiredProducts, trulyExpiredProducts] = await Promise.all([
        ProductStorage.getHistory(),
        ProductStorage.getExpiredProducts(),
        ProductStorage.getTrulyExpiredProducts(),
      ]);

      const combinedHistory = [...consumedProducts, ...activeExpiredProducts, ...trulyExpiredProducts];

      combinedHistory.sort((a, b) => {
        const dateA = new Date(a.consumedDate || a.expirationDate).getTime();
        const dateB = new Date(b.consumedDate || b.expirationDate).getTime();
        return dateB - dateA;
      });

      setAllHistory(combinedHistory);
      LoggingService.info('History', `Loaded ${combinedHistory.length} history items directly`);
      lastLoadTimeRef.current = now;

    } catch (error) {
      LoggingService.error('History', "Failed to load history stats:", error);
      setAllHistory([]);
      setError('Errore durante il caricamento dei dati');
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const shouldLoadData = !dataLoadedRef.current ||
                            (now - lastLoadTimeRef.current) > THROTTLE_TIME;

      if (shouldLoadData) {
        LoggingService.info('History', 'Loading data on focus');
        loadData(false);
        dataLoadedRef.current = true;
      } else {
        LoggingService.info('History', 'Data already loaded, skipping focus load');
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const { consumedCount, expiredCount, suggestions } = useMemo(() => {
    LoggingService.debug('History', 'Starting stats calculation');
    const startTime = performance.now();

    let consumedCount = 0;
    let expiredCount = 0;
    
    for (let i = 0; i < allHistory.length; i++) {
      if (allHistory[i].status === 'consumed') {
        consumedCount++;
      } else {
        expiredCount++;
      }
    }
    
    const totalCount = consumedCount + expiredCount;
    const wastePercentage = totalCount > 0 ? Math.round((expiredCount / totalCount) * 100) : 0;

    const newSuggestions: Array<{
      type: 'info' | 'warning' | 'positive';
      title: string;
      text: string;
    }> = [{
      type: 'info',
      title: 'Elemento consumato per errore?',
      text: "Clicca sul riquadro 'Consumati' per visualizzare la lista e ripristinare i prodotti."
    }];

    if (totalCount > 0) {
      if (wastePercentage > 30) {
        newSuggestions.push({
          type: 'warning',
          title: 'Attenzione ai Prodotti Scaduti',
          text: `Circa il ${wastePercentage}% dei tuoi prodotti è scaduto. Prova a controllare le date più spesso.`
        });
      } else if (wastePercentage < 10 && totalCount > 5) {
        newSuggestions.push({
          type: 'positive',
          title: 'Ottima Gestione!',
          text: `Meno del ${wastePercentage}% dei tuoi prodotti scade. Continua così!`
        });
      }
    }
    
    const endTime = performance.now();
    LoggingService.debug('History', `Stats calculation completed in ${endTime - startTime}ms`);

    return {
      consumedCount,
      expiredCount,
      suggestions: newSuggestions,
    };
  }, [allHistory]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Caricamento statistiche...</Text>
          <Text style={styles.loadingSubtext}>
            Analisi dei tuoi prodotti e abitudini in corso
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.retryButton}>
            <Text style={styles.retryText} onPress={() => loadData(true)}>Riprova</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="history-screen">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Le Tue Abitudini</Text>
          <Text style={styles.subtitle}>
            Analisi dei tuoi consumi e sprechi
          </Text>
        </View>

        <HistoryStats
          totalProducts={consumedCount + expiredCount}
          expiredProducts={expiredCount}
          consumedProducts={consumedCount}
          allProducts={allHistory}
        />
        
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <SuggestionCard key={index} {...suggestion} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// Esportazione predefinita del componente
export default History;

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 10,
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
    marginTop: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  advancedStatsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  advancedStatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  advancedStatsTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  advancedStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 4,
  },
  advancedStatsSubtitle: {
    fontSize: 14,
    color: isDarkMode ? '#8b949e' : '#64748B',
    lineHeight: 20,
  }
});
