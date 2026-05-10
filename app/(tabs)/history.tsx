// history.tsx — history module.
//
// exports: History
// used_by: none
// rules:   - This module is a display-only view component; it must never mutate or modify `allHistory` data directly, only pass it to child components for rendering.
//          - The `useFocusEffect` hook controls data loading logic and debounce (5-second throttle); any changes to data fetching must preserve this ref-based debounce pattern to avoid excessive reloads.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { HistoryStats } from '@/components/HistoryStats';
import { HistoryHeader } from '@/components/history/HistoryHeader';
import { HistoryLoadingState } from '@/components/history/HistoryLoadingState';
import { HistoryErrorState } from '@/components/history/HistoryErrorState';
import { HistorySuggestions } from '@/components/history/HistorySuggestions';
import { useHistoryData } from '@/hooks/useHistoryData';
import { calculateHistoryData } from '@/utils/historyCalculations';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';

/**
 * Componente History - Visualizza la cronologia dei prodotti consumati e scaduti
 * con statistiche e suggerimenti personalizzati.
 */
const History = () => {
  const { isDarkMode } = useTheme();
  const { 
    allHistory, 
    loading, 
    error, 
    refreshing, 
    loadData, 
    setRefreshing, 
    cleanup,
    dataLoadedRef,
    lastLoadTimeRef 
  } = useHistoryData();

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const shouldLoadData = !dataLoadedRef.current || 
                            (now - lastLoadTimeRef.current) > 5000;

      if (shouldLoadData) {
        LoggingService.info('History', 'Loading data on focus');
        loadData(false);
        dataLoadedRef.current = true;
      } else {
        LoggingService.info('History', 'Data already loaded, skipping focus load');
      }

      return () => cleanup();
    }, [loadData, cleanup, dataLoadedRef, lastLoadTimeRef])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData, setRefreshing]);

  const { stats, suggestions } = useMemo(() => 
    calculateHistoryData(allHistory), 
  [allHistory]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa' }]}>
        <HistoryLoadingState isDarkMode={isDarkMode} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa' }]}>
        <HistoryErrorState isDarkMode={isDarkMode} error={error} onRetry={() => loadData(true)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa' }]} 
      testID="history-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <HistoryHeader isDarkMode={isDarkMode} />

        <HistoryStats
          totalProducts={stats.totalCount}
          expiredProducts={stats.expiredCount}
          consumedProducts={stats.consumedCount}
          allProducts={allHistory}
        />

        <HistorySuggestions suggestions={suggestions} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default History;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 10,
  },
});
