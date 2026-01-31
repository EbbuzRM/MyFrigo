import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface HistoryLoadingStateProps {
  isDarkMode: boolean;
}

/**
 * Componente per lo stato di caricamento della schermata History
 */
export function HistoryLoadingState({ isDarkMode }: HistoryLoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={[styles.loadingText, { color: isDarkMode ? '#8b949e' : '#64748B' }]}>
        Caricamento statistiche...
      </Text>
      <Text style={[styles.loadingSubtext, { color: isDarkMode ? '#8b949e' : '#64748B' }]}>
        Analisi dei tuoi prodotti e abitudini in corso
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 10,
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
});
