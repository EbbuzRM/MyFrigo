import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, Stack } from 'expo-router';
import StatisticsSection from '@/components/StatisticsSection';
import { StatisticsService } from '@/services/StatisticsService';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { COLORS } from '@/constants/colors';
import type {
   MostConsumedProduct,
   MostWastedProduct,
   ChartData
 } from '@/services/StatisticsService';

// Costanti per il timeout
const LOADING_TIMEOUT = 10000; // 10 secondi di timeout per statistiche avanzate

interface StatisticsData {
   mostConsumed: MostConsumedProduct[];
   mostWasted: MostWastedProduct[];
   chartData: ChartData;
 }

const AdvancedStats = () => {
  const { isDarkMode } = useTheme();
  const colors = COLORS[isDarkMode ? 'DARK' : 'LIGHT'];
  const styles = getStyles(isDarkMode, colors);

  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Riferimenti per il timeout e controllo caricamento
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataLoadedRef = useRef<boolean>(false);
  const isLoadingRef = useRef<boolean>(false);

  const loadStatistics = useCallback(async (isRetry = false) => {
    // Evita ricaricamenti multipli
    if (isLoadingRef.current && !isRetry) {
      LoggingService.info('AdvancedStats', 'Loading already in progress, skipping');
      return;
    }

    // Se i dati sono già stati caricati e non è un retry, non ricaricare
    if (dataLoadedRef.current && !isRetry) {
      LoggingService.info('AdvancedStats', 'Data already loaded, skipping');
      return;
    }

    if (!isRetry) {
      setLoading(true);
      setError(null);
      isLoadingRef.current = true;
    }

    // Imposta un timeout per il caricamento
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (loading) {
        LoggingService.error('AdvancedStats', 'Loading timeout reached');
        setLoading(false);
        setError('Caricamento troppo lungo, riprova più tardi');
        isLoadingRef.current = false;
      }
    }, LOADING_TIMEOUT);

    try {
      LoggingService.info('AdvancedStats', 'Loading advanced statistics');
      const startTime = performance.now();

      const stats = await StatisticsService.getAllStatistics();

      const endTime = performance.now();
      LoggingService.info('AdvancedStats', `Statistics loaded in ${endTime - startTime}ms`);

      setStatisticsData(stats);
      setRetryCount(0); // Reset retry count on success
      dataLoadedRef.current = true; // Marca come dati caricati

    } catch (error) {
      LoggingService.error('AdvancedStats', 'Failed to load statistics:', error);
      setStatisticsData(null);
      setError('Errore durante il caricamento delle statistiche');
      dataLoadedRef.current = false; // Reset se c'è un errore
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadStatistics(false);

      return () => {
        // Pulizia quando il componente perde il focus
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }, [loadStatistics])
  );

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadStatistics(true);
  };



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Caricamento statistiche avanzate...</Text>
          <Text style={styles.loadingSubtext}>Questa operazione potrebbe richiedere qualche secondo</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Errore di Caricamento</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>
              Riprova {retryCount > 0 ? `(${retryCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: '',
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

        {/* Sezione Statistiche Dettagliate */}
        {statisticsData && (
          <StatisticsSection
            mostConsumed={statisticsData.mostConsumed || []}
            mostWasted={statisticsData.mostWasted || []}
            chartData={statisticsData.chartData || { labels: [], datasets: [] }}
          />
        )}

        {/* Spazio finale per scroll confortevole */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
    </>
  );
};

const getStyles = (isDarkMode: boolean, colors: typeof COLORS.DARK) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.BACKGROUND,
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AdvancedStats;
