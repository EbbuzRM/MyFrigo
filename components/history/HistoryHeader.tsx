import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HistoryHeaderProps {
  isDarkMode: boolean;
}

/**
 * Componente Header per la schermata History
 * Visualizza il titolo e il sottotitolo della sezione
 */
export function HistoryHeader({ isDarkMode }: HistoryHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: isDarkMode ? '#c9d1d9' : '#1e293b' }]}>
        Le Tue Abitudini
      </Text>
      <Text style={[styles.subtitle, { color: isDarkMode ? '#8b949e' : '#64748B' }]}>
        Analisi dei tuoi consumi e sprechi
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
});
