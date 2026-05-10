// HistorySuggestions.tsx — HistorySuggestions module.
//
// exports: HistorySuggestions
// used_by: app\(tabs)\history.tsx
// rules:   - Must not introduce any data fetching logic, local state management, or side effects; component must remain purely presentational with data injected via props only.
//          - Child rendering must be delegated exclusively to SuggestionCard components; no other rendering logic or wrapper components may be added to the render output.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
