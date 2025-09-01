import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '@/services/StorageService';
import { HistoryStats } from '@/components/HistoryStats';
import { SuggestionCard } from '@/components/SuggestionCard';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';

// Costanti per il timeout e la memorizzazione
const LOADING_TIMEOUT = 5000; // 5 secondi di timeout

// Componente per la visualizzazione della cronologia
const History = () => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { getCategoryById } = useCategories();
  const [allHistory, setAllHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Riferimenti per il timeout e la memorizzazione
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadTimeRef = useRef<number>(0);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Evita caricamenti frequenti (throttling)
    const now = Date.now();
    if (!forceRefresh && now - lastLoadTimeRef.current < 2000) {
      LoggingService.info('History', 'Throttling data load - skipped');
      setRefreshing(false);
      return;
    }
    
    // Imposta lo stato di caricamento
    setLoading(true);
    setError(null);
    
    // Imposta un timeout per il caricamento
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
    
    // Registra l'inizio del caricamento
    const startTime = performance.now();
    LoggingService.info('History', 'Starting data load');
    
    try {
      // Carica i prodotti
      const { data: products, error } = await StorageService.getProducts();
      if (error) {
        throw error;
      }
      
      if (products) {
        LoggingService.info('History', `Loaded ${products.length} products`);
        
        // Ottimizza il filtro usando un solo ciclo
        const now = new Date();
        const history = [];
        
        // Usa un ciclo for tradizionale per migliori performance
        for (let i = 0; i < products.length; i++) {
          const p = products[i];
          if (p.status === 'consumed' ||
              p.status === 'expired' ||
              (p.status === 'active' && new Date(p.expirationDate) < now)) {
            history.push(p);
          }
        }
        
        setAllHistory(history);
        LoggingService.info('History', `Filtered ${history.length} history items`);
      } else {
        setAllHistory([]);
      }
      
      // Registra il tempo di caricamento
      const endTime = performance.now();
      LoggingService.info('History', `Data load completed in ${endTime - startTime}ms`);
      lastLoadTimeRef.current = now;

    } catch (error) {
      LoggingService.error('History', "Failed to load history stats:", error);
      setAllHistory([]); // Assicura che lo stato sia pulito in caso di errore
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
      loadData(false);
      
      return () => {
        // Pulizia quando il componente perde il focus
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true); // Forza il refresh
  };

  // Ottimizzazione: calcola i conteggi una sola volta durante il filtraggio
  const { consumedCount, expiredCount, suggestions } = useMemo(() => {
    // Misura il tempo di esecuzione
    const startTime = performance.now();
    LoggingService.debug('History', 'Starting stats calculation');
    
    let consumedCount = 0;
    let expiredCount = 0;
    
    // Calcola i conteggi in un solo passaggio
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

    // Aggiungi suggerimenti solo se ci sono abbastanza dati
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
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Caricamento statistiche...</Text>
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
    marginTop: 4,
  }
});
