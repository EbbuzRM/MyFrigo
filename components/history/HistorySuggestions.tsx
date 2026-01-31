import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SuggestionCard } from '@/components/SuggestionCard';
import { Suggestion } from '@/types/history';

interface HistorySuggestionsProps {
  suggestions: Suggestion[];
}

/**
 * Componente per visualizzare i suggerimenti nella schermata History
 */
export function HistorySuggestions({ suggestions }: HistorySuggestionsProps) {
  return (
    <View style={styles.container}>
      {suggestions.map((suggestion, index) => (
        <SuggestionCard key={index} {...suggestion} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
});
