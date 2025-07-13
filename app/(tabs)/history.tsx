import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '@/services/StorageService';
import { HistoryStats } from '@/components/HistoryStats';
import { SuggestionCard } from '@/components/SuggestionCard';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { Product } from '@/types/Product';

console.log('[DEBUG] Rendering app/(tabs)/history.tsx');

// Componente per la visualizzazione della cronologia
const History = () => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { getCategoryById } = useCategories();
  const [allHistory, setAllHistory] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const products = await StorageService.getProducts();
      const now = new Date();
      const history = products.filter(p => p.status === 'consumed' || p.status === 'expired' || (p.status === 'active' && new Date(p.expirationDate) < now));
      setAllHistory(history);
    } catch (error) {
      console.error("Failed to load history stats:", error);
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

  const { consumedCount, expiredCount, suggestions } = useMemo(() => {
    const consumed = allHistory.filter(p => p.status === 'consumed');
    const expired = allHistory.filter(p => p.status !== 'consumed');
    
    const wastePercentage = (consumed.length + expired.length) > 0 ? Math.round((expired.length / (consumed.length + expired.length)) * 100) : 0;

    const newSuggestions = [];

    // Suggerimento sulla percentuale di spreco (prodotti scaduti)
    if (wastePercentage > 30) {
      newSuggestions.push({ type: 'warning', title: 'Attenzione ai Prodotti Scaduti', text: `Circa il ${wastePercentage}% dei tuoi prodotti è scaduto. Prova a controllare le date più spesso.` });
    } else if (wastePercentage < 10 && (consumed.length + expired.length) > 5) {
      newSuggestions.push({ type: 'positive', title: 'Ottima Gestione!', text: `Meno del ${wastePercentage}% dei tuoi prodotti scade. Continua così!` });
    }
    
    // Aggiunge il suggerimento per il ripristino in cima alla lista, se necessario
    if (consumed.length > 0) {
      newSuggestions.unshift({
        type: 'info',
        title: 'Elemento consumato per errore?',
        text: "Clicca sul riquadro 'Consumati' per visualizzare la lista e ripristinare i prodotti."
      });
    }

    return {
      consumedCount: consumed.length,
      expiredCount: expired.length,
      suggestions: newSuggestions,
    };
  }, [allHistory, getCategoryById]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento statistiche...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
