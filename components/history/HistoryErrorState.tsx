// HistoryErrorState.tsx — HistoryErrorState module.
//
// exports: HistoryErrorState
// used_by: app\(tabs)\history.tsx
// rules:   - All UI components must accept an `isDarkMode` prop and use it to toggle between light/dark color schemes
//          - Error states must always include a retry action with `onRetry` callback and display error text in a consistent error color
//          - Font families must use Inter variants (Inter-Medium, Inter-Regular, etc.) consistently across all components
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
