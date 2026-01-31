import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HistoryErrorStateProps {
  isDarkMode: boolean;
  error: string;
  onRetry: () => void;
}

/**
 * Componente per lo stato di errore della schermata History
 */
export function HistoryErrorState({ isDarkMode, error, onRetry }: HistoryErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{error}</Text>
      <View style={styles.retryButton}>
        <Text style={styles.retryText} onPress={onRetry}>Riprova</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
});
